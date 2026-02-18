import { inject, injectable } from 'inversify';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import type { SessionRepository } from '../../Domain/Session/SessionRepository.js';
import { Session } from '../../Domain/Session/Session.js';
import { SessionId } from '../../Domain/Session/SessionId.js';
import { UserId } from '../../Domain/User/UserId.js';
import { TYPES } from '../../Domain/types.js';

@injectable()
export class OrmSessionRepository implements SessionRepository {
  constructor(
    @inject(TYPES.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async findById(id: SessionId): Promise<Session | null> {
    const record = await this.prisma.session.findUnique({
      where: { id: id.toString() },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const record = await this.prisma.session.findUnique({
      where: { token },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: UserId): Promise<Session[]> {
    const records = await this.prisma.session.findMany({
      where: { userId: userId.toString() },
    });

    return records.map((record) => this.toDomain(record));
  }

  async save(session: Session): Promise<void> {
    await this.prisma.session.upsert({
      where: { id: session.id.toString() },
      create: {
        id: session.id.toString(),
        userId: session.userId.toString(),
        token: session.token,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      },
      update: {
        lastActiveAt: session.lastActiveAt,
      },
    });
  }

  async delete(id: SessionId): Promise<void> {
    await this.prisma.session.delete({
      where: { id: id.toString() },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.session.delete({
      where: { token },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  private toDomain(record: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    lastActiveAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): Session {
    return new Session(
      new SessionId(record.id),
      new UserId(record.userId),
      record.token,
      record.expiresAt,
      record.createdAt,
      record.lastActiveAt,
      record.userAgent,
      record.ipAddress
    );
  }
}
