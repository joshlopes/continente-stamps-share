import { TrendingUp, Zap } from 'lucide-react';
import type { Profile } from '@stamps-share/shared';
import { pointsForNextLevel, weeklyAllowanceFromTier, getTierStyle } from '../../lib/constants';

interface LevelCardProps {
  profile: Profile;
}

export function LevelCard({ profile }: LevelCardProps) {
  const tierStyle = getTierStyle(profile.tier);
  const progress = pointsForNextLevel(profile.points);
  const weeklyAllowance = weeklyAllowanceFromTier(profile.tier);
  const weeklyRemaining = Math.max(0, weeklyAllowance - profile.weeklyStampsRequested);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Gradient background */}
      <div className={`bg-gradient-to-br ${tierStyle.gradient} p-5 stamp-pattern`}>
        {/* Tier badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tierStyle.icon}</span>
            <div>
              <p className="text-white/70 text-xs font-medium">Nivel {profile.level}</p>
              <p className="text-white font-bold text-lg leading-tight">{tierStyle.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs font-medium">Selos</p>
            <p className="text-white font-bold text-2xl leading-tight">{profile.stampBalance}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-white/70" />
              <span className="text-white/70 text-xs font-medium">Progresso</span>
            </div>
            <span className="text-white/90 text-xs font-semibold">
              {profile.points} / {progress.pointsNeeded} pts
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress.progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Weekly allowance */}
        <div className="flex items-center gap-2 bg-white/15 rounded-xl p-3">
          <Zap className="w-4 h-4 text-white" />
          <div className="flex-1">
            <p className="text-white/80 text-xs">Pedidos esta semana</p>
            <p className="text-white font-semibold text-sm">
              {profile.weeklyStampsRequested} / {weeklyAllowance} usados
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg">{weeklyRemaining}</p>
            <p className="text-white/70 text-[10px]">restantes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
