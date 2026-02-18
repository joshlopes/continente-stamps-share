import type { User } from './User.js';
import type { UserId } from './UserId.js';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
