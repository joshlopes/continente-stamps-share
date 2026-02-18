import type { UserId } from '../User/UserId.js';
import { SessionId } from './SessionId.js';

export class Session {
  constructor(
    public readonly id: SessionId,
    public readonly userId: UserId,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public lastActiveAt: Date,
    public readonly userAgent: string | null,
    public readonly ipAddress: string | null
  ) {}

  static create(params: {
    id?: SessionId;
    userId: UserId;
    token: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Session {
    const now = new Date();
    return new Session(
      params.id ?? new SessionId(),
      params.userId,
      params.token,
      params.expiresAt,
      now,
      now,
      params.userAgent ?? null,
      params.ipAddress ?? null
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  updateLastActive(): void {
    this.lastActiveAt = new Date();
  }
}
