import type { Context, Next } from 'hono';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import { getSessionByToken } from '../../services/auth.js';

/**
 * Authentication middleware.
 * Reads Bearer token from Authorization header, validates session,
 * and sets profile + session on the context.
 */
export function authMiddleware(prisma: PrismaClient) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }

    const token = authHeader.slice(7);
    const result = await getSessionByToken(prisma, token);

    if (!result) {
      return c.json({ error: 'Session expired', code: 'SESSION_EXPIRED' }, 401);
    }

    c.set('profile', result.profile);
    c.set('session', result.session);
    await next();
  };
}

/**
 * Admin middleware.
 * Extends authMiddleware - validates session then checks isAdmin flag.
 */
export function adminMiddleware(prisma: PrismaClient) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }

    const token = authHeader.slice(7);
    const result = await getSessionByToken(prisma, token);

    if (!result) {
      return c.json({ error: 'Session expired', code: 'SESSION_EXPIRED' }, 401);
    }

    if (!result.profile.isAdmin) {
      return c.json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }

    c.set('profile', result.profile);
    c.set('session', result.session);
    await next();
  };
}

/**
 * Optional authentication middleware.
 * Like authMiddleware but doesn't fail if no token is provided.
 * Sets profile and session if a valid token is present, otherwise continues.
 */
export function optionalAuthMiddleware(prisma: PrismaClient) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const result = await getSessionByToken(prisma, token);
      if (result) {
        c.set('profile', result.profile);
        c.set('session', result.session);
      }
    }
    await next();
  };
}
