import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface DotsAndBoxesProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Chosen on the level selection screen (GameModeView) BEFORE the game starts.
  level?: number;
  // Live-room sync — present only in online mode. Same pattern as TicTacToe:
  // serialize the full local state after every move, apply remote state when
  // it arrives, gate turns by mySeat. The Dots Logic state object itself is
  // the state (cols/rows/h/v/boxes/turn/over/scores), so serialize it whole.
  net?: NetGameProp;
}

type DotsState = ReturnType<typeof Logic.dotsNew>;

export const DotsAndBoxes: React.FC<DotsAndBoxesProps> = ({ mode, names, onFinish, level: levelProp, net }) => {
  const level = Math.max(1, Math.min(50, levelProp || 1));
  // Scores run one entry per seat: 2 in vs-computer / pass-and-play, N in
  // an online room. Turns already cycle in seat order (turn % names.length)
  // and a completed box still earns another move, so the game rotates
  // naturally with 3-4 players; the winner is whoever claims the most boxes.
  const [state, setState] = useState(() => { const sz = Logic.dotsSizeForLevel(level); return Logic.dotsNew(sz.w, sz.h, names.length); });

  const cur = state.turn % names.length;
  const isMine = net ? cur === net.mySeat : mode === 'pvc' ? cur === 0 : true;
  const cols = state.cols;
  const rows = state.rows;
  const totalBoxes = cols * rows;

  // In online mode the board (and its level) comes from the host's opening
  // state, which may differ from this device's level prop — read the level
  // back off the shared board size so both phones show the same level.
  // In pvc/hotseat effLevel === level, so nothing changes there.
  const effLevel = net
    ? Logic.DOTS_LEVELS.findIndex(([w, h]) => w === cols && h === rows) + 1 || level
    : level;

  // --- net sync -----------------------------------------------------------
  // The Logic state object already carries `turn` and `over` top-level, so
  // serializing it whole satisfies the net contract (turn + over included).
  const serialize = (): DotsState => state;
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it.
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push(JSON.parse(JSON.stringify(state)));
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's move when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as DotsState;
    if (
      typeof s.cols === 'number' && typeof s.rows === 'number' &&
      Array.isArray(s.h) && Array.isArray(s.v) && Array.isArray(s.boxes) &&
      Array.isArray(s.scores) && s.scores.length >= 2 &&
      typeof s.turn === 'number' && typeof s.over === 'boolean'
    ) {
      setState({
        cols: s.cols,
        rows: s.rows,
        h: [...s.h],
        v: [...s.v],
        boxes: [...s.boxes],
        turn: s.turn,
        over: s.over,
        scores: [...s.scores]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  useEffect(() => {
    if (!state.over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      const top = Math.max(...state.scores);
      const tied = state.scores.map((s, i) => (s === top ? i : -1)).filter(i => i >= 0);
      const winner = tied.length === 1 ? tied[0] : -1;
      const allTied = tied.length === names.length;
      const standings = names
        .map((n, i) => ({ n, s: state.scores[i] ?? 0 }))
        .sort((a, b) => b.s - a.s);
      onFinish({
        winner,
        tied,
        title:
          winner !== -1
            ? `${names[winner]} wins!`
            : allTied
            ? 'Draw!'
            : `🤝 ${tied.map(i => names[i]).join(' & ')} tie at the top!`,
        body: (
          <div className="msg">
            Level {effLevel} · {state.cols}×{state.rows} boxes — final:{' '}
            {standings.map(o => `${o.n}: ${o.s}`).join(' · ')}.
          </div>
        )
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.over]);

  const afterMove = (newState: DotsState) => {
    // Bot moves run ONLY in vs-computer mode — never online (the opponent's
    // moves arrive via net.remote) and never in hotseat. Finish now fires
    // from the state effect above instead of from here.
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
    if (net) net.push(JSON.parse(JSON.stringify(next)));
    afterMove(next);
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

  /* ---------- the dot sheet (look: the printed Dots & Boxes pages) ---------- */
  const SP = 60; // spacing between dots
  const PAD = 34; // page margin
  const W = PAD * 2 + SP * cols;
  const H = PAD * 2 + SP * rows;
  const dotR = Math.max(5, Math.round(SP * 0.115));
  const X = (c: number) => PAD + c * SP;
  const Y = (r: number) => PAD + r * SP;
  const canTap = isMine && !state.over;
  const marks = ['X', 'O', '△', '□'];
  const SEAT_COLORS = ['#1c64d8', '#d84a35', '#1e8e4e', '#8e44ad'];
  const SEAT_WASH = [
    'rgba(28,100,216,0.20)',
    'rgba(224,101,79,0.22)',
    'rgba(30,142,78,0.20)',
    'rgba(142,68,173,0.20)'
  ];

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
          {names.map((n, i) => (
            <span key={i} className="chip">
              <span className="chalk-inline" style={{ color: SEAT_COLORS[i] }}>
                {marks[i]}
              </span>{' '}
              {n}: {state.scores[i] ?? 0}
            </span>
          ))}
          <span className="chip">
            🎚️ Level {effLevel} · {cols}×{rows}
          </span>
          <span className="chip">
            {state.scores[0] + state.scores[1]}/{totalBoxes} boxes
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Dots and Boxes board, level ${effLevel}`}
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
                  fill={SEAT_WASH[(o - 1) % SEAT_WASH.length]}
                />
                <text
                  x={X(bc) + SP / 2}
                  y={Y(br) + SP / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={SP * 0.55}
                  fill={SEAT_COLORS[(o - 1) % SEAT_COLORS.length]}
                  style={{
                    fontFamily: "'Schoolbell', 'Chalkboard SE', 'Comic Sans MS', cursive"
                  }}
                  transform={`rotate(${((bi * 7) % 9) - 4} ${X(bc) + SP / 2} ${Y(br) + SP / 2})`}
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
