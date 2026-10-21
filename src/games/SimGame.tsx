import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { Logic, pickA, simPositions, SimShape } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface SimGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Chosen on the option screen BEFORE the game starts.
  dots?: number;
  shape?: SimShape;
}

const SHAPE_LABEL: Record<SimShape, string> = {
  ring: 'Ring',
  grid: 'Grid',
  scatter: 'Scatter'
};

export const SimGame: React.FC<SimGameProps> = ({ mode, names, onFinish, dots, shape }) => {
  const count = Math.max(6, Math.min(10, dots || 6));
  const boardShape: SimShape = shape || 'ring';
  const POS = simPositions(count, boardShape);
  const totalPairs = (count * (count - 1)) / 2;
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);
  const [sel, setSel] = useState<number>(-1);
  const [edges, setEdges] = useState<Record<string, number>>({});

  const cur = turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;

  const checkEnd = (currentEdges: Record<string, number>, lastSeat: number) => {
    const mineEdges = Object.keys(currentEdges).filter(
      k => currentEdges[k] === lastSeat
    );
    const tri = Logic.simHasTriangle(mineEdges);
    if (tri) {
      setOver(true);
      const winner = 1 - lastSeat;
      setTimeout(() => {
        onFinish({
          winner,
          title: `${names[winner]} wins!`,
          body: (
            <div className="msg">
              {names[lastSeat]} completed a triangle in their own color (
              {tri.map(x => x + 1).join('-')}) and loses!
            </div>
          )
        });
      }, 400);
      return true;
    }

    const freeCount = totalPairs - Object.keys(currentEdges).length;
    if (freeCount === 0) {
      setOver(true);
      setTimeout(() => {
        onFinish({
          winner: lastSeat,
          title: `${names[lastSeat]} wins!`,
          body: (
            <div className="msg">
              The board is full — {names[1 - lastSeat]} has no move and loses.
            </div>
          )
        });
      }, 400);
      return true;
    }
    return false;
  };

  const handleDotClick = (i: number) => {
    if (!isMine || over) return;

    if (sel < 0) {
      Sound.click();
      setSel(i);
      return;
    }

    const a = Math.min(sel, i);
    const b = Math.max(sel, i);
    if (a === b || edges[`${a}-${b}`] != null) {
      setSel(-1);
      return;
    }

    Sound.click();
    setSel(-1);
    const seat = cur;
    const nextEdges = { ...edges, [`${a}-${b}`]: seat };
    setEdges(nextEdges);
    setTurn(t => t + 1);

    if (checkEnd(nextEdges, seat)) return;

    if (mode === 'pvc') {
      setTimeout(() => {
        setEdges(prevEdges => {
          const free: Array<[number, number]> = [];
          for (let x = 0; x < count; x++) {
            for (let y = x + 1; y < count; y++) {
              if (prevEdges[`${x}-${y}`] == null) free.push([x, y]);
            }
          }
          if (!free.length) return prevEdges;

          const botEdges = Object.keys(prevEdges).filter(k => prevEdges[k] === 1);
          const safe = free.filter(
            ([fx, fy]) => !Logic.simLoses([...botEdges, `${fx}-${fy}`])
          );
          const [ba, bb] = pickA(safe.length ? safe : free);

          const botNext = { ...prevEdges, [`${ba}-${bb}`]: 1 };
          Sound.click();
          setTurn(t => t + 1);
          checkEnd(botNext, 1);
          return botNext;
        });
      }, 600);
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
        <div className="text-center mb-1">
          <span className="chip">
            ⬡ {count} dots · {SHAPE_LABEL[boardShape]}
          </span>
        </div>
        <svg viewBox="0 0 300 260" className="w-full h-auto max-h-[300px] block mx-auto">
          {Object.keys(edges).map(k => {
            const [a, b] = k.split('-').map(Number);
            const p = edges[k];
            return (
              <line
                key={k}
                x1={POS[a][0]}
                y1={POS[a][1]}
                x2={POS[b][0]}
                y2={POS[b][1]}
                stroke={p === 0 ? '#2470c9' : '#c0392b'}
                strokeWidth="4"
              />
            );
          })}

          {POS.map((p, i) => (
            <g
              key={i}
              onClick={() => handleDotClick(i)}
              className="cursor-pointer"
            >
              <circle
                cx={p[0]}
                cy={p[1]}
                r={sel === i ? 14 : 11}
                fill={sel === i ? '#ffe9a8' : '#fffdf4'}
                stroke="#22304a"
                strokeWidth="2.5"
              />
            </g>
          ))}
        </svg>

        <p className="muted text-xs text-center mt-2">
          You draw in{' '}
          <b style={{ color: cur === 0 ? '#2470c9' : '#c0392b' }}>
            {cur === 0 ? 'blue' : 'red'}
          </b>
          . Tap two dots to connect them. Complete a triangle in YOUR color and you
          lose!
        </p>
      </PaperPanel>
    </div>
  );
};
