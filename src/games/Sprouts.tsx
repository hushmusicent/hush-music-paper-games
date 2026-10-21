import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { sproutsMid, sproutsLegal, sproutsApply, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface SproutsProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const Sprouts: React.FC<SproutsProps> = ({ mode, names, onFinish }) => {
  const [state, setState] = useState(() => ({
    turn: 0,
    over: false,
    sel: -1,
    dots: [
      { x: 60, y: 130, deg: 0 },
      { x: 240, y: 130, deg: 0 },
      { x: 150, y: 45, deg: 0 }
    ],
    edges: [] as Array<{ a: number; b: number; mx: number; my: number; by: number }>
  }));
  const [errorMsg, setErrorMsg] = useState('');

  const cur = state.turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;

  const checkEnd = (s: typeof state) => {
    const legal = sproutsLegal(s);
    if (legal.length === 0) {
      const winner = 1 - (s.turn % names.length);
      setTimeout(() => {
        onFinish({
          winner,
          title: `${names[winner]} wins!`,
          body: (
            <div className="msg">
              {names[s.turn % names.length]} has no legal move left.
            </div>
          )
        });
      }, 400);
      return true;
    }
    return false;
  };

  const handleDotClick = (i: number) => {
    if (!isMine || state.over) return;
    setErrorMsg('');

    if (state.sel < 0) {
      Sound.click();
      setState(prev => ({ ...prev, sel: i }));
      return;
    }

    const a = state.sel;
    const b = i;
    const mid = sproutsMid(state.dots[a], state.dots[b]);
    const legal = sproutsLegal(state).some(
      ([x, y]) => x === Math.min(a, b) && y === Math.max(a, b)
    );

    if (!legal) {
      Sound.beep(300, 0.1, 'square');
      setErrorMsg('That move is not legal (dot full or line would cross).');
      setState(prev => ({ ...prev, sel: -1 }));
      return;
    }

    Sound.click();
    const next = JSON.parse(JSON.stringify(state));
    next.sel = -1;
    sproutsApply(next, Math.min(a, b), Math.max(a, b), mid);
    setState(next);

    if (checkEnd(next)) return;

    if (mode === 'pvc' && next.turn % 2 === 1) {
      setTimeout(() => {
        setState(prev => {
          if (prev.over || prev.turn % 2 !== 1) return prev;
          const moves = sproutsLegal(prev);
          if (!moves.length) {
            checkEnd(prev);
            return prev;
          }
          const [botA, botB, botMid] = pickA(moves);
          const botNext = JSON.parse(JSON.stringify(prev));
          botNext.sel = -1;
          sproutsApply(botNext, botA, botB, botMid);
          Sound.click();
          checkEnd(botNext);
          return botNext;
        });
      }, 600);
    }
  };

  return (
    <div>
      <div className="turn-banner">
        {state.over
          ? 'Game Over'
          : isMine
          ? `🟢 Your move — ${names[cur]}`
          : `⏳ ${names[cur]} to move`}
      </div>

      <PaperPanel>
        {errorMsg && <div className="err text-center">{errorMsg}</div>}
        <svg viewBox="0 0 300 260" className="w-full h-auto max-h-[300px] block mx-auto">
          {state.edges.map((e, idx) => {
            const A = state.dots[e.a];
            const B = state.dots[e.b];
            return (
              <path
                key={idx}
                d={`M${A.x},${A.y} Q${e.mx},${e.my} ${e.mx},${e.my} T${B.x},${B.y}`}
                fill="none"
                stroke={e.by === 0 ? '#2470c9' : '#c0392b'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}

          {state.sel >= 0 && state.dots[state.sel] && (
            <circle
              cx={state.dots[state.sel].x}
              cy={state.dots[state.sel].y}
              r="15"
              fill="none"
              stroke="#d9a726"
              strokeWidth="3.5"
            />
          )}

          {state.dots.map((d, i) => (
            <g
              key={i}
              onClick={() => handleDotClick(i)}
              className="cursor-pointer"
            >
              <circle
                cx={d.x}
                cy={d.y}
                r="11"
                fill={d.deg >= 3 ? '#bbb' : '#fffdf4'}
                stroke="#22304a"
                strokeWidth="2.5"
              />
              <text
                x={d.x}
                y={d.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#22304a"
              >
                {3 - d.deg}
              </text>
            </g>
          ))}
        </svg>

        <p className="muted text-xs text-center mt-2">
          Tap a dot, then tap a second dot (or same dot for a loop). Numbers = lives left.
          {state.sel >= 0 && ' (First dot picked — tap target dot)'}
        </p>
      </PaperPanel>
    </div>
  );
};
