import { Home, BookOpen, Trophy, User } from 'lucide-react';

type Page = 'dashboard' | 'collection' | 'profile' | 'leaderboard';

interface BottomNavProps {
  current: Page;
  onChange: (page: Page) => void;
}

const tabs: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Inicio', icon: Home },
  { id: 'collection', label: 'Colecao', icon: BookOpen },
  { id: 'leaderboard', label: 'Ranking', icon: Trophy },
  { id: 'profile', label: 'Perfil', icon: User },
];

export function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 pb-safe">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 transition-colors ${
                active ? 'text-green-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
