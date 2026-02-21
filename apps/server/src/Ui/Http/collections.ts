import { Hono } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/client.js';

function serializeDateField(value: unknown): string {
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      return value.toISOString();
    }
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

function serializeDateOnlyField(value: unknown): string {
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
    const str = String(value);
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return str;
  }
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

  // Remove creator relation if present (not needed in public API)
  delete result.creator;
  delete result.createdBy;

  // Serialize nested items if present
  if (Array.isArray(collection.items)) {
    result.items = (collection.items as Record<string, unknown>[]).map((item) => {
      const serializedItem: Record<string, unknown> = {
        ...item,
        createdAt: serializeDateField(item.createdAt),
        updatedAt: serializeDateField(item.updatedAt),
      };

      // Serialize nested options if present
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
