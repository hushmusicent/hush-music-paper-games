import React from 'react';
import { Sound } from '../utils/sound';

export type NavTab = 'home' | 'leaderboard' | 'friends' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: Array<{ id: NavTab; icon: string; label: string }> = [
    { id: 'home', icon: '🏠', label: 'Games' },
    { id: 'leaderboard', icon: '🏆', label: 'Top 50' },
    { id: 'friends', icon: '👥', label: 'Friends' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1728] border-t border-[var(--line)] flex z-50">
      {tabs.map(tab => {
        const active = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              Sound.click();
              onSelectTab(tab.id);
            }}
            className={`flex-1 bg-transparent border-none py-2 px-1 text-[11px] cursor-pointer transition-colors ${
              active ? 'text-[var(--ink)] font-bold' : 'text-[var(--muted)]'
            }`}
          >
            <span className="text-[22px] block mb-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
