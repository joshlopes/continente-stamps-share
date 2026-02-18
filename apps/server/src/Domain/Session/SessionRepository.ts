import type { Session } from './Session.js';
import type { SessionId } from './SessionId.js';
import type { UserId } from '../User/UserId.js';

export interface SessionRepository {
  findById(id: SessionId): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findByUserId(userId: UserId): Promise<Session[]>;
  save(session: Session): Promise<void>;
  delete(id: SessionId): Promise<void>;
  deleteByToken(token: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
