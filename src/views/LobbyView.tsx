import React, { useState, useEffect } from 'react';
import { GameId, User } from '../types';
import { GAMES_METADATA, HEAD_TO_HEAD_GAMES } from '../data/games';
import { AppStore, store } from '../utils/store';
import { Backend, Net, RoomDoc } from '../utils/net';
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
  const [busy, setBusy] = useState(false);
  const [room, setRoom] = useState<RoomDoc | null>(() => Net.room);
  const [lastRoom] = useState<string>(() => store.get('lastroom', ''));
  const online = Backend.mode === 'firebase';
  const headToHead = HEAD_TO_HEAD_GAMES.includes(gameId);

  // Watch the room: when seats fill (or the game already started, on a
  // rejoin) both phones move into the game together.
  useEffect(() => {
    if (!online) return;
    const off = Net.onRoom(r => {
      setRoom(r);
      if (r && r.game === gameId) {
        if (r.status === 'playing') {
          onStartRoomGame(r.code);
        } else if (r.status === 'waiting' && r.seats.length >= r.seatsNeeded) {
          onStartRoomGame(r.code);
        }
      }
    });
    // Immediate check: rejoining a room that is already playing must not
    // wait for a change that will never come.
    const cur = Net.room;
    if (cur && cur.game === gameId && cur.status === 'playing') {
      onStartRoomGame(cur.code);
    }
    return off;
    // onStartRoomGame is stable from App (handleStartGame wrapper).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, gameId]);

  const handleCreateDemoRoom = () => {
    Sound.click();
    const r = AppStore.createDemoRoom(gameId, user.username);
    onStartRoomGame(r.code);
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

  const handleCreateRoom = async () => {
    Sound.click();
    setBusy(true);
    setErrorMsg('');
    const code = await Net.create(gameId, 2);
    setBusy(false);
    if (!code) setErrorMsg('Could not create a room — check the connection and try again.');
    // The room watcher above moves us into the game when the guest joins.
  };

  const handleJoinRoom = async () => {
    const c = joinCode.trim();
    if (!c) {
      setErrorMsg('Enter a 4-digit room code.');
      return;
    }
    Sound.click();
    setBusy(true);
    setErrorMsg('');
    const res = await Net.join(c);
    setBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Could not join.');
      return;
    }
    if (res.rejoined) {
      onStartRoomGame(c);
      return;
    }
    // Otherwise the watcher moves us in when the room fills / starts.
  };

  const handleRejoin = async () => {
    if (!lastRoom) return;
    Sound.click();
    setBusy(true);
    setErrorMsg('');
    const res = await Net.join(lastRoom);
    setBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Could not rejoin.');
      return;
    }
    if (res.rejoined) onStartRoomGame(lastRoom);
  };

  const handleLeave = async () => {
    Sound.click();
    await Net.leave(false);
    setRoom(null);
  };

  // Waiting room — we are seated in a live room.
  if (online && room && room.game === gameId) {
    const seats = room.seats.map(
      (uid, i) => room.names[uid] || 'Player ' + (i + 1)
    );
    const full = room.seats.length >= room.seatsNeeded;
    return (
      <div className="space-y-3">
        <button onClick={onBack} className="btn secondary small">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-[var(--ink2)]">
          🌐 Online: {g.name}
        </h2>
        <div className="card space-y-2 text-center">
          <div className="text-xs text-[var(--muted)]">Room code — give this to your opponent</div>
          <div className="text-4xl font-black tracking-[0.3em] text-[var(--ink2)]">
            {room.code}
          </div>
          <div className="text-sm">
            {seats.map((n, i) => (
              <div key={i}>
                Seat {i + 1}: <b>{n}</b>
                {i === 0 ? ' (host)' : ''}
              </div>
            ))}
            {room.seats.length < room.seatsNeeded && (
              <div className="text-[var(--muted)] text-xs mt-1">
                Seat 2: <i>waiting for opponent…</i>
              </div>
            )}
          </div>
          <div className="text-sm font-bold">
            {full ? 'Both players in — starting…' : '⏳ Waiting for your opponent to join…'}
          </div>
          {!headToHead && (
            <div className="text-xs text-[var(--muted)]">
              {g.name} plays on the host's phone in online rooms — chat and
              voice talk are live for both players.
            </div>
          )}
          <button onClick={handleLeave} className="btn secondary small">
            Leave room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="btn secondary small">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-[var(--ink2)]">
        🌐 Online: {g.name}
      </h2>

      {online ? (
        <>
          <div className="card space-y-2">
            <h3 className="font-bold text-base">Create a room</h3>
            <p className="text-xs text-[var(--muted)]">
              2 players — your opponent joins with the 4-digit code. The game
              starts on its own when they join.
            </p>
            <button onClick={handleCreateRoom} className="btn" disabled={busy}>
              {busy ? 'Creating…' : 'Create room'}
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
              maxLength={4}
              className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono"
            />
            {errorMsg && <div className="err text-xs">{errorMsg}</div>}
            <button onClick={handleJoinRoom} className="btn secondary" disabled={busy}>
              {busy ? 'Joining…' : 'Join room'}
            </button>
          </div>

          {lastRoom && (
            <div className="card space-y-2">
              <h3 className="font-bold text-base">↩️ Rejoin your last room</h3>
              <button onClick={handleRejoin} className="btn secondary" disabled={busy}>
                Rejoin room {lastRoom}
              </button>
            </div>
          )}

          {!headToHead && (
            <div className="card">
              <p className="text-xs text-[var(--muted)]">
                {g.name} is a party game: online rooms carry chat and voice,
                and the game itself plays on the host's phone.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};
