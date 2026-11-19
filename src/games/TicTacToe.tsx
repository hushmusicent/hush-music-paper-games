import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface TicTacToeProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Live-room sync — present only in online mode. Reference implementation
  // for the other head-to-head games: serialize the full local state after
  // every move, apply remote state when it arrives, gate turns by mySeat.
  net?: NetGameProp;
}

interface TttState {
  board: string[];
  turn: number;
  over: boolean;
}

const EMPTY: TttState = { board: Array(9).fill(''), turn: 0, over: false };

// 3-4 player variant: every seat plays its own mark on the same 3x3
// board, turns cycle in seat order, first to complete a line wins; a full
// board with no line is a draw (a full tie — every seat shares it). 2-player
// games are unchanged: seats 0/1 are X/O exactly as before.
const MARKS = ['X', 'O', '△', '□'];
const MARK_COLORS = ['#17457e', '#c0392b', '#1e8e4e', '#8e44ad'];

export const TicTacToe: React.FC<TicTacToeProps> = ({ mode, names, onFinish, net }) => {
  const [board, setBoard] = useState<string[]>(() => [...EMPTY.board]);
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);

  const cur = turn % names.length;
  const isMine = net ? cur === net.mySeat : mode === 'pvc' ? cur === 0 : true;

  // --- net sync -----------------------------------------------------------
  const serialize = (): TttState => ({ board, turn, over });
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it.
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push({ ...EMPTY, board: [...EMPTY.board] });
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's move when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as TttState;
    if (Array.isArray(s.board) && s.board.length === 9) setBoard([...s.board]);
    if (typeof s.turn === 'number') setTurn(s.turn);
    if (typeof s.over === 'boolean') setOver(s.over);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  useEffect(() => {
    if (!over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      const w = Logic.tttWin(board);
      if (w === 'draw') {
        onFinish({
          winner: -1,
          tied: names.map((_, i) => i),
          title: 'Draw!',
          body: <div className="msg">A cat's game — nobody got three in a row.</div>
        });
      } else if (w) {
        const winner = MARKS.indexOf(w);
        onFinish({
          winner,
          title: `${names[winner]} wins!`,
          body: <div className="msg">Three in a row for {w}!</div>
        });
      } else {
        onFinish({
          winner: -1,
          tied: names.map((_, i) => i),
          title: 'Draw!',
          body: <div className="msg">A cat's game — nobody got three in a row.</div>
        });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const checkEnd = (nextBoard: string[]): boolean => {
    const w = Logic.tttWin(nextBoard);
    if (w === 'X' || w === 'O' || w === 'draw') {
      setOver(true);
      return true;
    }
    return false;
  };

  const handleClick = (i: number) => {
    if (board[i] || !isMine || over) return;
    Sound.click();
    const nextBoard = [...board];
    nextBoard[i] = MARKS[cur];
    const nextTurn = turn + 1;
    const ended = checkEnd(nextBoard);
    setBoard(nextBoard);
    setTurn(nextTurn);
    if (net) net.push({ board: nextBoard, turn: nextTurn, over: ended });
    if (ended) return;

    if (mode === 'pvc') {
      setTimeout(() => {
        const botMove = Logic.tttBest(nextBoard.slice(), 'O', 'X');
        if (botMove >= 0) {
          Sound.click();
          const botBoard = [...nextBoard];
          botBoard[botMove] = 'O';
          setBoard(botBoard);
          setTurn(t => t + 1);
          checkEnd(botBoard);
        }
      }, 500);
    }
  };

  if (net && !net.remote && net.mySeat !== 0) {
    return (
      <div>
        <div className="turn-banner">⏳ Waiting for {names[0]} to start…</div>
        <PaperPanel>
          <p className="muted text-center text-sm py-6">
            The host is setting up the board. Your moves will appear here.
          </p>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div>
      <div className="turn-banner">
        {over
          ? 'Game Over'
          : isMine
          ? `🟢 Your move — ${names[cur]}`
          : `⏳ ${names[cur]} to move`}
      </div>

      <PaperPanel>
        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto my-3">
          {board.map((cell, idx) => {
            // slight hand-drawn tilt, different for every square
            const tilt = [-5, 3, -2, 4, -3, 2, -4, 5, -1][idx];
            return (
              <div
                key={idx}
                onClick={() => handleClick(idx)}
                className={`tttcell ${cell === 'O' ? 'o' : ''}`}
              >
                {cell && (
                  <span
                    className="chalk-mark"
                    style={{ transform: `rotate(${tilt}deg)` }}
                  >
                    {cell}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="muted text-center text-xs">
          {names.map((n, i) => (
            <span key={i}>
              {i > 0 ? ' · ' : ''}
              {n} is{' '}
              <span className="chalk-inline" style={{ color: MARK_COLORS[i] }}>
                {MARKS[i]}
              </span>
            </span>
          ))}
        </p>
      </PaperPanel>
    </div>
  );
};
