import React from 'react';
import { Sound } from '../utils/sound';

interface HeaderProps {
  points: number;
  muted: boolean;
  onToggleSound: () => void;
  voiceJoined?: boolean;
  micMuted?: boolean;
  onToggleMic?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  points,
  muted,
  onToggleSound,
  voiceJoined,
  micMuted,
  onToggleMic
}) => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[#14243f] to-[#0d1728] border-b-2 border-[var(--ink)] px-3 py-2 flex items-center gap-2">
      <div className="text-[18px] font-extrabold text-[var(--ink2)] flex-1 truncate">
        ✏️ Hush Music Paper Games
      </div>
      <div className="bg-[var(--card2)] border border-[var(--ink)] text-[var(--cream)] rounded-full px-3 py-1 font-bold text-sm whitespace-nowrap">
        ⭐ {points}
      </div>
      <button
        onClick={() => {
          Sound.click();
          onToggleSound();
        }}
        className={`bg-[var(--card2)] border border-[var(--line)] text-[var(--text)] rounded-xl text-lg px-2.5 py-1.5 cursor-pointer ${
          muted ? 'opacity-45' : ''
        }`}
        title={muted ? 'Unmute sounds' : 'Mute game sounds'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {voiceJoined && onToggleMic && (
        <button
          onClick={() => {
            Sound.click();
            onToggleMic();
          }}
          className={`bg-[var(--card2)] border border-[var(--line)] text-[var(--text)] rounded-xl text-lg px-2.5 py-1.5 cursor-pointer ${
            micMuted ? 'opacity-45' : ''
          }`}
          title={micMuted ? 'Unmute mic' : 'Mute mic'}
        >
          {micMuted ? '🔇' : '🎤'}
        </button>
      )}
    </header>
  );
};
