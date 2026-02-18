import { Hono } from 'hono';
import type { Container } from 'inversify';
import { TYPES } from '../../Domain/types.js';
import type { UserRepository } from '../../Domain/User/UserRepository.js';
import type { SessionRepository } from '../../Domain/Session/SessionRepository.js';

export function userRoutes(container: Container): Hono {
  const app = new Hono();

  // Middleware to check authentication
  app.use('*', async (c, next) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    const sessionRepository = container.get<SessionRepository>(TYPES.SessionRepository);
    const userRepository = container.get<UserRepository>(TYPES.UserRepository);

    const session = await sessionRepository.findByToken(token);
    if (!session || session.isExpired()) {
      return c.json({ error: 'Session expired' }, 401);
    }

    const user = await userRepository.findById(session.userId);
    if (!user || !user.isActive) {
      return c.json({ error: 'User not found' }, 401);
    }

    c.set('user', user);
    await next();
  });

  app.get('/', async (c) => {
    const userRepository = container.get<UserRepository>(TYPES.UserRepository);
    const users = await userRepository.findAll();

    return c.json({
      users: users.map((user) => ({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      })),
    });
  });

  return app;
}
