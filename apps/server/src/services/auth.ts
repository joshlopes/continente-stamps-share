import type { PrismaClient } from '../../generated/prisma/client.js';

const SESSION_DURATION_HOURS = 24;

/**
 * Generate a random token (UUID v4).
 */
export function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a session for a user. Expires in 24 hours.
 */
export async function createSession(
  prisma: PrismaClient,
  userId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    },
  });

  return { token, expiresAt };
}

/**
 * Get a valid (non-expired) session by token, including the associated profile.
 */
export async function getSessionByToken(
  prisma: PrismaClient,
  token: string,
): Promise<{
  session: { id: string; token: string; expiresAt: Date; userId: string };
  profile: {
    id: string;
    phone: string;
    displayName: string | null;
    email: string;
    dateOfBirth: Date | null;
    district: string;
    registrationComplete: boolean;
    isAdmin: boolean;
    points: number;
    level: number;
    tier: number;
    stampBalance: number;
    weeklyStampsRequested: number;
    weeklyResetAt: Date;
    totalOffered: number;
    totalRequested: number;
    createdAt: Date;
    updatedAt: Date;
  };
} | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    // Session expired - clean it up
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Update last active time
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  }).catch(() => {});

  return {
    session: {
      id: session.id,
      token: session.token,
      expiresAt: session.expiresAt,
      userId: session.userId,
    },
    profile: session.user,
  };
}

/**
 * Delete a session by token.
 */
export async function deleteSession(
  prisma: PrismaClient,
  token: string,
): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}
