import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface TicTacToeProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({ mode, names, onFinish }) => {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);

  const cur = turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;

  const checkEnd = (nextBoard: string[]) => {
    const w = Logic.tttWin(nextBoard);
    if (w === 'X') {
      setOver(true);
      setTimeout(() => {
        onFinish({
          winner: 0,
          title: `${names[0]} wins!`,
          body: <div className="msg">Three in a row for X!</div>
        });
      }, 350);
      return true;
    }
    if (w === 'O') {
      setOver(true);
      setTimeout(() => {
        onFinish({
          winner: 1,
          title: `${names[1]} wins!`,
          body: <div className="msg">Three in a row for O!</div>
        });
      }, 350);
      return true;
    }
    if (w === 'draw') {
      setOver(true);
      setTimeout(() => {
        onFinish({
          winner: -1,
          title: 'Draw!',
          body: (
            <div className="msg">
              A cat's game — nobody got three in a row.
            </div>
          )
        });
      }, 350);
      return true;
    }
    return false;
  };

  const handleClick = (i: number) => {
    if (board[i] || !isMine || over) return;
    Sound.click();
    const nextBoard = [...board];
    nextBoard[i] = cur === 0 ? 'X' : 'O';
    setBoard(nextBoard);
    setTurn(t => t + 1);

    if (checkEnd(nextBoard)) return;

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
          {names[0]} is{' '}
          <span className="chalk-inline" style={{ color: '#17457e' }}>
            X
          </span>{' '}
          · {names[1]} is{' '}
          <span className="chalk-inline" style={{ color: '#c0392b' }}>
            O
          </span>
        </p>
      </PaperPanel>
    </div>
  );
};
