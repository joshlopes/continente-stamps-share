import { Hono } from 'hono';
import type { AppEnv } from './types.js';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import {
  CreateCollectionRequestSchema,
  CreateCollectionItemRequestSchema,
  CreateRedemptionOptionRequestSchema,
  RejectOfferRequestSchema,
} from '@stamps-share/shared';
import { adminMiddleware } from './middleware.js';
import { awardOfferBalance } from '../../services/gamification.js';

function serializeListing(listing: Record<string, unknown>) {
  return {
    ...listing,
    fulfilledAt: listing.fulfilledAt
      ? (listing.fulfilledAt as Date).toISOString()
      : null,
    validatedAt: listing.validatedAt
      ? (listing.validatedAt as Date).toISOString()
      : null,
    expiresAt: listing.expiresAt
      ? (listing.expiresAt as Date).toISOString()
      : null,
    createdAt: (listing.createdAt as Date).toISOString(),
    updatedAt: (listing.updatedAt as Date).toISOString(),
    user: listing.user
      ? (() => {
          const u = listing.user as Record<string, unknown>;
          return {
            id: u.id,
            displayName: u.displayName,
            level: u.level,
            tier: u.tier,
            points: u.points,
          };
        })()
      : undefined,
  };
}

function serializeCollection(collection: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    ...collection,
    startsAt: (collection.startsAt as Date).toISOString().split('T')[0],
    endsAt: (collection.endsAt as Date).toISOString().split('T')[0],
    createdAt: (collection.createdAt as Date).toISOString(),
    updatedAt: (collection.updatedAt as Date).toISOString(),
  };

  delete result.creator;

  if (Array.isArray(collection.items)) {
    result.items = (collection.items as Record<string, unknown>[]).map((item) => {
      const serializedItem: Record<string, unknown> = {
        ...item,
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
      };
      if (Array.isArray(item.options)) {
        serializedItem.options = (item.options as Record<string, unknown>[]).map((opt) => ({
          ...opt,
          feeEuros: Number(opt.feeEuros),
          createdAt: (opt.createdAt as Date).toISOString(),
        }));
      }
      return serializedItem;
    });
  }

  return result;
}

