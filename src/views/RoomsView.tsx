import React, { useState, useEffect } from 'react';
import { GameId } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore, store } from '../utils/store';
import { Backend, Net } from '../utils/net';
import { Sound } from '../utils/sound';

interface RoomsViewProps {
  gameId: GameId;
  onBack: () => void;
  onJoinRoom: (roomCode: string) => void;
}

interface LiveRoom {
  code: string;
  host: string;
  status: string;
  seats: number;
  seatsNeeded: number;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  gameId,
  onBack,
  onJoinRoom
}) => {
  const g = GAMES_METADATA[gameId];
  const [demoRooms, setDemoRooms] = useState(() => AppStore.getDemoRooms(gameId));
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [joinErr, setJoinErr] = useState('');
  const [busy, setBusy] = useState(false);
  const online = Backend.mode === 'firebase';

  // Live waiting rooms for this game. Client-side filter (no .indexOn
  // needed in the rules) — open rooms are few.
  useEffect(() => {
    if (!online) return;
    const ref = Backend.db.ref('pg_rooms');
    const h = (snap: any) => {
      const val = snap.val() || {};
      const rows: LiveRoom[] = [];
      for (const code of Object.keys(val)) {
        const r = val[code];
        if (r && r.game === gameId && r.status === 'waiting') {
          rows.push({
            code,
            host: (r.names && r.names[r.host]) || 'Player',
            status: r.status,
            seats: (r.seats || []).length,
            seatsNeeded: r.seatsNeeded || 2
          });
        }
      }
      setLiveRooms(rows);
    };
    ref.on('value', h);
    return () => {
      try {
        ref.off('value', h);
      } catch (e) {}
    };
  }, [online, gameId]);

  const handleJoinDemo = (code: string) => {
    Sound.click();
    AppStore.joinDemoRoom(code);
    onJoinRoom(code);
  };

  const handleJoinLive = async (code: string) => {
    Sound.click();
    setBusy(true);
    setJoinErr('');
    const res = await Net.join(code);
    setBusy(false);
    if (!res.ok) {
      setJoinErr(res.error || 'Could not join.');
      return;
    }
    onJoinRoom(code);
  };

  const lastRoom = store.get('lastroom', '');

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="btn secondary small">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-[var(--ink2)]">
        🚪 Open rooms — {g.name}
      </h2>

      {online ? (
        <>
          <div className="card space-y-3">
            <h3 className="font-bold text-base">Online (Firebase)</h3>
            {liveRooms.length > 0 ? (
              liveRooms.map(r => (
                <div
                  key={r.code}
                  className="flex items-center justify-between border-b border-[var(--line)] pb-2"
                >
                  <div className="text-sm">
                    Room <b className="text-[var(--ink2)]">{r.code}</b> · host{' '}
                    <b>{r.host}</b> ·{' '}
                    <span className="text-[var(--muted)]">
                      {r.seats}/{r.seatsNeeded} seated
                    </span>
                  </div>
                  <button
                    onClick={() => handleJoinLive(r.code)}
                    className="btn small !m-0"
                    disabled={busy}
                  >
                    Join
                  </button>
                </div>
              ))
            ) : (
              <div className="text-[var(--muted)] text-xs">
                No open rooms right now. Create one from the game screen (Online PvP).
              </div>
            )}
            {joinErr && <div className="err text-xs">{joinErr}</div>}
          </div>

          {lastRoom && (
            <div className="card space-y-2">
              <h3 className="font-bold text-base">↩️ Your last room</h3>
              <button
                onClick={() => handleJoinLive(lastRoom)}
                className="btn secondary"
                disabled={busy}
              >
                Rejoin room {lastRoom}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
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
                    onClick={() => handleJoinDemo(r.code)}
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
        </>
      )}
    </div>
  );
};
