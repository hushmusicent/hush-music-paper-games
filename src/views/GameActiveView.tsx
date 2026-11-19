import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameId, GameMode, User, FinishResult, NetGameProp } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore, PVP_WIN_POINTS } from '../utils/store';
import { Backend, Net, OnlinePoints, RoomDoc } from '../utils/net';
import { VoiceBar } from '../components/VoiceBar';
import { ChatBox } from '../components/ChatBox';
import { Modal } from '../components/Modal';
import { Sound } from '../utils/sound';

// 15 Games
import { DotsAndBoxes } from '../games/DotsAndBoxes';
import { TicTacToe } from '../games/TicTacToe';
import { Hangman } from '../games/Hangman';
import { Sprouts } from '../games/Sprouts';
import { SimGame } from '../games/SimGame';
import { BullsAndCows } from '../games/BullsAndCows';
import { CategoriesGame } from '../games/CategoriesGame';
import { MashGame } from '../games/MashGame';
import { TabooGame } from '../games/TabooGame';
import { CrosswordGame } from '../games/CrosswordGame';
import { WordSearchGame } from '../games/WordSearchGame';
import { GhostGame } from '../games/GhostGame';
import { WordLadderGame } from '../games/WordLadderGame';
import { ConsequencesGame } from '../games/ConsequencesGame';
import { PaperTelephone } from '../games/PaperTelephone';

interface GameActiveViewProps {
  gameId: GameId;
  mode: GameMode;
  user: User;
  roomCode?: string;
  dotsLevel?: number;
  hangLevel?: number;
  sproutsDots?: number;
  simDots?: number;
  simShape?: 'ring' | 'grid' | 'scatter';
  onQuit: () => void;
  onPointsUpdated: () => void;
}

