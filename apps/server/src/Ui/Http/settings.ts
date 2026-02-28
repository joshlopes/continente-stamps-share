import { Hono } from 'hono';
import type { AppEnv } from './types.js';
import type { PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Public settings routes - accessible without authentication
 * Used to get public configuration like admin device phone
 */
export function settingsRoutes(prisma: PrismaClient): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  /**
   * GET /public
   * Get public app settings (admin device phone).
   * This endpoint is accessible to all authenticated and unauthenticated users.
   */
  app.get('/public', async (c) => {
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
          adminDevicePhone: settings.adminDevicePhone,
        },
      });
    } catch (error) {
      console.error('Error fetching public settings:', error);
      return c.json({ error: 'Failed to fetch settings' }, 500);
    }
  });

  return app;
}

