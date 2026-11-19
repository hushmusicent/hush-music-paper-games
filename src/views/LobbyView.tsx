import React, { useState, useEffect } from 'react';
import { GameId, User } from '../types';
import { GAMES_METADATA, HEAD_TO_HEAD_GAMES } from '../data/games';
import { AppStore, store, START_POINTS } from '../utils/store';
import { Backend, Net, OnlinePoints, RoomDoc, WAGER_OPTIONS } from '../utils/net';
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
  const [wager, setWager] = useState(0);
  // 3-4 player PvP (head-to-head games only): the host picks the seat
  // count at room create. Party games stay 2 seats — the game itself runs
  // on the host's phone and the room is chat + voice. Net.create already
  // takes seatsNeeded; the room watcher below auto-starts when seats fill,
  // so no net.ts change is needed for the picker.
  const [players, setPlayers] = useState(2);
  const [myPoints, setMyPoints] = useState(START_POINTS);
  // Guest wager accept card: set when the guest taps Join on a wagered
  // room. Nothing is joined until Accept — Decline walks away clean.
  const [wagerOffer, setWagerOffer] = useState<{
    code: string;
    game: GameId;
    wager: number;
    balance: number;
    // Seats in the room — the pot is wager x seats, so a 3-player room's
    // accept card must show 3x, not the 2-player 2x.
    seatsNeeded: number;
  } | null>(null);
  const online = Backend.mode === 'firebase';
  const headToHead = HEAD_TO_HEAD_GAMES.includes(gameId);

  // Host balance, so unaffordable wager options grey out.
  useEffect(() => {
    if (!online) return;
    OnlinePoints.get(user.uid).then(setMyPoints).catch(() => {});
  }, [online, user.uid]);

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
    const code = await Net.create(gameId, headToHead ? players : 2, wager);
    setBusy(false);
    if (!code) setErrorMsg('Could not create a room — check the connection and try again.');
    // The room watcher above moves us into the game when the guest joins.
  };

  // Actually take the seat. Assumes busy is already true; clears it.
  const completeJoin = async (c: string) => {
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

  // Peek first: a wagered room shows the guest an accept card before any
  // seat is taken; free rooms (and already-seated rejoins) join straight
  // away as before.
  const startJoin = async (c: string) => {
    const peek = await Net.peek(c);
    if (!peek.ok || !peek.room) {
      setBusy(false);
      setErrorMsg(peek.error || 'Could not join.');
      return;
    }
    if (peek.rejoined) {
      await completeJoin(c);
      return;
    }
    const w = peek.room.wager || 0;
    if (w > 0) {
      setWagerOffer({
        code: c,
        game: peek.room.game,
        wager: w,
        balance: peek.balance ?? 0,
        seatsNeeded: peek.room.seatsNeeded || 2
      });
      setBusy(false);
      return;
    }
    await completeJoin(c);
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
    setWagerOffer(null);
    await startJoin(c);
  };

  const handleAcceptWager = async () => {
    if (!wagerOffer) return;
    Sound.click();
    setBusy(true);
    setErrorMsg('');
    const c = wagerOffer.code;
    setWagerOffer(null);
    await completeJoin(c);
  };

  const handleDeclineWager = () => {
    Sound.click();
    setWagerOffer(null);
  };

  const handleRejoin = async () => {
    if (!lastRoom) return;
    Sound.click();
    setBusy(true);
    setErrorMsg('');
    setWagerOffer(null);
    await startJoin(lastRoom);
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
    const waiting = room.seatsNeeded - room.seats.length;
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
            {Array.from({ length: waiting }).map((_, k) => (
              <div key={'w' + k} className="text-[var(--muted)] text-xs mt-1">
                Seat {room.seats.length + k + 1}: <i>waiting for player…</i>
              </div>
            ))}
          </div>
          <div className="text-sm font-bold">
            {full
              ? `All ${room.seatsNeeded} players in — starting…`
              : `⏳ Waiting for ${waiting} more player${waiting === 1 ? '' : 's'}…`}
          </div>
          {(room.wager || 0) > 0 && (
            <div className="text-sm font-bold">
              💰 Wager: {room.wager} ⭐ — winner takes {(room.wager || 0) * room.seatsNeeded} ⭐
            </div>
          )}
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
              {headToHead ? (
                <>
                  {players} player{players === 1 ? '' : 's'} — your opponents join
                  with the 4-digit code. The game starts on its own when the
                  room fills.
                </>
              ) : (
                <>
                  2 players — your opponent joins with the 4-digit code. The game
                  starts on its own when they join.
                </>
              )}
              {headToHead && (
                <>
                  {' '}Winning earns <b>200 ⭐</b>
                  {wager > 0 ? ' + the wager pot' : ''}.
                </>
              )}
            </p>
            {headToHead && (
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">
                  👥 Players — how many seats in this room?
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        Sound.click();
                        setPlayers(n);
                      }}
                      className={`btn small ${n === players ? '' : 'secondary'}`}
                    >
                      {n} players
                    </button>
                  ))}
                </div>
              </div>
            )}
            {headToHead && (
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">
                  💰 Wager — winner takes the pot (you have {myPoints} ⭐)
                </div>
                <div className="flex gap-2 flex-wrap">
                  {WAGER_OPTIONS.map(w => (
                    <button
                      key={w}
                      onClick={() => {
                        Sound.click();
                        setWager(w);
                      }}
                      disabled={w > 0 && myPoints < w}
                      className={`btn small ${w === wager ? '' : 'secondary'}`}
                    >
                      {w === 0 ? 'Free' : w + ' ⭐'}
                    </button>
                  ))}
                </div>
                {wager > 0 && (
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {wager} ⭐ each — winner takes {wager * players} ⭐
                    {players > 2
                      ? ` (${players}× ${wager}); a tie at the top splits the pot`
                      : ', tie refunds both'}
                    .
                  </div>
                )}
              </div>
            )}
            <button onClick={handleCreateRoom} className="btn" disabled={busy}>
              {busy ? 'Creating…' : 'Create room'}
            </button>
          </div>

          <div className="card space-y-2">
            <h3 className="font-bold text-base">Join a room</h3>
            <label className="text-xs text-[var(--muted)]">Room code</label>
            <input
              value={joinCode}
              onChange={e => {
                setJoinCode(e.target.value);
                setWagerOffer(null);
              }}
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

          {wagerOffer && (
            <div className="card space-y-2">
              <h3 className="font-bold text-base">💰 Wagered room — {GAMES_METADATA[wagerOffer.game]?.name || 'Game'}</h3>
              <p className="text-sm">
                This room has a wager of <b>{wagerOffer.wager} ⭐</b> — winner
                takes the pot of{' '}
                <b>{wagerOffer.wager * wagerOffer.seatsNeeded} ⭐</b>,{' '}
                {wagerOffer.seatsNeeded > 2
                  ? 'a tie at the top splits the pot'
                  : 'tie refunds both'}
                . You have {wagerOffer.balance} ⭐.
              </p>
              {wagerOffer.balance < wagerOffer.wager && (
                <div className="err text-xs">
                  You need {wagerOffer.wager} ⭐ to join this wagered room.
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptWager}
                  className="btn"
                  disabled={busy || wagerOffer.balance < wagerOffer.wager}
                >
                  {busy ? 'Joining…' : 'Accept — join for ' + wagerOffer.wager + ' ⭐'}
                </button>
                <button onClick={handleDeclineWager} className="btn secondary" disabled={busy}>
                  Decline
                </button>
              </div>
            </div>
          )}

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
