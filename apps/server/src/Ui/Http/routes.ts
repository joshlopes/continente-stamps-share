import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Container } from 'inversify';
import { authRoutes } from './auth.js';
import { userRoutes } from './users.js';

export function createApp(container: Container): Hono {
  const app = new Hono();

  // Middleware
  app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
    credentials: true,
  }));

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Routes
  app.route('/auth', authRoutes(container));
  app.route('/users', userRoutes(container));

  return app;
}
