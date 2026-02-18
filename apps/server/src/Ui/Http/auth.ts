import { Hono } from 'hono';
import type { Container } from 'inversify';
import { LoginRequestSchema } from '@stamps-share/shared';
import { TYPES } from '../../Domain/types.js';
import type { UserRepository } from '../../Domain/User/UserRepository.js';
import type { SessionRepository } from '../../Domain/Session/SessionRepository.js';
import type { AuthenticationService } from '../../Domain/Auth/AuthenticationService.js';
import { Session } from '../../Domain/Session/Session.js';

const SESSION_DURATION_HOURS = 24;

export function authRoutes(container: Container): Hono {
  const app = new Hono();

  app.post('/login', async (c) => {
    const body = await c.req.json();
    const parsed = LoginRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', code: 'INVALID_CREDENTIALS' }, 400);
    }

    const userRepository = container.get<UserRepository>(TYPES.UserRepository);
    const sessionRepository = container.get<SessionRepository>(TYPES.SessionRepository);
    const authService = container.get<AuthenticationService>(TYPES.AuthenticationService);

    const user = await userRepository.findByEmail(parsed.data.email);
    if (!user) {
      return c.json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401);
    }

    if (!user.isActive) {
      return c.json({ error: 'User is inactive', code: 'USER_INACTIVE' }, 401);
    }

    const isValid = await authService.verifyPassword(parsed.data.password, user.passwordHash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401);
    }

    const token = authService.generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    const session = Session.create({
      userId: user.id,
      token,
      expiresAt,
      userAgent: c.req.header('user-agent'),
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    });

    await sessionRepository.save(session);
    user.updateLastLogin();
    await userRepository.save(user);

    return c.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      },
      token,
      expiresAt: expiresAt.toISOString(),
    });
  });

  app.get('/me', async (c) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }

    const token = authHeader.slice(7);
    const sessionRepository = container.get<SessionRepository>(TYPES.SessionRepository);
    const userRepository = container.get<UserRepository>(TYPES.UserRepository);

    const session = await sessionRepository.findByToken(token);
    if (!session || session.isExpired()) {
      return c.json({ error: 'Session expired', code: 'SESSION_EXPIRED' }, 401);
    }

    const user = await userRepository.findById(session.userId);
    if (!user || !user.isActive) {
      return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 401);
    }

    session.updateLastActive();
    await sessionRepository.save(session);

    return c.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      },
    });
  });

  app.post('/logout', async (c) => {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: true });
    }

    const token = authHeader.slice(7);
    const sessionRepository = container.get<SessionRepository>(TYPES.SessionRepository);

    try {
      await sessionRepository.deleteByToken(token);
    } catch {
      // Ignore errors - session might not exist
    }

    return c.json({ success: true });
  });

  return app;
}
