// Gamification constants
export const POINTS_PER_REQUEST = 1;
export const POINTS_PER_OFFERED_STAMP = 2;
export const MAX_WEEKLY_REQUEST = 40;

// Tier definitions
export interface TierDefinition {
  tier: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  weeklyAllowance: number;
  color: string;
  bgColor: string;
}

export const TIERS: TierDefinition[] = [
  { tier: 1, name: 'Iniciante', minLevel: 1, maxLevel: 3, weeklyAllowance: 5, color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  { tier: 2, name: 'Regular', minLevel: 4, maxLevel: 7, weeklyAllowance: 6, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { tier: 3, name: 'Experiente', minLevel: 8, maxLevel: 12, weeklyAllowance: 7, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  { tier: 4, name: 'Avancado', minLevel: 13, maxLevel: 20, weeklyAllowance: 8, color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { tier: 5, name: 'Mestre', minLevel: 21, maxLevel: 999, weeklyAllowance: 10, color: 'text-rose-700', bgColor: 'bg-rose-100' },
];

// Gamification functions
export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 25)) + 1;
}

export function calculateTier(level: number): number {
  if (level <= 3) return 1;
  if (level <= 7) return 2;
  if (level <= 12) return 3;
  if (level <= 20) return 4;
  return 5;
}

export function weeklyAllowanceFromTier(tier: number): number {
  const def = TIERS.find(t => t.tier === tier);
  return def?.weeklyAllowance ?? 5;
}

export function pointsForNextLevel(currentPoints: number) {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevel = currentLevel + 1;
  const pointsNeededForNext = (nextLevel - 1) * (nextLevel - 1) * 25;
  const pointsNeededForCurrent = (currentLevel - 1) * (currentLevel - 1) * 25;
  const pointsIntoLevel = currentPoints - pointsNeededForCurrent;
  const pointsForLevel = pointsNeededForNext - pointsNeededForCurrent;
  const progressPercent = pointsForLevel > 0 ? (pointsIntoLevel / pointsForLevel) * 100 : 0;

  return { currentLevel, nextLevel, pointsNeeded: pointsNeededForNext, pointsIntoLevel, pointsForLevel, progressPercent };
}

export function formatEuros(value: number): string {
  if (value === 0) return 'Gratis';
  return `${value.toFixed(2).replace('.', ',')} €`;
}

// Collections catalog
export const COLLECTIONS = [
  'MasterChef',
  'Cozinha do Chef',
  'Desporto e Aventura',
  'Casa e Decoracao',
  'Bem-Estar',
  'Escola',
  'Natal',
  'Peluches',
  'Outro',
];

// Portugal districts
export const PORTUGAL_DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Braganca', 'Castelo Branco',
  'Coimbra', 'Evora', 'Faro', 'Guarda', 'Leiria',
  'Lisboa', 'Portalegre', 'Porto', 'Santarem', 'Setubal',
  'Viana do Castelo', 'Vila Real', 'Viseu',
  'Acores', 'Madeira',
];
