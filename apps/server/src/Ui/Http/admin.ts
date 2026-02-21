import { Hono } from 'hono';
import type { AppEnv } from './types.js';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import {
  CreateCollectionRequestSchema,
  CreateCollectionItemRequestSchema,
  CreateRedemptionOptionRequestSchema,
  RejectOfferRequestSchema,
} from '@stamps-share/shared';
import { adminMiddleware } from './middleware.js';
import { awardOfferBalance, awardRequestFulfilled } from '../../services/gamification.js';
import { logOfferApproved, logOfferRejected, logRequestFulfilled } from '../../services/audit.js';

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

function serializeListingWithPhone(listing: Record<string, unknown>) {
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
            phone: u.phone,
            level: u.level,
            tier: u.tier,
            points: u.points,
          };
        })()
      : undefined,
  };
}

function serializeDateField(value: unknown): string {
  if (value instanceof Date) {
    // Check if the date is valid
    if (!isNaN(value.getTime())) {
      return value.toISOString();
    }
    // Invalid date - return a fallback
    return String(value);
  }
  // Handle string dates (e.g., "2026-02-20" from DATE columns)
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

function serializeDateOnlyField(value: unknown): string {
  if (value instanceof Date) {
    // Check if the date is valid
    if (!isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
    // Invalid date - try to extract year-month-day from string representation
    const str = String(value);
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return str;
  }
  // Handle string dates (e.g., "2026-02-20" from DATE columns)
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  return String(value);
}

function serializeCollection(collection: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    ...collection,
    startsAt: serializeDateOnlyField(collection.startsAt),
    endsAt: serializeDateOnlyField(collection.endsAt),
    createdAt: serializeDateField(collection.createdAt),
    updatedAt: serializeDateField(collection.updatedAt),
  };

  delete result.creator;

  if (Array.isArray(collection.items)) {
    result.items = (collection.items as Record<string, unknown>[]).map((item) => {
      const serializedItem: Record<string, unknown> = {
        ...item,
        createdAt: serializeDateField(item.createdAt),
        updatedAt: serializeDateField(item.updatedAt),
      };
      if (Array.isArray(item.options)) {
        serializedItem.options = (item.options as Record<string, unknown>[]).map((opt) => ({
          ...opt,
          feeEuros: Number(opt.feeEuros),
          createdAt: serializeDateField(opt.createdAt),
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
              phone: true,
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
        offers: offers.map((o) => serializeListingWithPhone(o as unknown as Record<string, unknown>)),
      });
    } catch (error) {
      console.error('Error fetching pending offers:', error);
      return c.json({ error: 'Failed to fetch pending offers' }, 500);
    }
  });

  /**
   * PUT /offers/:id/approve
   * Approve an offer and award balance to the user.
   * Accepts optional { quantity } in body to adjust the actual amount received.
   */
  app.put('/offers/:id/approve', async (c) => {
    const profile = c.get('profile') as { id: string };
    const offerId = c.req.param('id');

    try {
      // Parse optional quantity adjustment from body
      let adjustedQuantity: number | undefined;
      try {
        const body = await c.req.json();
        if (body && typeof body.quantity === 'number' && body.quantity > 0) {
          adjustedQuantity = body.quantity;
        }
      } catch {
        // No body or invalid JSON - use original quantity
      }

      const offer = await prisma.stampListing.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        return c.json({ error: 'Offer not found' }, 404);
      }

      if (offer.status !== 'pending_validation') {
        return c.json({ error: 'Offer is not pending validation' }, 400);
      }

      // Use adjusted quantity if provided, otherwise use original
      const finalQuantity = adjustedQuantity ?? offer.quantity;

      // Award balance to the offerer with the final quantity
      await awardOfferBalance(prisma, offer.userId, finalQuantity);

      // Update listing status to fulfilled (offer complete, stamps received)
      // Also update quantity if it was adjusted
      const updated = await prisma.stampListing.update({
        where: { id: offerId },
        data: {
          status: 'fulfilled',
          quantity: finalQuantity,
          validatedBy: profile.id,
          validatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              displayName: true,
              level: true,
              tier: true,
              points: true,
            },
          },
        },
      });

      // Audit log
      await logOfferApproved(prisma, {
        id: offer.id,
        userId: offer.userId,
        originalQuantity: offer.quantity,
        approvedQuantity: finalQuantity,
      }, {
        actorId: profile.id,
        ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
      });

      return c.json({
        offer: serializeListingWithPhone(updated as unknown as Record<string, unknown>),
        quantityAdjusted: adjustedQuantity !== undefined && adjustedQuantity !== offer.quantity,
        originalQuantity: offer.quantity,
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

      // Audit log
      await logOfferRejected(prisma, {
        id: offer.id,
        userId: offer.userId,
        reason,
      }, {
        actorId: profile.id,
        ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
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
  // Request Management
  // ============================================================================

  /**
   * GET /active-requests
   * Get requests with status 'active' including user phone number.
   */
  app.get('/active-requests', async (c) => {
    try {
      const requests = await prisma.stampListing.findMany({
        where: {
          type: 'request',
          status: 'active',
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              phone: true,
              level: true,
              tier: true,
              points: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return c.json({
        requests: requests.map((r) => serializeListingWithPhone(r as unknown as Record<string, unknown>)),
      });
    } catch (error) {
      console.error('Error fetching active requests:', error);
      return c.json({ error: 'Failed to fetch active requests' }, 500);
    }
  });

  /**
   * PUT /requests/:id/fulfill
   * Mark a request as fulfilled (stamps sent by admin).
   */
  app.put('/requests/:id/fulfill', async (c) => {
    const profile = c.get('profile') as { id: string };
    const requestId = c.req.param('id');

    try {
      const request = await prisma.stampListing.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return c.json({ error: 'Request not found' }, 404);
      }

      if (request.type !== 'request') {
        return c.json({ error: 'This is not a request' }, 400);
      }

      if (request.status !== 'active') {
        return c.json({ error: 'Request is not active' }, 400);
      }

      // Award points to the requester
      await awardRequestFulfilled(prisma, request.userId, request.quantity);

      // Update listing status to fulfilled
      const updated = await prisma.stampListing.update({
        where: { id: requestId },
        data: {
          status: 'fulfilled',
          fulfilledBy: profile.id,
          fulfilledAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              phone: true,
              level: true,
              tier: true,
              points: true,
            },
          },
        },
      });

      // Audit log
      await logRequestFulfilled(prisma, {
        id: request.id,
        userId: request.userId,
        quantity: request.quantity,
      }, {
        actorId: profile.id,
        ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
      });

      return c.json({
        request: serializeListingWithPhone(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error fulfilling request:', error);
      return c.json({ error: 'Failed to fulfill request' }, 500);
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

  /**
   * DELETE /collections/:collectionId/items/:itemId/options/:optionId
   * Delete a redemption option.
   */
  app.delete('/collections/:collectionId/items/:itemId/options/:optionId', async (c) => {
    const collectionId = c.req.param('collectionId');
    const itemId = c.req.param('itemId');
    const optionId = c.req.param('optionId');

    try {
      // Verify the item belongs to the collection
      const item = await prisma.collectionItem.findFirst({
        where: { id: itemId, collectionId },
      });

      if (!item) {
        return c.json({ error: 'Item not found' }, 404);
      }

      // Verify the option belongs to the item
      const option = await prisma.redemptionOption.findFirst({
        where: { id: optionId, itemId },
      });

      if (!option) {
        return c.json({ error: 'Option not found' }, 404);
      }

      await prisma.redemptionOption.delete({
        where: { id: optionId },
      });

      return c.json({ success: true });
    } catch (error) {
      console.error('Error deleting redemption option:', error);
      return c.json({ error: 'Failed to delete option' }, 500);
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
