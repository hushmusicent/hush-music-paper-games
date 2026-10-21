import React, { useState, useEffect } from 'react';
import { GameMode, FinishResult } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface DotsAndBoxesProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

const LEVEL_KEY = 'pg_dots_level';

function savedLevel(): number {
  try {
    const v = parseInt(localStorage.getItem(LEVEL_KEY) || '1', 10);
    return v >= 1 && v <= 50 ? v : 1;
  } catch (e) {
    return 1;
  }
}

export const DotsAndBoxes: React.FC<DotsAndBoxesProps> = ({ mode, names, onFinish }) => {
  const [phase, setPhase] = useState<'pick' | 'play'>('pick');
  const [level, setLevel] = useState<number>(() => savedLevel());
  const [state, setState] = useState(() => Logic.dotsNew(Logic.dotsBoxesForLevel(savedLevel())));

  const cur = state.turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;
  const n = state.n;
  const totalBoxes = n * n;

  const startGame = (lv: number) => {
    try {
      localStorage.setItem(LEVEL_KEY, String(lv));
    } catch (e) {}
    setLevel(lv);
    setState(Logic.dotsNew(Logic.dotsBoxesForLevel(lv)));
    setPhase('play');
    Sound.click();
  };

  const afterMove = (newState: typeof state) => {
    if (newState.over) {
      setTimeout(() => {
        const s0 = newState.scores[0];
        const s1 = newState.scores[1];
        const winner = s0 === s1 ? -1 : s0 > s1 ? 0 : 1;
        onFinish({
          winner,
          title: winner === -1 ? 'Draw!' : `${names[winner]} wins!`,
          body: (
            <div className="msg">
              Level {level} · {newState.n}×{newState.n} boxes — final: {names[0]}: {s0} ·{' '}
              {names[1]}: {s1}.
            </div>
          )
        });
      }, 400);
      return;
    }

    if (mode === 'pvc' && newState.turn % 2 === 1 && !newState.over) {
      setTimeout(() => {
        setState(prev => {
          if (prev.over || prev.turn % 2 !== 1) return prev;
          const mv = Logic.dotsBotMove(prev);
          if (!mv) return prev;
          const next = JSON.parse(JSON.stringify(prev));
          const res = Logic.dotsApply(next, mv[0], mv[1], mv[2], 1);
          Sound.click();
          if (res.ok && !res.extra) {
            next.turn++;
          }
          afterMove(next);
          return next;
        });
      }, 600);
    }
  };

  const handleEdgeClick = (kind: 'h' | 'v', r: number, c: number) => {
    if (phase !== 'play' || !isMine || state.over) return;
    const next = JSON.parse(JSON.stringify(state));
    const res = Logic.dotsApply(next, kind, r, c, cur);
    if (!res.ok) return;
    Sound.click();
    if (!res.extra) {
      next.turn++;
    }
    setState(next);
    afterMove(next);
  };

  /* ---------- level picker (before the game starts) ---------- */
  if (phase === 'pick') {
    const boxes = Logic.dotsBoxesForLevel(level);
    const dotsSide = boxes + 1;
    return (
      <div>
        <div className="turn-banner">🎚️ Dots and Boxes — pick your level</div>
        <PaperPanel>
          <h3
            className="text-center font-black tracking-wide text-[#22304a]"
            style={{ fontSize: '22px', letterSpacing: '2px' }}
          >
            DOTS &amp; BOXES
          </h3>
          <p className="text-center text-xs text-[#5a6a86] mb-3">
            Higher level = a bigger sheet of dots. Level 1 starts at {2}×{2} boxes, Level 50
            tops out at 10×10 boxes.
          </p>

          <div
            className="grid gap-1.5 mb-3"
            style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
          >
            {Array.from({ length: 50 }).map((_, i) => {
              const lv = i + 1;
              const sel = lv === level;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setLevel(lv);
                    Sound.click();
                  }}
                  className="rounded-lg font-bold cursor-pointer"
                  style={{
                    padding: '7px 0',
                    fontSize: '13px',
                    border: sel ? '2px solid #1c64d8' : '1px solid #b9c8de',
                    background: sel ? '#1c64d8' : '#ffffff',
                    color: sel ? '#ffffff' : '#22304a'
                  }}
                >
                  {lv}
                </button>
              );
            })}
          </div>

          <div className="text-center mb-3">
            <span className="chip">
              Level {level} · {boxes}×{boxes} boxes · {dotsSide}×{dotsSide} dots ({dotsSide * dotsSide} dots)
            </span>
          </div>

          {/* mini dot-sheet preview, like the printed sheets */}
          <div className="flex justify-center mb-3">
            <svg
              width={Math.min(180, dotsSide * 18)}
              height={Math.min(180, dotsSide * 18)}
              viewBox={`0 0 ${dotsSide * 18} ${dotsSide * 18}`}
            >
              {Array.from({ length: dotsSide }).map((_, r) =>
                Array.from({ length: dotsSide }).map((__, c) => (
                  <circle key={`${r}-${c}`} cx={9 + c * 18} cy={9 + r * 18} r={2.6} fill="#111" />
                ))
              )}
            </svg>
          </div>

          <button onClick={() => startGame(level)} className="btn">
            ▶ Start Level {level}
          </button>
          <p className="muted text-center mt-2 text-xs">
            Tap a gap between 2 dots to draw a line. Complete the fourth side of a box to claim
            it with your mark — and go again!
          </p>
        </PaperPanel>
      </div>
    );
  }

  /* ---------- the dot sheet (look: the printed Dots & Boxes pages) ---------- */
  const SP = 60; // spacing between dots
  const PAD = 34; // page margin
  const W = PAD * 2 + SP * n;
  const dotR = Math.max(5, Math.round(SP * 0.115));
  const X = (c: number) => PAD + c * SP;
  const Y = (r: number) => PAD + r * SP;
  const canTap = isMine && !state.over;
  const marks = ['✕', '◯'];

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
        <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="chip">
            ✕ {names[0]}: {state.scores[0]}
          </span>
          <span className="chip">
            ◯ {names[1]}: {state.scores[1]}
          </span>
          <span className="chip">
            🎚️ Level {level} · {n}×{n}
          </span>
          <span className="chip">
            {state.scores[0] + state.scores[1]}/{totalBoxes} boxes
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${W}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Dots and Boxes board, level ${level}`}
        >
          {/* claimed boxes: light wash + the player's mark, like initials on paper */}
          {state.boxes.map((o, bi) => {
            if (!o) return null;
            const br = Math.floor(bi / n);
            const bc = bi % n;
            return (
              <g key={'b' + bi}>
                <rect
                  x={X(bc)}
                  y={Y(br)}
                  width={SP}
                  height={SP}
                  fill={o === 1 ? 'rgba(28,100,216,0.20)' : 'rgba(224,101,79,0.22)'}
                />
                <text
                  x={X(bc) + SP / 2}
                  y={Y(br) + SP / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={SP * 0.52}
                  fontWeight={800}
                  fill={o === 1 ? '#1c64d8' : '#d84a35'}
                >
                  {marks[o - 1]}
                </text>
              </g>
            );
          })}

          {/* drawn lines: thick black ink, like a pen on the sheet */}
          {state.h.map((t, idx) => {
            if (!t) return null;
            const r = Math.floor(idx / n);
            const c = idx % n;
            return (
              <line
                key={'hd' + idx}
                x1={X(c)}
                y1={Y(r)}
                x2={X(c + 1)}
                y2={Y(r)}
                stroke="#141414"
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}
          {state.v.map((t, idx) => {
            if (!t) return null;
            const r = Math.floor(idx / (n + 1));
            const c = idx % (n + 1);
            return (
              <line
                key={'vd' + idx}
                x1={X(c)}
                y1={Y(r)}
                x2={X(c)}
                y2={Y(r + 1)}
                stroke="#141414"
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}

          {/* open gaps: faint pencil guide + fat invisible tap target */}
          {state.h.map((t, idx) => {
            if (t) return null;
            const r = Math.floor(idx / n);
            const c = idx % n;
            return (
              <g key={'hh' + idx}>
                <line
                  x1={X(c)}
                  y1={Y(r)}
                  x2={X(c + 1)}
                  y2={Y(r)}
                  stroke="rgba(20,32,54,0.10)"
                  strokeWidth={2}
                />
                <line
                  x1={X(c)}
                  y1={Y(r)}
                  x2={X(c + 1)}
                  y2={Y(r)}
                  stroke="transparent"
                  strokeWidth={30}
                  style={{ cursor: canTap ? 'pointer' : 'default' }}
                  onClick={() => handleEdgeClick('h', r, c)}
                />
              </g>
            );
          })}
          {state.v.map((t, idx) => {
            if (t) return null;
            const r = Math.floor(idx / (n + 1));
            const c = idx % (n + 1);
            return (
              <g key={'vh' + idx}>
                <line
                  x1={X(c)}
                  y1={Y(r)}
                  x2={X(c)}
                  y2={Y(r + 1)}
                  stroke="rgba(20,32,54,0.10)"
                  strokeWidth={2}
                />
                <line
                  x1={X(c)}
                  y1={Y(r)}
                  x2={X(c)}
                  y2={Y(r + 1)}
                  stroke="transparent"
                  strokeWidth={30}
                  style={{ cursor: canTap ? 'pointer' : 'default' }}
                  onClick={() => handleEdgeClick('v', r, c)}
                />
              </g>
            );
          })}

          {/* the dots: big and black, like the printed sheets */}
          {Array.from({ length: n + 1 }).map((_, r) =>
            Array.from({ length: n + 1 }).map((__, c) => (
              <circle key={'d' + r + '-' + c} cx={X(c)} cy={Y(r)} r={dotR} fill="#111111" />
            ))
          )}
        </svg>

        <p className="muted text-center mt-2 text-xs">
          Tap a gap between dots to draw your line. Complete a box to go again!
        </p>
        <div className="text-center">
          <button
            onClick={() => setPhase('pick')}
            className="btn secondary small"
            style={{ marginTop: '4px' }}
          >
            🎚️ Change level (restart)
          </button>
        </div>
      </PaperPanel>
    </div>
  );
};
