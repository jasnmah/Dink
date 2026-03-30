import { Home, Plus, TrendingUp, Trophy } from 'lucide-react';

interface NavigationProps {
  currentScreen: 'home' | 'log' | 'stats' | 'leaderboard';
  onScreenChange: (screen: 'home' | 'log' | 'stats' | 'leaderboard') => void;
}

export function Navigation({ currentScreen, onScreenChange }: NavigationProps) {
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'log' as const, icon: Plus, label: 'Log Game' },
    { id: 'stats' as const, icon: TrendingUp, label: 'Stats' },
    { id: 'leaderboard' as const, icon: Trophy, label: 'Leaderboard' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-lg mx-auto flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