export function adminRoutes(prisma: PrismaClient): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // All admin routes require admin middleware
  app.use('*', adminMiddleware(prisma));

  // ============================================================================
  // Offer Management
  // ============================================================================

  /**
   * GET /pending-offers
   * Get offers with status 'pending_validation'.
   */
  app.get('/pending-offers', async (c) => {
    try {
      const offers = await prisma.stampListing.findMany({
        where: {
          type: 'offer',
          status: 'pending_validation',
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              level: true,
              tier: true,
              points: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return c.json({
        offers: offers.map((o) => serializeListing(o as unknown as Record<string, unknown>)),
      });
    } catch (error) {
      console.error('Error fetching pending offers:', error);
      return c.json({ error: 'Failed to fetch pending offers' }, 500);
    }
  });

  /**
   * PUT /offers/:id/approve
   * Approve an offer and award balance to the user.
   */
  app.put('/offers/:id/approve', async (c) => {
    const profile = c.get('profile') as { id: string };
    const offerId = c.req.param('id');

    try {
      const offer = await prisma.stampListing.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        return c.json({ error: 'Offer not found' }, 404);
      }

      if (offer.status !== 'pending_validation') {
        return c.json({ error: 'Offer is not pending validation' }, 400);
      }

      // Award balance to the offerer
      await awardOfferBalance(prisma, offer.userId, offer.quantity);

      // Update listing status
      const updated = await prisma.stampListing.update({
        where: { id: offerId },
        data: {
          status: 'active',
          validatedBy: profile.id,
          validatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              level: true,
              tier: true,
              points: true,
            },
          },
        },
      });

      return c.json({
        offer: serializeListing(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error approving offer:', error);
      return c.json({ error: 'Failed to approve offer' }, 500);
    }
  });

  /**
   * PUT /offers/:id/reject
   * Reject an offer with optional reason.
   */
  app.put('/offers/:id/reject', async (c) => {
    const profile = c.get('profile') as { id: string };
    const offerId = c.req.param('id');

    let reason: string | undefined;
    try {
      const body = await c.req.json();
      const parsed = RejectOfferRequestSchema.safeParse(body);
      if (parsed.success) {
        reason = parsed.data.reason;
      }
    } catch {
      // No body or invalid JSON is OK - reason is optional
    }

    try {
      const offer = await prisma.stampListing.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        return c.json({ error: 'Offer not found' }, 404);
      }

      if (offer.status !== 'pending_validation') {
        return c.json({ error: 'Offer is not pending validation' }, 400);
      }

      const updated = await prisma.stampListing.update({
        where: { id: offerId },
        data: {
          status: 'rejected',
          rejectionReason: reason ?? null,
          validatedBy: profile.id,
          validatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              level: true,
              tier: true,
              points: true,
            },
          },
        },
      });

      return c.json({
        offer: serializeListing(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error rejecting offer:', error);
      return c.json({ error: 'Failed to reject offer' }, 500);
    }
  });

  // ============================================================================
  // Collection Management
  // ============================================================================

  /**
   * GET /collections
   * List all collections (including inactive).
   */
  app.get('/collections', async (c) => {
    try {
      const collections = await prisma.stampCollection.findMany({
        include: {
          items: {
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return c.json({
        collections: collections.map((col) =>
          serializeCollection(col as unknown as Record<string, unknown>),
        ),
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
      return c.json({ error: 'Failed to fetch collections' }, 500);
    }
  });

  /**
   * POST /collections
   * Create a new collection.
   */
  app.post('/collections', async (c) => {
    const profile = c.get('profile') as { id: string };
    const body = await c.req.json();
    const parsed = CreateCollectionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      const collection = await prisma.stampCollection.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          imageUrl: parsed.data.imageUrl ?? null,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: new Date(parsed.data.endsAt),
          isActive: parsed.data.isActive ?? true,
          sortOrder: parsed.data.sortOrder ?? 0,
          createdBy: profile.id,
        },
        include: {
          items: {
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return c.json({
        collection: serializeCollection(collection as unknown as Record<string, unknown>),
      }, 201);
    } catch (error) {
      console.error('Error creating collection:', error);
      return c.json({ error: 'Failed to create collection' }, 500);
    }
  });

  /**
   * PUT /collections/:id
   * Update a collection.
   */
  app.put('/collections/:id', async (c) => {
    const collectionId = c.req.param('id');
    const body = await c.req.json();
    const parsed = CreateCollectionRequestSchema.partial().safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      const existing = await prisma.stampCollection.findUnique({
        where: { id: collectionId },
      });

      if (!existing) {
        return c.json({ error: 'Collection not found' }, 404);
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
      if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
      if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
      if (parsed.data.startsAt !== undefined) updateData.startsAt = new Date(parsed.data.startsAt);
      if (parsed.data.endsAt !== undefined) updateData.endsAt = new Date(parsed.data.endsAt);
      if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
      if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;

      const updated = await prisma.stampCollection.update({
        where: { id: collectionId },
        data: updateData,
        include: {
          items: {
            include: {
              options: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return c.json({
        collection: serializeCollection(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error updating collection:', error);
      return c.json({ error: 'Failed to update collection' }, 500);
    }
  });

  /**
   * DELETE /collections/:id
   * Delete a collection (cascades to items and options).
   */
  app.delete('/collections/:id', async (c) => {
    const collectionId = c.req.param('id');

    try {
      const existing = await prisma.stampCollection.findUnique({
        where: { id: collectionId },
      });

      if (!existing) {
        return c.json({ error: 'Collection not found' }, 404);
      }

      await prisma.stampCollection.delete({
        where: { id: collectionId },
      });

      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting collection:', error);
      return c.json({ error: 'Failed to delete collection' }, 500);
    }
  });

  // ============================================================================
  // Collection Item Management
  // ============================================================================

  /**
   * POST /collections/:collectionId/items
   * Create a new item in a collection.
   */
  app.post('/collections/:collectionId/items', async (c) => {
    const collectionId = c.req.param('collectionId');
    const body = await c.req.json();
    const parsed = CreateCollectionItemRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      const collection = await prisma.stampCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        return c.json({ error: 'Collection not found' }, 404);
      }

      const item = await prisma.collectionItem.create({
        data: {
          collectionId,
          name: parsed.data.name,
          subtitle: parsed.data.subtitle ?? null,
          imageUrl: parsed.data.imageUrl ?? null,
          sortOrder: parsed.data.sortOrder ?? 0,
        },
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return c.json({
        item: {
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          options: item.options.map((opt) => ({
            ...opt,
            feeEuros: Number(opt.feeEuros),
            createdAt: opt.createdAt.toISOString(),
          })),
        },
      }, 201);
    } catch (error) {
      console.error('Error creating collection item:', error);
      return c.json({ error: 'Failed to create item' }, 500);
    }
  });

  /**
   * PUT /collections/:collectionId/items/:itemId
   * Update a collection item.
   */
  app.put('/collections/:collectionId/items/:itemId', async (c) => {
    const collectionId = c.req.param('collectionId');
    const itemId = c.req.param('itemId');
    const body = await c.req.json();
    const parsed = CreateCollectionItemRequestSchema.partial().safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      const item = await prisma.collectionItem.findFirst({
        where: { id: itemId, collectionId },
      });

      if (!item) {
        return c.json({ error: 'Item not found' }, 404);
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
      if (parsed.data.subtitle !== undefined) updateData.subtitle = parsed.data.subtitle;
      if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
      if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;

      const updated = await prisma.collectionItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return c.json({
        item: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          options: updated.options.map((opt) => ({
            ...opt,
            feeEuros: Number(opt.feeEuros),
            createdAt: opt.createdAt.toISOString(),
          })),
        },
      });
    } catch (error) {
      console.error('Error updating collection item:', error);
      return c.json({ error: 'Failed to update item' }, 500);
    }
  });

  /**
   * DELETE /collections/:collectionId/items/:itemId
   * Delete a collection item (cascades to options).
   */
  app.delete('/collections/:collectionId/items/:itemId', async (c) => {
    const collectionId = c.req.param('collectionId');
    const itemId = c.req.param('itemId');

    try {
      const item = await prisma.collectionItem.findFirst({
        where: { id: itemId, collectionId },
      });

      if (!item) {
        return c.json({ error: 'Item not found' }, 404);
      }

      await prisma.collectionItem.delete({
        where: { id: itemId },
      });

      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting collection item:', error);
      return c.json({ error: 'Failed to delete item' }, 500);
    }
  });

  // ============================================================================
  // Redemption Option Management
  // ============================================================================

  /**
   * POST /collections/:collectionId/items/:itemId/options
   * Create a redemption option for an item.
   */
  app.post('/collections/:collectionId/items/:itemId/options', async (c) => {
    const collectionId = c.req.param('collectionId');
    const itemId = c.req.param('itemId');
    const body = await c.req.json();
    const parsed = CreateRedemptionOptionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      const item = await prisma.collectionItem.findFirst({
        where: { id: itemId, collectionId },
      });

      if (!item) {
        return c.json({ error: 'Item not found' }, 404);
      }

      const option = await prisma.redemptionOption.create({
        data: {
          itemId,
          stampsRequired: parsed.data.stampsRequired,
          feeEuros: parsed.data.feeEuros ?? 0,
          label: parsed.data.label ?? null,
          sortOrder: parsed.data.sortOrder ?? 0,
        },
      });

      return c.json({
        option: {
          ...option,
          feeEuros: Number(option.feeEuros),
          createdAt: option.createdAt.toISOString(),
        },
      }, 201);
    } catch (error) {
      console.error('Error creating redemption option:', error);
      return c.json({ error: 'Failed to create option' }, 500);
    }
  });

  // ============================================================================
  // App Settings
  // ============================================================================

  /**
   * GET /settings
   * Get app settings.
   */
  app.get('/settings', async (c) => {
    try {
      let settings = await prisma.appSettings.findUnique({
        where: { id: 'global' },
      });

      if (!settings) {
        settings = await prisma.appSettings.create({
          data: { id: 'global' },
        });
      }

      return c.json({
        settings: {
          ...settings,
          updatedAt: settings.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return c.json({ error: 'Failed to fetch settings' }, 500);
    }
  });

  /**
   * PUT /settings
   * Update app settings.
   */
  app.put('/settings', async (c) => {
    const profile = c.get('profile') as { id: string };
    const body = await c.req.json();

    try {
      const settings = await prisma.appSettings.upsert({
        where: { id: 'global' },
        create: {
          id: 'global',
          adminDevicePhone: body.adminDevicePhone ?? '',
          updatedBy: profile.id,
        },
        update: {
          adminDevicePhone: body.adminDevicePhone ?? undefined,
          updatedBy: profile.id,
          updatedAt: new Date(),
        },
      });

      return c.json({
        settings: {
          ...settings,
          updatedAt: settings.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return c.json({ error: 'Failed to update settings' }, 500);
    }
  });

  return app;
}
