import { describe, expect, test } from 'bun:test';
import {
  calculateLevel,
  calculateTier,
  weeklyAllowanceFromTier,
  pointsForNextLevel,
  formatEuros,
} from '@stamps-share/shared';
import { availableRequestQuota } from '../services/gamification.js';

// ---------------------------------------------------------------------------
// calculateLevel – Formula: Math.floor(Math.sqrt(points / 25)) + 1
// ---------------------------------------------------------------------------
describe('calculateLevel', () => {
  test('returns level 1 at 0 points', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  test('returns level 1 at 24 points (just below level 2 threshold)', () => {
    expect(calculateLevel(24)).toBe(1);
  });

  test('returns level 2 at 25 points', () => {
    expect(calculateLevel(25)).toBe(2);
  });

  test('returns level 2 at 99 points (just below level 3 threshold)', () => {
    expect(calculateLevel(99)).toBe(2);
  });

  test('returns level 3 at 100 points', () => {
    expect(calculateLevel(100)).toBe(3);
  });

  test('returns level 4 at 225 points', () => {
    expect(calculateLevel(225)).toBe(4);
  });

  test('returns level 5 at 400 points', () => {
    expect(calculateLevel(400)).toBe(5);
  });

  test('returns level 11 at 2500 points', () => {
    // sqrt(2500/25) = sqrt(100) = 10 → 10 + 1 = 11
    expect(calculateLevel(2500)).toBe(11);
  });

  test('handles large point values correctly', () => {
    // sqrt(10000/25) = sqrt(400) = 20 → 20 + 1 = 21
    expect(calculateLevel(10000)).toBe(21);
  });
});

// ---------------------------------------------------------------------------
// calculateTier – tier boundaries based on level
// ---------------------------------------------------------------------------
describe('calculateTier', () => {
  test('tier 1 for level 1', () => {
    expect(calculateTier(1)).toBe(1);
  });

  test('tier 1 for level 3 (upper boundary)', () => {
    expect(calculateTier(3)).toBe(1);
  });

  test('tier 2 for level 4 (lower boundary)', () => {
    expect(calculateTier(4)).toBe(2);
  });

  test('tier 2 for level 7 (upper boundary)', () => {
    expect(calculateTier(7)).toBe(2);
  });

  test('tier 3 for level 8 (lower boundary)', () => {
    expect(calculateTier(8)).toBe(3);
  });

  test('tier 3 for level 12 (upper boundary)', () => {
    expect(calculateTier(12)).toBe(3);
  });

  test('tier 4 for level 13 (lower boundary)', () => {
    expect(calculateTier(13)).toBe(4);
  });

  test('tier 4 for level 20 (upper boundary)', () => {
    expect(calculateTier(20)).toBe(4);
  });

  test('tier 5 for level 21 (lower boundary)', () => {
    expect(calculateTier(21)).toBe(5);
  });

  test('tier 5 for level 100 (very high level)', () => {
    expect(calculateTier(100)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// weeklyAllowanceFromTier
// ---------------------------------------------------------------------------
describe('weeklyAllowanceFromTier', () => {
  test('tier 1 gives allowance of 5', () => {
    expect(weeklyAllowanceFromTier(1)).toBe(5);
  });

  test('tier 2 gives allowance of 6', () => {
    expect(weeklyAllowanceFromTier(2)).toBe(6);
  });

  test('tier 3 gives allowance of 7', () => {
    expect(weeklyAllowanceFromTier(3)).toBe(7);
  });

  test('tier 4 gives allowance of 8', () => {
    expect(weeklyAllowanceFromTier(4)).toBe(8);
  });

  test('tier 5 gives allowance of 10', () => {
    expect(weeklyAllowanceFromTier(5)).toBe(10);
  });

  test('unknown tier falls back to 5', () => {
    expect(weeklyAllowanceFromTier(99)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// pointsForNextLevel
// ---------------------------------------------------------------------------
describe('pointsForNextLevel', () => {
  test('at 0 points, current level is 1, next is 2', () => {
    const result = pointsForNextLevel(0);
    expect(result.currentLevel).toBe(1);
    expect(result.nextLevel).toBe(2);
  });

  test('at 0 points, pointsNeeded for level 2 is 25', () => {
    const result = pointsForNextLevel(0);
    // Level 2 threshold: (2-1)^2 * 25 = 25
    expect(result.pointsNeeded).toBe(25);
  });

  test('at 0 points, pointsIntoLevel is 0 and pointsForLevel is 25', () => {
    const result = pointsForNextLevel(0);
    expect(result.pointsIntoLevel).toBe(0);
    expect(result.pointsForLevel).toBe(25);
  });

  test('at 0 points, progressPercent is 0', () => {
    const result = pointsForNextLevel(0);
    expect(result.progressPercent).toBe(0);
  });

  test('at 25 points, current level is 2', () => {
    const result = pointsForNextLevel(25);
    expect(result.currentLevel).toBe(2);
    expect(result.nextLevel).toBe(3);
  });

  test('at 25 points, pointsIntoLevel is 0 (just reached level 2)', () => {
    const result = pointsForNextLevel(25);
    // Current level threshold: (2-1)^2 * 25 = 25, so 25 - 25 = 0
    expect(result.pointsIntoLevel).toBe(0);
  });

  test('at 50 points, halfway between level 2 and level 3', () => {
    const result = pointsForNextLevel(50);
    expect(result.currentLevel).toBe(2);
    // Level 2 threshold: 25, Level 3 threshold: 100
    // pointsIntoLevel: 50 - 25 = 25
    // pointsForLevel: 100 - 25 = 75
    // progressPercent: (25/75) * 100 ≈ 33.33
    expect(result.pointsIntoLevel).toBe(25);
    expect(result.pointsForLevel).toBe(75);
    expect(result.progressPercent).toBeCloseTo(33.33, 1);
  });

  test('at 100 points, current level is 3', () => {
    const result = pointsForNextLevel(100);
    expect(result.currentLevel).toBe(3);
    expect(result.nextLevel).toBe(4);
    // Level 3 threshold: (3-1)^2 * 25 = 100, so pointsIntoLevel = 0
    expect(result.pointsIntoLevel).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatEuros
// ---------------------------------------------------------------------------
describe('formatEuros', () => {
  test('0 returns Gratis', () => {
    expect(formatEuros(0)).toBe('Gratis');
  });

  test('4.99 returns "4,99 €"', () => {
    expect(formatEuros(4.99)).toBe('4,99 €');
  });

  test('1 returns "1,00 €"', () => {
    expect(formatEuros(1)).toBe('1,00 €');
  });

  test('10.5 returns "10,50 €"', () => {
    expect(formatEuros(10.5)).toBe('10,50 €');
  });

  test('0.01 returns "0,01 €"', () => {
    expect(formatEuros(0.01)).toBe('0,01 €');
  });

  test('99.99 returns "99,99 €"', () => {
    expect(formatEuros(99.99)).toBe('99,99 €');
  });
});

// ---------------------------------------------------------------------------
// availableRequestQuota
// ---------------------------------------------------------------------------
describe('availableRequestQuota', () => {
  test('returns correct quota for tier 1 with some requests used', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in the future
    const result = availableRequestQuota({
      tier: 1,
      weeklyStampsRequested: 2,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    // Tier 1 allowance = 5, requested = 2, remaining = 3
    expect(result).toBe(3);
  });

  test('returns full allowance for tier 1 with 0 requests', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = availableRequestQuota({
      tier: 1,
      weeklyStampsRequested: 0,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    expect(result).toBe(5);
  });

  test('returns 0 when quota is exhausted', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = availableRequestQuota({
      tier: 1,
      weeklyStampsRequested: 5,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    expect(result).toBe(0);
  });

  test('returns 0 when requests exceed allowance', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = availableRequestQuota({
      tier: 1,
      weeklyStampsRequested: 10,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    expect(result).toBe(0);
  });

  test('resets to full allowance when weeklyResetAt is in the past', () => {
    const pastReset = new Date(Date.now() - 1000); // 1 second in the past
    const result = availableRequestQuota({
      tier: 1,
      weeklyStampsRequested: 5, // fully exhausted, but reset is past
      stampBalance: 10,
      weeklyResetAt: pastReset,
    });
    // Since reset is past, effectiveRequested = 0, so remaining = 5
    expect(result).toBe(5);
  });

  test('uses correct allowance for tier 2', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = availableRequestQuota({
      tier: 2,
      weeklyStampsRequested: 3,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    // Tier 2 allowance = 6, requested = 3, remaining = 3
    expect(result).toBe(3);
  });

  test('uses correct allowance for tier 5', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = availableRequestQuota({
      tier: 5,
      weeklyStampsRequested: 4,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    // Tier 5 allowance = 10, requested = 4, remaining = 6
    expect(result).toBe(6);
  });

  test('accepts weeklyResetAt as ISO string', () => {
    const futureReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = availableRequestQuota({
      tier: 1,
      weeklyStampsRequested: 1,
      stampBalance: 10,
      weeklyResetAt: futureReset,
    });
    expect(result).toBe(4);
  });
});
