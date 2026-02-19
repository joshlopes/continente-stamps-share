import { Hono } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import { UpdateProfileRequestSchema } from '@stamps-share/shared';
import { authMiddleware } from './middleware.js';

function serializeProfile(profile: Record<string, unknown>) {
  return {
    ...profile,
    dateOfBirth: profile.dateOfBirth
      ? (profile.dateOfBirth as Date).toISOString().split('T')[0]
      : null,
    weeklyResetAt: (profile.weeklyResetAt as Date).toISOString(),
    createdAt: (profile.createdAt as Date).toISOString(),
    updatedAt: (profile.updatedAt as Date).toISOString(),
  };
}

export function profileRoutes(prisma: PrismaClient): Hono {
  const app = new Hono();

  // All profile routes require authentication
  app.use('*', authMiddleware(prisma));

  /**
   * PUT /
   * Update the current user's profile.
   */
  app.put('/', async (c) => {
    const profile = c.get('profile') as { id: string };
    const body = await c.req.json();
    const parsed = UpdateProfileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
    }

    try {
      const updateData: Record<string, unknown> = {};

      if (parsed.data.displayName !== undefined) {
        updateData.displayName = parsed.data.displayName;
      }
      if (parsed.data.email !== undefined) {
        updateData.email = parsed.data.email;
      }
      if (parsed.data.dateOfBirth !== undefined) {
        updateData.dateOfBirth = new Date(parsed.data.dateOfBirth);
      }
      if (parsed.data.district !== undefined) {
        updateData.district = parsed.data.district;
      }
      if (parsed.data.registrationComplete !== undefined) {
        updateData.registrationComplete = parsed.data.registrationComplete;
      }

      const updated = await prisma.profile.update({
        where: { id: profile.id },
        data: updateData,
      });

      return c.json({
        profile: serializeProfile(updated as unknown as Record<string, unknown>),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  });

  return app;
}
