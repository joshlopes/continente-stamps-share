import type { PrismaClient } from '../../generated/prisma/index.js';
import {
  calculateLevel,
  calculateTier,
  weeklyAllowanceFromTier,
  POINTS_PER_OFFERED_STAMP,
  POINTS_PER_REQUEST,
} from '@stamps-share/shared';

export { calculateLevel, calculateTier, weeklyAllowanceFromTier };

/**
 * Calculate available request quota for a profile, considering weekly reset.
 */
export function availableRequestQuota(profile: {
  tier: number;
  weeklyStampsRequested: number;
  stampBalance: number;
  weeklyResetAt: Date | string;
}): number {
  const now = new Date();
  const resetAt = new Date(profile.weeklyResetAt);

  // If weekly reset has passed, the counter is effectively 0
  const effectiveRequested = now > resetAt ? 0 : profile.weeklyStampsRequested;

  const allowance = weeklyAllowanceFromTier(profile.tier);
  const remaining = Math.max(0, allowance - effectiveRequested);

  return remaining;
}

/**
 * Award balance to a user after an offer is approved/validated.
 * Atomically: stamp_balance += quantity, points += quantity * POINTS_PER_OFFERED_STAMP,
 * total_offered++, recalculate level/tier.
 */
export async function awardOfferBalance(
  prisma: PrismaClient,
  userId: string,
  quantity: number,
): Promise<void> {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: userId } });

  const newPoints = profile.points + quantity * POINTS_PER_OFFERED_STAMP;
  const newLevel = calculateLevel(newPoints);
  const newTier = calculateTier(newLevel);

  await prisma.profile.update({
    where: { id: userId },
    data: {
      stampBalance: { increment: quantity },
      points: newPoints,
      totalOffered: { increment: 1 },
      level: newLevel,
      tier: newTier,
    },
  });
}

/**
 * Reverse offer balance when an offer listing is cancelled after approval.
 * stamp_balance -= quantity, points -= quantity * POINTS_PER_OFFERED_STAMP,
 * total_offered--, recalculate level/tier.
 */
export async function reverseOfferBalance(
  prisma: PrismaClient,
  userId: string,
  quantity: number,
): Promise<void> {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: userId } });

  const newPoints = Math.max(0, profile.points - quantity * POINTS_PER_OFFERED_STAMP);
  const newLevel = calculateLevel(newPoints);
  const newTier = calculateTier(newLevel);

  await prisma.profile.update({
    where: { id: userId },
    data: {
      stampBalance: { decrement: quantity },
      points: newPoints,
      totalOffered: { decrement: 1 },
      level: newLevel,
      tier: newTier,
    },
  });
}

/**
 * Handle points/stats when a listing is fulfilled.
 * Awards points to both parties and creates a transaction record.
 */
export async function completeListingPoints(
  prisma: PrismaClient,
  listingId: string,
  fulfilledByUserId: string,
): Promise<void> {
  const listing = await prisma.stampListing.findUniqueOrThrow({
    where: { id: listingId },
    include: { user: true },
  });

  const listingOwner = listing.user;
  const quantity = listing.quantity;

  if (listing.type === 'offer') {
    // Offer fulfilled: offerer's stamps go to fulfiller
    // Offerer already got points at approval time. Fulfiller gets request points.
    const fulfillerProfile = await prisma.profile.findUniqueOrThrow({
      where: { id: fulfilledByUserId },
    });

    const fulfillerNewPoints = fulfillerProfile.points + quantity * POINTS_PER_REQUEST;
    const fulfillerNewLevel = calculateLevel(fulfillerNewPoints);
    const fulfillerNewTier = calculateTier(fulfillerNewLevel);

    await prisma.profile.update({
      where: { id: fulfilledByUserId },
      data: {
        points: fulfillerNewPoints,
        level: fulfillerNewLevel,
        tier: fulfillerNewTier,
        totalRequested: { increment: 1 },
      },
    });

    // Deduct stamps from offerer's balance
    await prisma.profile.update({
      where: { id: listingOwner.id },
      data: {
        stampBalance: { decrement: quantity },
      },
    });

    // Create transaction record
    await prisma.stampTransaction.create({
      data: {
        fromUserId: listingOwner.id,
        toUserId: fulfilledByUserId,
        quantity,
        listingId,
        pointsFrom: 0, // offerer already got points at approval
        pointsTo: quantity * POINTS_PER_REQUEST,
        type: 'offer',
      },
    });
  } else {
    // Request fulfilled: fulfiller provides stamps to requester
    // Requester gets request points. Fulfiller gets offered points.
    const ownerNewPoints = listingOwner.points + quantity * POINTS_PER_REQUEST;
    const ownerNewLevel = calculateLevel(ownerNewPoints);
    const ownerNewTier = calculateTier(ownerNewLevel);

    await prisma.profile.update({
      where: { id: listingOwner.id },
      data: {
        points: ownerNewPoints,
        level: ownerNewLevel,
        tier: ownerNewTier,
        totalRequested: { increment: 1 },
      },
    });

    const fulfillerProfile = await prisma.profile.findUniqueOrThrow({
      where: { id: fulfilledByUserId },
    });

    const fulfillerNewPoints = fulfillerProfile.points + quantity * POINTS_PER_OFFERED_STAMP;
    const fulfillerNewLevel = calculateLevel(fulfillerNewPoints);
    const fulfillerNewTier = calculateTier(fulfillerNewLevel);

    await prisma.profile.update({
      where: { id: fulfilledByUserId },
      data: {
        points: fulfillerNewPoints,
        level: fulfillerNewLevel,
        tier: fulfillerNewTier,
        totalOffered: { increment: 1 },
      },
    });

    // Create transaction record
    await prisma.stampTransaction.create({
      data: {
        fromUserId: fulfilledByUserId,
        toUserId: listingOwner.id,
        quantity,
        listingId,
        pointsFrom: quantity * POINTS_PER_OFFERED_STAMP,
        pointsTo: quantity * POINTS_PER_REQUEST,
        type: 'request',
      },
    });
  }

  // Mark listing as fulfilled
  await prisma.stampListing.update({
    where: { id: listingId },
    data: {
      status: 'fulfilled',
      fulfilledBy: fulfilledByUserId,
      fulfilledAt: new Date(),
    },
  });
}
