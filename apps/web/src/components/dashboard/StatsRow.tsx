import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Profile } from '@stamps-share/shared';

interface StatsRowProps {
  profile: Profile;
}

export function StatsRow({ profile }: StatsRowProps) {
  const stats = [
    {
      label: 'Oferecidos',
      value: profile.totalOffered,
      sub: 'selos no total',
      icon: ArrowUpRight,
      color: 'text-green-700',
      bg: 'bg-green-50 border-green-100',
      iconBg: 'bg-green-100 text-green-600',
    },
    {
      label: 'Pedidos',
      value: profile.totalRequested,
      sub: 'selos no total',
      icon: ArrowDownRight,
      color: 'text-sky-700',
      bg: 'bg-sky-50 border-sky-100',
      iconBg: 'bg-sky-100 text-sky-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map(({ label, value, sub, icon: Icon, color, bg, iconBg }) => (
        <div key={label} className={`${bg} rounded-2xl p-4 border`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <p className={`text-2xl font-black ${color} leading-none mb-1`}>{value}</p>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}
