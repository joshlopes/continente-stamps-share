import type { PrismaClient, AuditAction, Prisma } from '../../generated/prisma/client.js';

export interface AuditContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  targetUserId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry.
 */
export async function createAuditLog(
  prisma: PrismaClient,
  entry: AuditLogEntry,
  context: AuditContext = {},
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorId: context.actorId ?? null,
      targetUserId: entry.targetUserId ?? null,
      oldValue: entry.oldValue as Prisma.InputJsonValue | undefined,
      newValue: entry.newValue as Prisma.InputJsonValue | undefined,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    },
  });
}

/**
 * Log listing creation.
 */
export async function logListingCreated(
  prisma: PrismaClient,
  listing: { id: string; userId: string; type: string; quantity: number },
  context: AuditContext = {},
): Promise<void> {
  await createAuditLog(prisma, {
    action: 'listing_created',
    entityType: 'listing',
    entityId: listing.id,
    targetUserId: listing.userId,
    newValue: { type: listing.type, quantity: listing.quantity },
  }, context);
}

/**
 * Log listing cancellation.
 */
export async function logListingCancelled(
  prisma: PrismaClient,
  listing: { id: string; userId: string; type: string; quantity: number },
  context: AuditContext = {},
): Promise<void> {
  await createAuditLog(prisma, {
    action: 'listing_cancelled',
    entityType: 'listing',
    entityId: listing.id,
    targetUserId: listing.userId,
    metadata: { type: listing.type, quantity: listing.quantity },
  }, context);
}

/**
 * Log offer approval with optional quantity adjustment.
 */
export async function logOfferApproved(
  prisma: PrismaClient,
  listing: { id: string; userId: string; originalQuantity: number; approvedQuantity: number },
  context: AuditContext = {},
): Promise<void> {
  const wasAdjusted = listing.originalQuantity !== listing.approvedQuantity;
  
  await createAuditLog(prisma, {
    action: wasAdjusted ? 'listing_quantity_adjusted' : 'listing_approved',
    entityType: 'listing',
    entityId: listing.id,
    targetUserId: listing.userId,
    oldValue: { quantity: listing.originalQuantity },
    newValue: { quantity: listing.approvedQuantity },
    metadata: { wasAdjusted },
  }, context);
}

/**
 * Log offer rejection.
 */
export async function logOfferRejected(
  prisma: PrismaClient,
  listing: { id: string; userId: string; reason?: string },
  context: AuditContext = {},
): Promise<void> {
  await createAuditLog(prisma, {
    action: 'listing_rejected',
    entityType: 'listing',
    entityId: listing.id,
    targetUserId: listing.userId,
    metadata: { reason: listing.reason },
  }, context);
}

/**
 * Log request fulfillment.
 */
export async function logRequestFulfilled(
  prisma: PrismaClient,
  listing: { id: string; userId: string; quantity: number },
  context: AuditContext = {},
): Promise<void> {
  await createAuditLog(prisma, {
    action: 'listing_fulfilled',
    entityType: 'listing',
    entityId: listing.id,
    targetUserId: listing.userId,
    metadata: { quantity: listing.quantity },
  }, context);
}

