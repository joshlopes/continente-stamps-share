import { Hono } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import { CreateListingRequestSchema } from '@stamps-share/shared';
import { authMiddleware, optionalAuthMiddleware } from './middleware.js';
import { reverseOfferBalance, completeListingPoints } from '../../services/gamification.js';

function serializeListing(listing: Record<string, unknown>) {
  const result: Record<string, unknown> = {
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
  };

  // Serialize nested user profile summary if present
  if (listing.user && typeof listing.user === 'object') {
    const user = listing.user as Record<string, unknown>;
    result.user = {
      id: user.id,
      displayName: user.displayName,
      level: user.level,
      tier: user.tier,
      points: user.points,
    };
  }

  return result;
}

export function listingRoutes(prisma: PrismaClient): Hono {
  const app = new Hono();

  /**
   * GET /
   * Get listings with optional filters: ?type, ?status, ?userId
   */
  app.get('/', optionalAuthMiddleware(prisma), async (c) => {
    const typeFilter = c.req.query('type');
    const statusFilter = c.req.query('status');
    const userIdFilter = c.req.query('userId');

    try {
      const where: Record<string, unknown> = {};

      if (typeFilter && (typeFilter === 'offer' || typeFilter === 'request')) {
        where.type = typeFilter;
      }
      if (statusFilter) {
        where.status = statusFilter;
      }
      if (userIdFilter) {
        where.userId = userIdFilter;
      }

      const listings = await prisma.stampListing.findMany({
        where,
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
        take: 100,
      });

      return c.json({
        listings: listings.map((l) => serializeListing(l as unknown as Record<string, unknown>)),
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      return c.json({ error: 'Failed to fetch listings' }, 500);
    }
  });

  /**
   * POST /
   * Create a new listing. Offers get 'pending_validation', requests get 'active'.
   */
  app.post('/', authMiddleware(prisma), async (c) => {
    const profile = c.get('profile') as { id: string };
    const body = await c.req.json();
    const parsed = CreateListingRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      // Check for conflicting active listings of the same type
      const conflicting = await prisma.stampListing.findFirst({
        where: {
          userId: profile.id,
          type: parsed.data.type,
          status: {
            in: ['active', 'pending_validation'],
          },
        },
      });

      if (conflicting) {
        return c.json(
          {
            error: `You already have an active ${parsed.data.type} listing. Cancel it first.`,
            code: 'CONFLICTING_LISTING',
          },
          409,
        );
      }

      const status = parsed.data.type === 'offer' ? 'pending_validation' : 'active';

      // Set expiry to 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const listing = await prisma.stampListing.create({
        data: {
          userId: profile.id,
          type: parsed.data.type,
          quantity: parsed.data.quantity,
          collection: parsed.data.collection ?? null,
          notes: parsed.data.notes ?? null,
          status,
          expiresAt,
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
        listing: serializeListing(listing as unknown as Record<string, unknown>),
      }, 201);
    } catch (error) {
      console.error('Error creating listing:', error);
      return c.json({ error: 'Failed to create listing' }, 500);
    }
  });

  /**
   * PUT /:id/cancel
   * Cancel own listing. If it was an active offer, reverse the balance.
   */
  app.put('/:id/cancel', authMiddleware(prisma), async (c) => {
    const profile = c.get('profile') as { id: string };
    const listingId = c.req.param('id');

    try {
      const listing = await prisma.stampListing.findUnique({
        where: { id: listingId },
      });

      if (!listing) {
        return c.json({ error: 'Listing not found' }, 404);
      }

      if (listing.userId !== profile.id) {
        return c.json({ error: 'Not your listing', code: 'FORBIDDEN' }, 403);
      }

      if (listing.status !== 'active' && listing.status !== 'pending_validation') {
        return c.json({ error: 'Listing cannot be cancelled in its current status' }, 400);
      }

      // If it was an approved (active) offer, reverse the balance
      if (listing.type === 'offer' && listing.status === 'active') {
        await reverseOfferBalance(prisma, listing.userId, listing.quantity);
      }

      const updated = await prisma.stampListing.update({
        where: { id: listingId },
        data: { status: 'cancelled' },
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
        listing: serializeListing(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error cancelling listing:', error);
      return c.json({ error: 'Failed to cancel listing' }, 500);
    }
  });

  /**
   * PUT /:id/fulfill
   * Fulfill a listing. Validates not self, listing is active.
   */
  app.put('/:id/fulfill', authMiddleware(prisma), async (c) => {
    const profile = c.get('profile') as { id: string };
    const listingId = c.req.param('id');

    try {
      const listing = await prisma.stampListing.findUnique({
        where: { id: listingId },
      });

      if (!listing) {
        return c.json({ error: 'Listing not found' }, 404);
      }

      if (listing.userId === profile.id) {
        return c.json({ error: 'Cannot fulfill your own listing' }, 400);
      }

      if (listing.status !== 'active') {
        return c.json({ error: 'Listing is not active' }, 400);
      }

      await completeListingPoints(prisma, listingId, profile.id);

      const updated = await prisma.stampListing.findUnique({
        where: { id: listingId },
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
        listing: serializeListing(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error fulfilling listing:', error);
      return c.json({ error: 'Failed to fulfill listing' }, 500);
    }
  });

  return app;
}
