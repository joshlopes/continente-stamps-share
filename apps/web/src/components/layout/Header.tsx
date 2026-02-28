import { LogOut, Shield } from 'lucide-react';
import type { Profile } from '@stamps-share/shared';
import { getTierStyle } from '../../lib/constants';

interface HeaderProps {
  profile: Profile;
  onSignOut: () => void;
  onAdmin: () => void;
}

export function Header({ profile, onSignOut, onAdmin }: HeaderProps) {
  const tierStyle = getTierStyle(profile.tier);

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center`}>
            <span className="text-sm">{tierStyle.icon}</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">TrocaSelos</h1>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">Troca de Selos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile.isAdmin && (
            <button
              onClick={onAdmin}
              className="p-2 rounded-lg hover:bg-slate-100 text-amber-500 transition-colors"
              title="Administracao"
            >
              <Shield className="w-4.5 h-4.5" />
            </button>
          )}
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
