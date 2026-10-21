import React, { useState, useEffect } from 'react';
import { GameMode, FinishResult } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface DotsAndBoxesProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Chosen on the level selection screen (GameModeView) BEFORE the game starts.
  level?: number;
}

export const DotsAndBoxes: React.FC<DotsAndBoxesProps> = ({ mode, names, onFinish, level: levelProp }) => {
  const level = Math.max(1, Math.min(50, levelProp || 1));
  const [state, setState] = useState(() => { const sz = Logic.dotsSizeForLevel(level); return Logic.dotsNew(sz.w, sz.h); });

  const cur = state.turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;
  const cols = state.cols;
  const rows = state.rows;
  const totalBoxes = cols * rows;

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
              Level {level} · {newState.cols}×{newState.rows} boxes — final: {names[0]}: {s0} ·{' '}
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
    if (!isMine || state.over) return;
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

  /* ---------- the dot sheet (look: the printed Dots & Boxes pages) ---------- */
  const SP = 60; // spacing between dots
  const PAD = 34; // page margin
  const W = PAD * 2 + SP * cols;
  const H = PAD * 2 + SP * rows;
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
            🎚️ Level {level} · {cols}×{rows}
          </span>
          <span className="chip">
            {state.scores[0] + state.scores[1]}/{totalBoxes} boxes
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Dots and Boxes board, level ${level}`}
        >
          {/* claimed boxes: light wash + the player's mark, like initials on paper */}
          {state.boxes.map((o, bi) => {
            if (!o) return null;
            const br = Math.floor(bi / cols);
            const bc = bi % cols;
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
            const r = Math.floor(idx / cols);
            const c = idx % cols;
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
            const r = Math.floor(idx / (cols + 1));
            const c = idx % (cols + 1);
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
            const r = Math.floor(idx / cols);
            const c = idx % cols;
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
            const r = Math.floor(idx / (cols + 1));
            const c = idx % (cols + 1);
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
          {Array.from({ length: rows + 1 }).map((_, r) =>
            Array.from({ length: cols + 1 }).map((__, c) => (
              <circle key={'d' + r + '-' + c} cx={X(c)} cy={Y(r)} r={dotR} fill="#111111" />
            ))
          )}
        </svg>

        <p className="muted text-center mt-2 text-xs">
          Tap a gap between dots to draw your line. Complete a box to go again!
        </p>
      </PaperPanel>
    </div>
  );
};
