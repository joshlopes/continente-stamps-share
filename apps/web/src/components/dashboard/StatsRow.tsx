import { ArrowUpCircle, ArrowDownCircle, Star } from 'lucide-react';
import type { Profile } from '@stamps-share/shared';

interface StatsRowProps {
  profile: Profile;
}

export function StatsRow({ profile }: StatsRowProps) {
  const stats = [
    {
      label: 'Oferecidos',
      value: profile.totalOffered,
      icon: ArrowUpCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pedidos',
      value: profile.totalRequested,
      icon: ArrowDownCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Pontos',
      value: profile.points,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-xl p-3 shadow-card text-center">
          <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="font-bold text-lg text-slate-900">{value}</p>
          <p className="text-[10px] text-slate-400 font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}
