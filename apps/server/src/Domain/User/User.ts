import type { UserRole } from '@stamps-share/shared';
import { UserId } from './UserId.js';

export class User {
  constructor(
    public readonly id: UserId,
    public email: string,
    public passwordHash: string,
    public name: string | null,
    public role: UserRole,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public lastLoginAt: Date | null
  ) {}

  static create(params: {
    id?: UserId;
    email: string;
    passwordHash: string;
    name?: string | null;
    role?: UserRole;
    isActive?: boolean;
  }): User {
    const now = new Date();
    return new User(
      params.id ?? new UserId(),
      params.email,
      params.passwordHash,
      params.name ?? null,
      params.role ?? 'ADMIN',
      params.isActive ?? true,
      now,
      now,
      null
    );
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }
}
