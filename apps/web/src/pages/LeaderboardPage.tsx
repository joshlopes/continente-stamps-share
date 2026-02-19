import { useState, useEffect } from 'react';
import { Trophy, Medal, ArrowUpCircle, Star } from 'lucide-react';
import { getTierStyle } from '../lib/constants';
import { api } from '../api/client';

interface LeaderboardEntry {
  id: string;
  displayName: string | null;
  district: string;
  points: number;
  level: number;
  tier: number;
  totalOffered: number;
  totalRequested: number;
}

interface LeaderboardPageProps {
  currentUserId: string;
}

export function LeaderboardPage({ currentUserId }: LeaderboardPageProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { leaderboard } = await api.getLeaderboard();
        setEntries(leaderboard);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getPositionStyle = (pos: number) => {
    if (pos === 0) return { bg: 'bg-amber-50', border: 'border-amber-200', icon: '🥇' };
    if (pos === 1) return { bg: 'bg-slate-50', border: 'border-slate-200', icon: '🥈' };
    if (pos === 2) return { bg: 'bg-orange-50', border: 'border-orange-200', icon: '🥉' };
    return { bg: 'bg-white', border: 'border-slate-100', icon: '' };
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-900">Ranking</h2>
          <p className="text-xs text-slate-500">Os utilizadores mais ativos</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Medal className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Nenhum utilizador no ranking</p>
          <p className="text-xs text-slate-400 mt-1">Comeca a trocar selos para aparecer aqui!</p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {entries.map((entry, index) => {
            const posStyle = getPositionStyle(index);
            const tierStyle = getTierStyle(entry.tier);
            const isMe = entry.id === currentUserId;

            return (
              <div
                key={entry.id}
                className={`rounded-xl p-3 shadow-card border flex items-center gap-3 ${posStyle.bg} ${posStyle.border} ${
                  isMe ? 'ring-2 ring-green-500/30' : ''
                }`}
              >
                {/* Position */}
                <div className="w-8 text-center flex-shrink-0">
                  {posStyle.icon ? (
                    <span className="text-xl">{posStyle.icon}</span>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-sm">{tierStyle.icon}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {entry.displayName || 'Anonimo'}
                    </p>
                    {isMe && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full flex-shrink-0">
                        Tu
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tierStyle.badge}`}>
                      Nv.{entry.level} {tierStyle.name}
                    </span>
                    {entry.district && (
                      <span className="text-[10px] text-slate-400">{entry.district}</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="font-bold text-sm text-slate-900">{entry.points}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <ArrowUpCircle className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[10px] text-slate-500">{entry.totalOffered}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
