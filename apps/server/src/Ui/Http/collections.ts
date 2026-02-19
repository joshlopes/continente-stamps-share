import { Hono } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/index.js';

function serializeCollection(collection: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    ...collection,
    startsAt: (collection.startsAt as Date).toISOString().split('T')[0],
    endsAt: (collection.endsAt as Date).toISOString().split('T')[0],
    createdAt: (collection.createdAt as Date).toISOString(),
    updatedAt: (collection.updatedAt as Date).toISOString(),
  };

  // Remove creator relation if present (not needed in public API)
  delete result.creator;
  delete result.createdBy;

  // Serialize nested items if present
  if (Array.isArray(collection.items)) {
    result.items = (collection.items as Record<string, unknown>[]).map((item) => {
      const serializedItem: Record<string, unknown> = {
        ...item,
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
      };

      // Serialize nested options if present
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

export function collectionRoutes(prisma: PrismaClient): Hono {
  const app = new Hono();

  /**
   * GET /
   * Get active collections with their items and redemption options.
   */
  app.get('/', async (c) => {
    try {
      const collections = await prisma.stampCollection.findMany({
        where: {
          isActive: true,
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

  return app;
}
