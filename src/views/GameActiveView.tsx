import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameId, GameMode, User, FinishResult, NetGameProp } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore } from '../utils/store';
import { Net, OnlinePoints, RoomDoc } from '../utils/net';
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

  const handleFinish = (result: FinishResult) => {
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
    if (mode === 'online' && result.winner >= 0) {
      recordRes = result.winner === mySeat ? 'w' : 'l';
      earnedPts = recordRes === 'w' ? payout : 0;
    }

    if (recordRes === 'w') {
      earnedPts = earnedPts || payout;
      if (mode === 'online') {
        OnlinePoints.add(user.uid, earnedPts);
      } else {
        AppStore.addPoints(user.uid, earnedPts);
      }
      Sound.win();
    } else if (recordRes === 'l') {
      Sound.lose();
    } else if (result.pts) {
      earnedPts = result.pts;
      if (mode === 'online') {
        OnlinePoints.add(user.uid, earnedPts);
      } else {
        AppStore.addPoints(user.uid, earnedPts);
      }
    }

    if (recordRes && mode !== 'hotseat') {
      if (mode === 'online') {
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
        rematch: null
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
      room.seats.some(uid => uid !== user.uid && room.rematch?.[uid] === false);
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

        {finished.result && (
          <div className="text-sm">
            {finished.pts ? (
              <div className="ok font-bold text-base mb-1">
                +{finished.pts} ⭐ points
              </div>
            ) : null}
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
          <div className="turn-banner">⏳ Waiting for the other player…</div>
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
