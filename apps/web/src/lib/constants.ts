export { calculateLevel, calculateTier, weeklyAllowanceFromTier, pointsForNextLevel, formatEuros, TIERS, COLLECTIONS, PORTUGAL_DISTRICTS, POINTS_PER_REQUEST, POINTS_PER_OFFERED_STAMP, MAX_WEEKLY_REQUEST } from '@stamps-share/shared';

export interface TierStyle {
  tier: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  weeklyAllowance: number;
  gradient: string;
  gradientBg: string;
  color: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
  icon: string;
}

export const TIER_STYLES: TierStyle[] = [
  { tier: 1, name: 'Iniciante', minLevel: 1, maxLevel: 3, weeklyAllowance: 5, gradient: 'from-slate-400 to-slate-500', gradientBg: 'from-slate-50 to-slate-100', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: '🎟️' },
  { tier: 2, name: 'Regular', minLevel: 4, maxLevel: 7, weeklyAllowance: 6, gradient: 'from-emerald-500 to-green-600', gradientBg: 'from-emerald-50 to-green-50', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: '⭐' },
  { tier: 3, name: 'Experiente', minLevel: 8, maxLevel: 12, weeklyAllowance: 7, gradient: 'from-sky-500 to-blue-600', gradientBg: 'from-sky-50 to-blue-50', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', icon: '💎' },
  { tier: 4, name: 'Avançado', minLevel: 13, maxLevel: 20, weeklyAllowance: 8, gradient: 'from-amber-400 to-orange-500', gradientBg: 'from-amber-50 to-orange-50', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', icon: '🏆' },
  { tier: 5, name: 'Mestre', minLevel: 21, maxLevel: Infinity, weeklyAllowance: 10, gradient: 'from-rose-500 to-pink-600', gradientBg: 'from-rose-50 to-pink-50', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: '👑' },
];

export function getTierStyle(tier: number): TierStyle {
  return TIER_STYLES.find((t) => t.tier === tier) ?? TIER_STYLES[0];
}

// Alias for compatibility with source project naming
export const getTierInfo = getTierStyle;
