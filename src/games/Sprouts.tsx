import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
import { sproutsLegal, sproutsApply, sproutsStartDots, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface SproutsProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Starting dots (3-20), chosen on the option screen BEFORE the game starts.
  dots?: number;
  // Live-room sync — present only in online mode. Same pattern as
  // TicTacToe: serialize the full local state after every move, apply
  // remote state when it arrives, gate turns by mySeat.
  net?: NetGameProp;
}

interface SproutsDot {
  x: number;
  y: number;
  deg: number;
}

interface SproutsEdge {
  a: number;
  b: number;
  mx: number;
  my: number;
  by: number;
}

interface SproutsState {
  turn: number;
  over: boolean;
  sel: number;
  dots: SproutsDot[];
  edges: SproutsEdge[];
}

export const Sprouts: React.FC<SproutsProps> = ({ mode, names, onFinish, dots: dotsProp, net }) => {
  const startDots = Math.max(3, Math.min(20, dotsProp || 3));
  const [state, setState] = useState<SproutsState>(() => ({
    turn: 0,
    over: false,
    sel: -1,
    dots: sproutsStartDots(startDots),
    edges: []
  }));
  const [errorMsg, setErrorMsg] = useState('');

  const cur = state.turn % names.length;
  const isMine = net ? cur === net.mySeat : mode === 'pvc' ? cur === 0 : true;

  // --- net sync -----------------------------------------------------------
  // Full local state as one plain JSON object: dots (positions + per-dot
  // line counts via deg), curves (edges), turn and over always top-level.
  // sel rides along (it is -1 in every pushed state — pushes happen only
  // after a move — and remote apply forces it to -1, so a transient
  // selection highlight never leaks to the other phone).
  const serializeState = (s: SproutsState): SproutsState => ({
    turn: s.turn,
    over: s.over,
    sel: s.sel,
    dots: s.dots.map(d => ({ x: d.x, y: d.y, deg: d.deg })),
    edges: s.edges.map(e => ({ a: e.a, b: e.b, mx: e.mx, my: e.my, by: e.by }))
  });
  const serialize = (): SproutsState => serializeState(state);
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it.
  // The opening state carries the starting dots (sproutsStartDots of the
  // dots prop), so both phones start from the host's layout.
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push(serialize());
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's move when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as Partial<SproutsState>;
    setState(prev => ({
      turn: typeof s.turn === 'number' ? s.turn : prev.turn,
      over: typeof s.over === 'boolean' ? s.over : prev.over,
      sel: -1,
      dots: Array.isArray(s.dots)
        ? s.dots.map(d => ({ x: d.x, y: d.y, deg: d.deg }))
        : prev.dots,
      edges: Array.isArray(s.edges)
        ? s.edges.map(e => ({ a: e.a, b: e.b, mx: e.mx, my: e.my, by: e.by }))
        : prev.edges
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  // The player to move with no legal move left loses, so the winner is the
  // other seat — both phones compute the same result from the shared state.
  useEffect(() => {
    if (!state.over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      // The player to move with no legal move left loses, so the winner is
      // the player who made the last move. With 2 players that is the
      // other seat, exactly as before; with 3-4 it is the previous seat in
      // rotation.
      const winner = (state.turn - 1 + names.length) % names.length;
      onFinish({
        winner,
        title: `${names[winner]} wins!`,
        body: (
          <div className="msg">
            {names[state.turn % names.length]} has no legal move left.
          </div>
        )
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.over]);

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
    const found = sproutsLegal(state).find(
      ([x, y]) => x === Math.min(a, b) && y === Math.max(a, b)
    );

    if (!found) {
      Sound.beep(300, 0.1, 'square');
      setErrorMsg('That move is not legal (dot full or line would cross).');
      setState(prev => ({ ...prev, sel: -1 }));
      return;
    }
    const mid = found[2];

    Sound.click();
    const next = JSON.parse(JSON.stringify(state));
    next.sel = -1;
    sproutsApply(next, Math.min(a, b), Math.max(a, b), mid, names.length);
    // No legal move left for the next player: the game is over. Mark it on
    // the shared state so the finish fires from state on both phones.
    if (sproutsLegal(next).length === 0) next.over = true;
    setState(next);
    if (net) net.push(serializeState(next));
    if (next.over) return;

    if (mode === 'pvc' && next.turn % 2 === 1) {
      setTimeout(() => {
        setState(prev => {
          if (prev.over || prev.turn % 2 !== 1) return prev;
          const moves = sproutsLegal(prev);
          if (!moves.length) return { ...prev, over: true };
          const [botA, botB, botMid] = pickA(moves);
          const botNext = JSON.parse(JSON.stringify(prev));
          botNext.sel = -1;
          sproutsApply(botNext, botA, botB, botMid, names.length);
          Sound.click();
          if (sproutsLegal(botNext).length === 0) botNext.over = true;
          return botNext;
        });
      }, 600);
    }
  };

  if (net && !net.remote && net.mySeat !== 0) {
    return (
      <div>
        <div className="turn-banner">⏳ Waiting for {names[0]} to start…</div>
        <PaperPanel>
          <p className="muted text-center text-sm py-6">
            The host is setting up the dots. Your moves will appear here.
          </p>
        </PaperPanel>
      </div>
    );
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
        <div className="text-center mb-1">
          <span className="chip">🌱 {startDots} starting dots</span>
        </div>
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
                stroke={['#2470c9', '#c0392b', '#1e8e4e', '#8e44ad'][e.by % 4] || '#2470c9'}
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
