import React, { useState } from 'react';
import { GameId, User } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore } from '../utils/store';
import { Sound } from '../utils/sound';

interface LobbyViewProps {
  gameId: GameId;
  user: User;
  onBack: () => void;
  onStartRoomGame: (code: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameId,
  user,
  onBack,
  onStartRoomGame
}) => {
  const g = GAMES_METADATA[gameId];
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateDemoRoom = () => {
    Sound.click();
    const room = AppStore.createDemoRoom(gameId, user.username);
    onStartRoomGame(room.code);
  };

  const handleJoinDemoRoom = () => {
    const c = joinCode.trim();
    if (!c) {
      setErrorMsg('Enter a 4-digit room code.');
      return;
    }
    const r = AppStore.joinDemoRoom(c);
    if (!r) {
      setErrorMsg('Room not found on this device.');
      return;
    }
    Sound.click();
    onStartRoomGame(r.code);
  };

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="btn secondary small">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-[var(--ink2)]">
        🌐 Online: {g.name}
      </h2>

      <div className="card space-y-2">
        <h3 className="font-bold text-base">Create a room</h3>
        <p className="text-xs text-[var(--muted)]">
          In demo mode, creating a room generates a 4-digit code and lists it under
          open rooms on this device. Connect Firebase in Profile → Setup for real
          multi-device PvP!
        </p>
        <button onClick={handleCreateDemoRoom} className="btn">
          Create room
        </button>
      </div>

      <div className="card space-y-2">
        <h3 className="font-bold text-base">Join a room</h3>
        <label className="text-xs text-[var(--muted)]">Room code</label>
        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          inputMode="numeric"
          placeholder="4-digit code"
          maxLength={6}
          className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono"
        />
        {errorMsg && <div className="err text-xs">{errorMsg}</div>}
        <button onClick={handleJoinDemoRoom} className="btn secondary">
          Join room
        </button>
      </div>
    </div>
  );
};