export const GameActiveView: React.FC<GameActiveViewProps> = ({
  gameId,
  mode,
  user,
  roomCode,
  dotsLevel,
  hangLevel,
  sproutsDots,
  simDots,
  simShape,
  onQuit,
  onPointsUpdated
}) => {
  const g = GAMES_METADATA[gameId];

  // Live room session (online mode only): the room doc is the shared truth.
  const [room, setRoom] = useState<RoomDoc | null>(() => Net.room);
  const mySeat = mode === 'online' && room ? room.seats.indexOf(user.uid) : -1;

  useEffect(() => {
    if (mode !== 'online') return;
    if (roomCode && (!Net.room || Net.room.code !== roomCode)) Net.listen(roomCode);
    const off = Net.onRoom(setRoom);
    return off;
  }, [mode, roomCode]);

  // Names come from the room in online mode (seat order = names order).
  const names = useMemo(() => {
    if (mode === 'pvc') return [user.username, 'Computer 🤖'];
    if (mode === 'online' && room) {
      return room.seats.map((uid, i) => room.names[uid] || 'Player ' + (i + 1));
    }
    return ['Player 1', 'Player 2'];
  }, [mode, room, user.username]);

  // The sync prop handed to head-to-head games. Each game's serialize()
  // must carry `turn` and `over` top-level so the room doc stays truthful.
  const netProp: NetGameProp | undefined = useMemo(() => {
    if (mode !== 'online' || !room) return undefined;
    return {
      mySeat,
      remote: room.state ?? null,
      push: (serialized: any) => {
        Net.push({
          state: serialized,
          turn: typeof serialized.turn === 'number' ? serialized.turn : room.turn,
          status: serialized.over ? 'over' : 'playing'
        });
      }
    };
  }, [mode, room, mySeat]);

  const [quitModalOpen, setQuitModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [finished, setFinished] = useState<FinishResult | null>(null);
  const [rematchWaiting, setRematchWaiting] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const rematchResetSentRef = useRef(false);
  const sawOverRef = useRef(false);
  // Wager outcome shown on the results card (+pot / +refund / −lost).
  const [wagerDelta, setWagerDelta] = useState(0);
  const wagerHoldKeyRef = useRef('');
  const wagerSettleKeyRef = useRef('');
  const finishLockKeyRef = useRef('');

  // Wager hold: when a wagered online game starts, each player pays their
  // wager from their own balance, once per game. The room flag is the
  // cross-phone guard; the key ref covers the async window before it lands.
  useEffect(() => {
    if (mode !== 'online' || !room) return;
    const wager = room.wager || 0;
    if (room.status !== 'playing' || wager <= 0) return;
    if (room.wagerHeld?.[user.uid]) return;
    const key = room.code + ':' + roundKey;
    if (wagerHoldKeyRef.current === key) return;
    wagerHoldKeyRef.current = key;
    OnlinePoints.add(user.uid, -wager).catch(() => {});
    Backend.db
      .ref('pg_rooms/' + room.code + '/wagerHeld/' + user.uid)
      .set(true)
      .catch(() => {});
    onPointsUpdated();
    // onPointsUpdated is stable from App (refreshPoints).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, room, roundKey, user.uid]);

  const handleFinish = (result: FinishResult) => {
    if (mode === 'online' && room) {
      const sKey = room.code + ':' + roundKey;
      if (finishLockKeyRef.current === sKey) return;
      finishLockKeyRef.current = sKey;
    }
    const payout = g.payout || 50;
    let earnedPts = 0;
    let recordRes: 'w' | 'l' | 't' | null = null;

    if (result.result !== undefined) {
      recordRes = result.result;
      earnedPts = result.pts ?? (result.result === 'w' ? payout : 0);
    } else if (result.winner === -1) {
      recordRes = 't';
    } else if (mode === 'hotseat') {
      recordRes = null;
    } else {
      recordRes = result.winner === 0 ? 'w' : 'l';
    }
    // Online, the winner is a SEAT, not "player 1": a guest win is a win
    // on the guest's phone too. (Games report winner as a seat index.)
    // A PvP win pays the flat 200 (same as Show Games), not the small
    // vs-computer payout — the wager pot lands on top of it.
    if (mode === 'online' && result.winner >= 0) {
      recordRes = result.winner === mySeat ? 'w' : 'l';
      earnedPts = recordRes === 'w' ? PVP_WIN_POINTS : 0;
    }

    // Tied for first (3-4 player games report `tied`, the seats sharing the
    // top score; a winner of -1 with no `tied` list is a full tie — every
    // seat). A tied player records a tie, gets the 100 ⭐ tie credit
    // (the 2-player tie rule is 100/100 + wager refund), and shares the
    // pot — see the wager block below.
    const seatCount = mode === 'online' && room ? room.seats.length : names.length;
    const tiedSeats: number[] =
      result.tied && result.tied.length
        ? result.tied
        : result.winner === -1 || result.result === 't'
        ? names.map((_, i) => i)
        : [];
    const iAmTied = mode === 'online' && result.winner === -1 && tiedSeats.includes(mySeat);
    if (mode === 'online' && result.winner === -1) {
      // A draw with a `tied` list is a PARTIAL tie: only the tied seats
      // record a tie and share the pot. The other seats LOST — the old
      // code recorded 't' (and refunded the wager) for everyone whenever
      // winner was -1, which would have paid the outright loser a pot share.
      recordRes = iAmTied ? 't' : 'l';
      earnedPts = iAmTied ? 100 : 0;
    }

    // Room-level win-settle flag (online PvP only): the 200 ⭐ win + win
    // record pay once per game per player, across mounts. The per-mount
    // finishLockKeyRef above cannot cover a rejoin (fresh mount), and
    // every head-to-head game re-fires onFinish from applied remote
    // over-state — so without this, rejoining a finished room as the
    // winner would farm +200 ⭐ and +1 win on every rejoin. Mirrors the
    // wagerSettled pattern below: the room flag is the cross-mount guard.
    // The same flag also covers the 100 ⭐ tie credit: a tied player who
    // rejoins a finished room must not be paid the tie credit again.
    let winAlreadySettled = false;
    if (mode === 'online' && room && (recordRes === 'w' || recordRes === 't')) {
      winAlreadySettled = !!room.winSettled?.[user.uid];
      if (!winAlreadySettled) {
        Backend.db
          .ref('pg_rooms/' + room.code + '/winSettled/' + user.uid)
          .set(true)
          .catch(() => {});
      }
    }

    // Wager outcome (online PvP only): the pot is N x wager — every seated
    // player held their own wager at the start, so a 3-player 100 ⭐ room
    // holds a 300 ⭐ pot and a 4-player one 400 ⭐. The winner takes the
    // whole pot on top of the normal win payout; a full tie refunds every
    // wager; a partial tie (some seats tied for first) splits the pot
    // equally among the tied seats (Math.floor — a remainder of 1-2 ⭐
    // from an uneven split stays unclaimed). The delta is folded into the
    // single points write below — two back-to-back read-modify-write adds
    // on the same row would race and lose one. Each phone settles only
    // its own side, once per game (room flag + key ref), and only if it
    // actually held its wager at the start.
    let delta = 0;
    const wager = mode === 'online' && room ? room.wager || 0 : 0;
    if (wager > 0 && recordRes && room && room.wagerHeld?.[user.uid]) {
      const sKey = room.code + ':' + roundKey;
      if (!room.wagerSettled?.[user.uid] && wagerSettleKeyRef.current !== sKey) {
        wagerSettleKeyRef.current = sKey;
        const pot = wager * seatCount;
        if (recordRes === 'w') {
          delta = pot;
        } else if (recordRes === 't') {
          delta =
            tiedSeats.length >= seatCount
              ? wager // full tie: refund
              : Math.floor(pot / Math.max(1, tiedSeats.length));
        } else {
          delta = -wager;
        }
        setWagerDelta(delta);
        Backend.db
          .ref('pg_rooms/' + room.code + '/wagerSettled/' + user.uid)
          .set(true)
          .catch(() => {});
      }
    }

    if (recordRes === 'w') {
      earnedPts = earnedPts || payout;
      Sound.win();
    } else if (recordRes === 'l') {
      Sound.lose();
    } else if (result.pts) {
      earnedPts = result.pts;
    }

    // A repeat win (rejoin of a finished room) credits nothing — the win
    // was already paid when the flag above was set. Zeroing here (after
    // the payout fallback) also keeps the results card honest: it shows
    // no +200 line for points that never land.
    if (winAlreadySettled) {
      earnedPts = 0;
    }

    // One points write for the whole finish: win payout + wager pot/refund.
    // (A loss pays nothing — its wager was already held at game start.)
    // NOTE: the store is picked by the ACCOUNT mode (Backend.mode), not the
    // game mode — a vs-computer win while signed in online must land on the
    // online total. The old code branched on the game mode, so PvC wins in
    // online mode went to AppStore.addPoints, which silently drops points
    // for a Firebase uid with no local account (and the record with it).
    const credit = earnedPts + Math.max(0, delta);
    const onlineAccount = Backend.mode === 'firebase';
    if (credit > 0) {
      if (onlineAccount) {
        OnlinePoints.add(user.uid, credit);
      } else {
        AppStore.addPoints(user.uid, credit);
      }
    }

    if (recordRes && mode !== 'hotseat' && !winAlreadySettled) {
      if (onlineAccount) {
        OnlinePoints.record(user.uid, gameId, recordRes);
      } else {
        AppStore.recordResult(user.uid, gameId, recordRes);
      }
    }

    onPointsUpdated();
    setFinished({
      ...result,
      pts: earnedPts,
      result: recordRes
    });
  };

  // Forfeit settle (wagered online PvP only): if every opponent quits
  // mid-game while status is 'playing', claim the win + the full N x wager
  // pot once and mark our own side settled + room 'over'. Guarded by
  // wagerSettled, winSettled, wagerSettleKeyRef, and finishLockKeyRef so it
  // can never double-pay — and so a later rejoin of this finished room
  // cannot pay the forfeit win a second time through handleFinish either.
  // With 3-4 players the settle fires only when I am the last player
  // standing — a single quitter in a bigger room just leaves (see the
  // turn-skip effect below, which moves play past their seat); the
  // quitter's held wager stays in the pot for the eventual winner.
  useEffect(() => {
    if (mode !== 'online' || !room || finished) return;
    const wager = room.wager || 0;
    if (wager <= 0 || room.status !== 'playing' || room.state?.over) return;
    if (room.forfeit?.[user.uid]) return;
    const others = (room.seats || []).filter(uid => uid !== user.uid);
    const otherForfeited = others.filter(uid => room.forfeit?.[uid] === true);
    if (otherForfeited.length === 0 || otherForfeited.length < others.length) return;
    if (!room.wagerHeld?.[user.uid]) return;

    const sKey = room.code + ':' + roundKey;
    if (
      room.wagerSettled?.[user.uid] ||
      room.winSettled?.[user.uid] ||
      wagerSettleKeyRef.current === sKey ||
      finishLockKeyRef.current === sKey
    ) {
      return;
    }

    wagerSettleKeyRef.current = sKey;
    finishLockKeyRef.current = sKey;
    const delta = wager * room.seats.length;
    const credit = PVP_WIN_POINTS + delta;
    setWagerDelta(delta);

    OnlinePoints.add(user.uid, credit)
      .then(() => onPointsUpdated())
      .catch(() => {});
    OnlinePoints.record(user.uid, gameId, 'w').catch(() => {});
    Backend.db
      .ref('pg_rooms/' + room.code)
      .update({
        status: 'over',
        [`wagerSettled/${user.uid}`]: true,
        [`winSettled/${user.uid}`]: true
      })
      .catch(() => {});
    Sound.win();
    onPointsUpdated();

    const forfeiterNames = otherForfeited.map(
      uid => names[(room.seats || []).indexOf(uid)] || 'Opponent'
    );

    setFinished({
      winner: mySeat,
      pts: PVP_WIN_POINTS,
      result: 'w',
      title: `${names[mySeat] || user.username} wins!`,
      body: (
        <div className="msg">
          {forfeiterNames.join(' & ')} quit mid-game — you win by forfeit!
        </div>
      )
    });
    // onPointsUpdated is stable from App (refreshPoints).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, room, finished, roundKey, user.uid, user.username, mySeat, gameId, names]);

  // Turn-skip for a forfeited seat (3-4 player rooms): turns cycle in seat
  // order, so a quitter's turn would stall the game forever — nobody can
  // move for their seat. When the room's current turn belongs to a
  // forfeited seat, the lowest-seat player still in the game advances the
  // shared turn by one (same state, turn + 1); the games apply the new turn
  // from remote state like any other move. One designated skipper, so two
  // phones can never double-skip. Skips repeat while the next seat is also
  // forfeited; when only one player is left the forfeit-settle effect above
  // ends the game instead. No-op in 2-player rooms (a single quitter there
  // is always "last one standing" for the other side).
  useEffect(() => {
    if (mode !== 'online' || !room || finished) return;
    if (room.status !== 'playing' || room.state?.over) return;
    if (!room.state || typeof room.state.turn !== 'number') return;
    const seats = room.seats || [];
    if (seats.length < 3) return;
    const forfeit = room.forfeit || {};
    if (!Object.keys(forfeit).some(uid => forfeit[uid])) return;
    const live = seats.filter(uid => !forfeit[uid]);
    if (live.length < 2) return;
    if (!live.includes(user.uid)) return;
    const lowestLiveSeat = Math.min(...live.map(uid => seats.indexOf(uid)));
    if (mySeat !== lowestLiveSeat) return;
    const curSeat = ((room.turn % seats.length) + seats.length) % seats.length;
    if (!forfeit[seats[curSeat]]) return;
    Net.push({
      state: { ...room.state, turn: room.turn + 1 },
      turn: room.turn + 1
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, room, finished, user.uid, mySeat]);

  // Online rematch coordination over the existing room doc:
  // 1) Each player tapping "Play again" records rematch/<uid>: true.
  // 2) Once all seated players want a rematch, the host resets the room doc
  //    back to playing (state: null, turn: 0, rematch: null).
  // 3) Both phones detect the reset from 'over' -> 'playing' and clear the
  //    finished overlay + remount a fresh game.
  // 4) If the other player quits instead (rematch/<uid>: false), cancel and
  //    drop the waiting player back to the mode screen.
  useEffect(() => {
    if (mode !== 'online' || !room) return;
    if (room.status === 'over') {
      sawOverRef.current = true;
    }

    const seats = room.seats || [];
    const otherSeats = seats.filter(uid => uid !== user.uid);
    const rematchMap = room.rematch || {};

    if (rematchWaiting && otherSeats.some(uid => rematchMap[uid] === false)) {
      setRematchWaiting(false);
      setFinished(null);
      onQuit();
      return;
    }

    const allWantRematch =
      seats.length >= room.seatsNeeded &&
      seats.every(uid => rematchMap[uid] === true);
    if (
      room.status === 'over' &&
      allWantRematch &&
      room.host === user.uid &&
      !rematchResetSentRef.current
    ) {
      rematchResetSentRef.current = true;
      Net.push({
        state: null,
        turn: 0,
        status: 'playing',
        rematch: null,
        // A rematch re-uses the same wager: clear the hold/settle flags so
        // the next game holds and settles fresh.
        wagerHeld: null,
        wagerSettled: null,
        // ... and the win-settle flag, so the new game's winner can pay.
        winSettled: null,
        // ... and the forfeit flag, so a forfeiter from the last game
        // cannot end the new game before it starts.
        forfeit: null
      });
      return;
    }

    const roomResetToPlay =
      room.status === 'playing' && (!room.state || room.state.over === false);
    if (finished && sawOverRef.current && roomResetToPlay) {
      rematchResetSentRef.current = false;
      sawOverRef.current = false;
      setRematchWaiting(false);
      setFinished(null);
      setWagerDelta(0);
      setRoundKey(k => k + 1);
    }
  }, [mode, room, finished, rematchWaiting, user.uid, onQuit]);

  const handlePlayAgain = () => {
    Sound.click();
    if (mode === 'online') {
      if (!room) {
        onQuit();
        return;
      }
      const otherSeats = room.seats.filter(uid => uid !== user.uid);
      if (otherSeats.some(uid => room.rematch?.[uid] === false)) {
        onQuit();
        return;
      }
      rematchResetSentRef.current = false;
      setRematchWaiting(true);
      Net.push({ [`rematch/${user.uid}`]: true });
      return;
    }
    setFinished(null);
    setWagerDelta(0);
  };

  const handleQuitFromFinished = () => {
    Sound.click();
    if (mode === 'online' && room) {
      Net.push({ [`rematch/${user.uid}`]: false });
    }
    onQuit();
  };

  const renderGame = () => {
    switch (gameId) {
      case 'dots':
        return (
          <DotsAndBoxes
            mode={mode}
            names={names}
            onFinish={handleFinish}
            level={dotsLevel}
            net={netProp}
          />
        );
      case 'ttt':
        return (
          <TicTacToe mode={mode} names={names} onFinish={handleFinish} net={netProp} />
        );
      case 'hangman':
        return (
          <Hangman
            mode={mode}
            names={names}
            onFinish={handleFinish}
            level={hangLevel}
            net={netProp}
          />
        );
      case 'sprouts':
        return (
          <Sprouts
            mode={mode}
            names={names}
            onFinish={handleFinish}
            dots={sproutsDots}
            net={netProp}
          />
        );
      case 'sim':
        return (
          <SimGame
            mode={mode}
            names={names}
            onFinish={handleFinish}
            dots={simDots}
            shape={simShape}
            net={netProp}
          />
        );
      case 'bulls':
        return (
          <BullsAndCows mode={mode} names={names} onFinish={handleFinish} net={netProp} />
        );
      case 'categories':
        return (
          <CategoriesGame mode={mode} names={names} onFinish={handleFinish} />
        );
      case 'mash':
        return <MashGame mode={mode} names={names} onFinish={handleFinish} />;
      case 'taboo':
        return <TabooGame mode={mode} names={names} onFinish={handleFinish} />;
      case 'crossword':
        return (
          <CrosswordGame mode={mode} names={names} onFinish={handleFinish} />
        );
      case 'wordsearch':
        return (
          <WordSearchGame mode={mode} names={names} onFinish={handleFinish} net={netProp} />
        );
      case 'ghost':
        return (
          <GhostGame mode={mode} names={names} onFinish={handleFinish} net={netProp} />
        );
      case 'ladder':
        return (
          <WordLadderGame mode={mode} names={names} onFinish={handleFinish} />
        );
      case 'consequences':
        return (
          <ConsequencesGame mode={mode} names={names} onFinish={handleFinish} />
        );
      case 'telephone':
        return (
          <PaperTelephone mode={mode} names={names} onFinish={handleFinish} />
        );
      default:
        return <div>Unknown game</div>;
    }
  };

  if (finished) {
    const isWin = finished.result === 'w';
    const isTie = finished.result === 't';
    const otherDeclined =
      mode === 'online' &&
      !!room &&
      room.seats.some(
        uid =>
          uid !== user.uid &&
          (room.rematch?.[uid] === false || room.forfeit?.[uid] === true)
      );
    const otherWantsRematch =
      mode === 'online' &&
      !!room &&
      room.seats.some(uid => uid !== user.uid && room.rematch?.[uid] === true);
    return (
      <div className="card text-center my-6 p-6 space-y-4">
        <div className="text-6xl animate-bounce">
          {isTie ? '🤝' : isWin ? '🏆' : '😞'}
        </div>
        <h2 className="text-2xl font-black text-[var(--ink2)]">
          {finished.title ||
            (isTie
              ? 'Draw!'
              : finished.winner >= 0
              ? `${names[finished.winner]} wins!`
              : 'Game Over')}
        </h2>

        {finished.body}

        {mode === 'online' && room && (
          <div className="text-[var(--muted)] text-xs">
            Players: {names.join(' · ')}
          </div>
        )}

        {finished.result && (
          <div className="text-sm">
            {finished.pts ? (
              <div className="ok font-bold text-base mb-1">
                +{finished.pts} ⭐ points
              </div>
            ) : null}
            {wagerDelta !== 0 && (
              <div className="font-bold text-base mb-1">
                {wagerDelta > 0
                  ? `💰 Wager +${wagerDelta} ⭐`
                  : `💰 Wager ${wagerDelta} ⭐`}
              </div>
            )}
            <div className="text-[var(--muted)] text-xs">
              Result recorded:{' '}
              {finished.result === 'w'
                ? 'Win'
                : finished.result === 'l'
                ? 'Loss'
                : 'Tie'}
            </div>
          </div>
        )}

        {mode === 'online' && rematchWaiting ? (
          <div className="turn-banner">
            {room && room.seatsNeeded > 2
              ? (() => {
                  const pending = room.seats.filter(
                    uid => uid !== user.uid && room.rematch?.[uid] !== true
                  ).length;
                  return pending === 0
                    ? '⏳ Waiting for the other players…'
                    : `⏳ Waiting for ${pending} more player${pending === 1 ? '' : 's'}…`;
                })()
              : '⏳ Waiting for the other player…'}
          </div>
        ) : (
          <>
            {!otherDeclined && otherWantsRematch && (
              <div className="msg text-xs">
                🔄 The other player wants a rematch!
              </div>
            )}
            {otherDeclined && (
              <div className="text-xs text-[var(--muted)]">
                The other player left the room.
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {!otherDeclined && (
                <button onClick={handlePlayAgain} className="btn flex-1">
                  Play again
                </button>
              )}
              <button
                onClick={handleQuitFromFinished}
                className="btn secondary flex-1"
              >
                All games
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top action row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            Sound.click();
            setQuitModalOpen(true);
          }}
          className="btn secondary small !m-0"
        >
          ← Quit
        </button>
        <button
          onClick={() => {
            Sound.click();
            setRulesModalOpen(true);
          }}
          className="btn secondary small !m-0"
        >
          📖 How to play
        </button>
        <span className="flex-1" />
        <span className="text-[var(--muted)] text-xs font-semibold">
          {mode === 'pvc'
            ? '🤖 vs Computer'
            : mode === 'online'
            ? '🌐 Online'
            : '👥 Pass & Play'}
        </span>
      </div>

      <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
        <span>{g.icon}</span>
        <span>{g.name}</span>
        {roomCode && (
          <span className="text-xs bg-[var(--card2)] px-2 py-0.5 rounded-full border border-[var(--line)]">
            Room {roomCode}
          </span>
        )}
      </h2>

      <VoiceBar roomCode={roomCode} user={user} />

      {/* The Active Game */}
      <div key={roundKey}>{renderGame()}</div>

      {/* In-game chat */}
      <div className="card mt-4">
        <h3 className="font-bold text-sm">💬 Game chat</h3>
        <ChatBox
          chatPath={roomCode ? `room_${roomCode}` : `game_${gameId}`}
          user={user}
        />
      </div>

      {/* Quit confirmation modal */}
      <Modal isOpen={quitModalOpen}>
        <h3 className="font-bold text-base mb-1">✏️ Quit game?</h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Are you sure you want to quit? Your progress in this game will be lost.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setQuitModalOpen(false);
              onQuit();
            }}
            className="btn danger flex-1"
          >
            Yes, quit
          </button>
          <button
            onClick={() => setQuitModalOpen(false)}
            className="btn secondary flex-1"
          >
            Keep playing
          </button>
        </div>
      </Modal>

      {/* Rules modal */}
      <Modal isOpen={rulesModalOpen}>
        <h3 className="font-bold text-base mb-2">
          {g.icon} {g.name} — official rules
        </h3>
        <div className="text-sm leading-relaxed text-[#22304a] bg-white p-3 rounded-lg border border-[#9db9dc] mb-4">
          {g.rules}
        </div>
        <button onClick={() => setRulesModalOpen(false)} className="btn">
          Got it
        </button>
      </Modal>
    </div>
  );
};
