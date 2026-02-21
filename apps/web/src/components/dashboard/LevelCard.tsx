import type { Profile } from '@stamps-share/shared';
import { pointsForNextLevel, getTierInfo } from '../../lib/constants';

interface LevelCardProps {
  profile: Profile;
}

export function LevelCard({ profile }: LevelCardProps) {
  const tierInfo = getTierInfo(profile.tier);
  const { currentLevel, nextLevel, pointsIntoLevel, pointsForLevel, progressPercent } = pointsForNextLevel(profile.points);
  const pointsRemaining = pointsForLevel - pointsIntoLevel;
  const isMaxTier = profile.tier === 5;
  const nextTierInfo = getTierInfo(Math.min(profile.tier + 1, 5));

  const barColor = ['bg-slate-400', 'bg-green-500', 'bg-sky-500', 'bg-amber-400', 'bg-rose-500'][profile.tier - 1] ?? 'bg-green-500';

  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${tierInfo.gradientBg} border ${tierInfo.border}`}>
      <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 rounded-full opacity-[0.07] bg-current" />

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-50 mb-1">{tierInfo.name}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${tierInfo.color}`}>{currentLevel}</span>
            <span className={`text-sm font-bold opacity-50 ${tierInfo.color}`}>nível</span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5 font-medium">
            {profile.points.toLocaleString('pt-PT')} pts
          </p>
        </div>

        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${tierInfo.bg} border ${tierInfo.border}`}>
          <span className="text-2xl leading-none mb-0.5">{tierInfo.icon}</span>
          <p className={`text-[10px] font-black ${tierInfo.color} leading-tight text-center`}>
            {tierInfo.weeklyAllowance} /sem
          </p>
        </div>
      </div>

      {!isMaxTier ? (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-slate-500">→ Nível {nextLevel}</span>
            <span className={`text-xs font-bold ${tierInfo.color}`}>
              {Math.round(progressPercent)}% · faltam {pointsRemaining} pts
            </span>
          </div>
          <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all duration-700`}
              style={{ width: `${progressPercent}%` }} />
          </div>
          {profile.tier < 5 && (
            <p className="text-xs mt-2 text-slate-500">
              Próx. tier: <span className={`font-bold ${nextTierInfo.color}`}>{nextTierInfo.name} {nextTierInfo.icon} ({nextTierInfo.weeklyAllowance}/sem)</span>
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400" />
          <span className="text-xs font-black text-rose-600 uppercase tracking-wide">MAX</span>
        </div>
      )}
    </div>
  );
}
