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

export const DotsAndBoxes: React.FC<DotsAndBoxesProps> = ({ mode, names, onFinish }) => {
  const [state, setState] = useState(() => Logic.dotsNew(4));

  const cur = state.turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;

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
              Final boxes — {names[0]}: {s0} · {names[1]}: {s1}.
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

  const n = state.n;
  const cols = [];
  for (let i = 0; i < 2 * n + 1; i++) {
    cols.push(i % 2 ? '44px' : '14px');
  }

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
        <div className="flex gap-2 mb-3">
          <span className="chip">
            ✕ {names[0]}: {state.scores[0]}
          </span>
          <span className="chip">
            ◯ {names[1]}: {state.scores[1]}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: cols.join(' '),
            gap: '1px',
            justifyContent: 'center',
            margin: '12px auto'
          }}
        >
          {Array.from({ length: 2 * n + 1 }).map((_, r) =>
            Array.from({ length: 2 * n + 1 }).map((__, c) => {
              if (r % 2 === 0 && c % 2 === 0) {
                return (
                  <div key={`${r}-${c}`} className="dotcell">
                    <i />
                  </div>
                );
              } else if (r % 2 === 0) {
                const er = r / 2;
                const ec = (c - 1) / 2;
                const t = state.h[er * n + ec];
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleEdgeClick('h', er, ec)}
                    disabled={!!t || !isMine || state.over}
                    className={`edgebtn ${t ? 't' + (t - 1) : ''}`}
                    style={{ height: '10px', width: '100%' }}
                  />
                );
              } else if (c % 2 === 0) {
                const er = (r - 1) / 2;
                const ec = c / 2;
                const t = state.v[er * (n + 1) + ec];
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleEdgeClick('v', er, ec)}
                    disabled={!!t || !isMine || state.over}
                    className={`edgebtn ${t ? 't' + (t - 1) : ''}`}
                    style={{ height: '100%', width: '10px', justifySelf: 'center' }}
                  />
                );
              } else {
                const br = (r - 1) / 2;
                const bc = (c - 1) / 2;
                const o = state.boxes[br * n + bc];
                return (
                  <div
                    key={`${r}-${c}`}
                    className="boxcell"
                    style={{
                      background: o
                        ? o === 1
                          ? 'rgba(88,166,255,0.35)'
                          : 'rgba(224,101,79,0.35)'
                        : 'transparent'
                    }}
                  >
                    {o ? (o === 1 ? '✕' : '◯') : ''}
                  </div>
                );
              }
            })
          )}
        </div>

        <p className="muted text-center mt-2 text-xs">
          Tap a gap between dots to draw your line. Complete a box to go again!
        </p>
      </PaperPanel>
    </div>
  );
};
