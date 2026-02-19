import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import { authRoutes } from './auth.js';
import { profileRoutes } from './profile.js';
import { listingRoutes } from './listings.js';
import { collectionRoutes } from './collections.js';
import { leaderboardRoutes } from './leaderboard.js';
import { adminRoutes } from './admin.js';

export function createApp(prisma: PrismaClient): Hono {
  const app = new Hono();

  // CORS - allow all origins for now
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }));

  // Health check endpoints
  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Routes
  app.route('/api/auth', authRoutes(prisma));
  app.route('/api/profile', profileRoutes(prisma));
  app.route('/api/listings', listingRoutes(prisma));
  app.route('/api/collections', collectionRoutes(prisma));
  app.route('/api/leaderboard', leaderboardRoutes(prisma));
  app.route('/api/admin', adminRoutes(prisma));

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
  });

  // Error handler
  app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
