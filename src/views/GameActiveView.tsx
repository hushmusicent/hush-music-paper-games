import React, { useState } from 'react';
import { GameId, GameMode, User, FinishResult } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore } from '../utils/store';
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
  onQuit: () => void;
  onPointsUpdated: () => void;
}

export const GameActiveView: React.FC<GameActiveViewProps> = ({
  gameId,
  mode,
  user,
  roomCode,
  dotsLevel,
  onQuit,
  onPointsUpdated
}) => {
  const g = GAMES_METADATA[gameId];
  const [names] = useState<string[]>(() => {
    if (mode === 'pvc') return [user.username, 'Computer 🤖'];
    return ['Player 1', 'Player 2'];
  });

  const [quitModalOpen, setQuitModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [finished, setFinished] = useState<FinishResult | null>(null);

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

    if (recordRes === 'w') {
      earnedPts = earnedPts || payout;
      AppStore.addPoints(user.uid, earnedPts);
      Sound.win();
    } else if (recordRes === 'l') {
      Sound.lose();
    } else if (result.pts) {
      earnedPts = result.pts;
      AppStore.addPoints(user.uid, earnedPts);
    }

    if (recordRes && mode !== 'hotseat') {
      AppStore.recordResult(user.uid, gameId, recordRes);
    }

    onPointsUpdated();
    setFinished({
      ...result,
      pts: earnedPts,
      result: recordRes
    });
  };

  const handlePlayAgain = () => {
    Sound.click();
    setFinished(null);
  };

  const renderGame = () => {
    switch (gameId) {
      case 'dots':
        return (
          <DotsAndBoxes mode={mode} names={names} onFinish={handleFinish} level={dotsLevel} />
        );
      case 'ttt':
        return <TicTacToe mode={mode} names={names} onFinish={handleFinish} />;
      case 'hangman':
        return <Hangman mode={mode} names={names} onFinish={handleFinish} />;
      case 'sprouts':
        return <Sprouts mode={mode} names={names} onFinish={handleFinish} />;
      case 'sim':
        return <SimGame mode={mode} names={names} onFinish={handleFinish} />;
      case 'bulls':
        return <BullsAndCows mode={mode} names={names} onFinish={handleFinish} />;
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
          <WordSearchGame mode={mode} names={names} onFinish={handleFinish} />
        );
      case 'ghost':
        return <GhostGame mode={mode} names={names} onFinish={handleFinish} />;
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

        <div className="flex gap-2 pt-2">
          <button onClick={handlePlayAgain} className="btn flex-1">
            Play again
          </button>
          <button onClick={onQuit} className="btn secondary flex-1">
            All games
          </button>
        </div>
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

      <VoiceBar
        roomName={`paper-${gameId}${roomCode ? `-${roomCode}` : ''}`}
      />

      {/* The Active Game */}
      <div>{renderGame()}</div>

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
