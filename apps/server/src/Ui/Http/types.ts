import type { Env } from 'hono';

export interface AppEnv extends Env {
  Variables: {
    profile: { id: string; isAdmin: boolean; [key: string]: unknown };
    session: { id: string; token: string; [key: string]: unknown };
  };
}
