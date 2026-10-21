import React from 'react';
import { GameId, GameMode } from '../types';
import { GAMES_METADATA } from '../data/games';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface GameModeViewProps {
  gameId: GameId;
  onBack: () => void;
  onSelectMode: (mode: GameMode, playersCount?: number) => void;
  onBrowseRooms: () => void;
  onOnlineLobby: () => void;
}

export const GameModeView: React.FC<GameModeViewProps> = ({
  gameId,
  onBack,
  onSelectMode,
  onBrowseRooms,
  onOnlineLobby
}) => {
  const g = GAMES_METADATA[gameId];
  const [pmin, pmax] = g.p;

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="btn secondary small">
        ← All games
      </button>

      <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
        <span>{g.icon}</span>
        <span>{g.name}</span>
      </h2>

      <PaperPanel>
        <h3 className="font-bold text-base mb-1">📖 How to play — official rules</h3>
        <p className="text-sm leading-relaxed text-[#22304a]">{g.rules}</p>
      </PaperPanel>

      <div className="card space-y-2">
        <h3 className="font-bold text-base mb-2">How do you want to play?</h3>
        <button
          onClick={() => {
            Sound.click();
            onSelectMode('pvc');
          }}
          className="btn"
        >
          🤖 Vs Computer
        </button>
        <button
          onClick={() => {
            Sound.click();
            onSelectMode('hotseat', pmax);
          }}
          className="btn secondary"
        >
          👥 Pass &amp; Play ({pmin}–{pmax} players, one phone)
        </button>
        <button
          onClick={() => {
            Sound.click();
            onOnlineLobby();
          }}
          className="btn secondary"
        >
          🌐 Online PvP (room code)
        </button>
        <button
          onClick={() => {
            Sound.click();
            onBrowseRooms();
          }}
          className="btn secondary"
        >
          🚪 Browse open rooms
        </button>
      </div>
    </div>
  );
};
