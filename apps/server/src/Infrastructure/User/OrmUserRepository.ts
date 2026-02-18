import { inject, injectable } from 'inversify';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import type { UserRepository } from '../../Domain/User/UserRepository.js';
import { User } from '../../Domain/User/User.js';
import { UserId } from '../../Domain/User/UserId.js';
import { TYPES } from '../../Domain/types.js';
import type { UserRole } from '@stamps-share/shared';

@injectable()
export class OrmUserRepository implements UserRepository {
  constructor(
    @inject(TYPES.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: id.toString() },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
    });

    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toDomain(record));
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id.toString() },
      create: {
        id: user.id.toString(),
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        updatedAt: new Date(),
        lastLoginAt: user.lastLoginAt,
      },
    });
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.toString() },
    });
  }

  private toDomain(record: {
    id: string;
    email: string;
    passwordHash: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }): User {
    return new User(
      new UserId(record.id),
      record.email,
      record.passwordHash,
      record.name,
      record.role as UserRole,
      record.isActive,
      record.createdAt,
      record.updatedAt,
      record.lastLoginAt
    );
  }
}
