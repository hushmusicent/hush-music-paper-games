import React, { useState } from 'react';
import { GameId } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore } from '../utils/store';
import { Sound } from '../utils/sound';

interface RoomsViewProps {
  gameId: GameId;
  onBack: () => void;
  onJoinRoom: (roomCode: string) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  gameId,
  onBack,
  onJoinRoom
}) => {
  const g = GAMES_METADATA[gameId];
  const [demoRooms, setDemoRooms] = useState(() => AppStore.getDemoRooms(gameId));

  const handleJoin = (code: string) => {
    Sound.click();
    AppStore.joinDemoRoom(code);
    onJoinRoom(code);
  };

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="btn secondary small">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-[var(--ink2)]">
        🚪 Open rooms — {g.name}
      </h2>

      <div className="card space-y-3">
        <h3 className="font-bold text-base">On this device (demo)</h3>
        {demoRooms.length > 0 ? (
          demoRooms.map(r => (
            <div
              key={r.code}
              className="flex items-center justify-between border-b border-[var(--line)] pb-2"
            >
              <div className="text-sm">
                Room <b className="text-[var(--ink2)]">{r.code}</b> · host{' '}
                <b>{r.host}</b> ·{' '}
                <span className="text-[var(--muted)]">{r.status}</span>
              </div>
              <button
                onClick={() => handleJoin(r.code)}
                className="btn small !m-0"
              >
                Join
              </button>
            </div>
          ))
        ) : (
          <div className="text-[var(--muted)] text-xs">
            No open demo rooms. Create one from the game screen (Online PvP) — in
            demo mode it starts a Pass &amp; Play game and lists the room here.
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-bold text-base mb-1">Online (Firebase)</h3>
        <div className="text-[var(--muted)] text-xs">
          Connect Firebase in Profile → Setup to see and join live online rooms
          across devices (pg_rooms).
        </div>
      </div>
    </div>
  );
};
