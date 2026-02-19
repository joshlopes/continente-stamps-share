import { Hono } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/index.js';

export function leaderboardRoutes(prisma: PrismaClient): Hono {
  const app = new Hono();

  /**
   * GET /
   * Get top 50 profiles ordered by points descending.
   */
  app.get('/', async (c) => {
    try {
      const profiles = await prisma.profile.findMany({
        select: {
          id: true,
          displayName: true,
          district: true,
          points: true,
          level: true,
          tier: true,
          totalOffered: true,
          totalRequested: true,
        },
        orderBy: { points: 'desc' },
        take: 50,
      });

      return c.json({ leaderboard: profiles });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return c.json({ error: 'Failed to fetch leaderboard' }, 500);
    }
  });

  return app;
}
