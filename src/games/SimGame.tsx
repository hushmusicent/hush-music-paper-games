import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
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
  // Live-room sync — present only in online mode. Follows the TicTacToe
  // reference pattern: serialize the full local state after every move,
  // apply remote state when it arrives, gate turns by mySeat.
  net?: NetGameProp;
}

const SHAPE_LABEL: Record<SimShape, string> = {
  ring: 'Ring',
  grid: 'Grid',
  scatter: 'Scatter'
};

interface SimState {
  edges: Record<string, number>;
  turn: number;
  over: boolean;
  dots: number;
  shape: SimShape;
}

const VALID_SHAPES: SimShape[] = ['ring', 'grid', 'scatter'];

export const SimGame: React.FC<SimGameProps> = ({ mode, names, onFinish, dots, shape, net }) => {
  // Dots/shape live in state (not props-derived consts) so the host's
  // opening push can set the guest's board: the guest's own dots/shape
  // props come from their saved option-screen choice, which may differ
  // from the host's. In pvc/hotseat they never change mid-game.
  const [count, setCount] = useState<number>(() => Math.max(6, Math.min(10, dots || 6)));
  const [boardShape, setBoardShape] = useState<SimShape>(() => shape || 'ring');
  const POS = simPositions(count, boardShape);
  const totalPairs = (count * (count - 1)) / 2;
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);
  const [sel, setSel] = useState<number>(-1);
  const [edges, setEdges] = useState<Record<string, number>>({});

  const cur = turn % names.length;
  const isMine = net ? cur === net.mySeat : mode === 'pvc' ? cur === 0 : true;

  // One color per seat, in seat order: blue, red, green, purple.
  const SEAT_COLORS = ['#2470c9', '#c0392b', '#1e8e4e', '#8e44ad'];
  const SEAT_COLOR_NAMES = ['blue', 'red', 'green', 'purple'];

  // --- net sync -----------------------------------------------------------
  const serialize = (): SimState => ({ edges, turn, over, dots: count, shape: boardShape });
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it.
  // The opening state carries the host's dots count and shape so both
  // phones play the same board.
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push({ edges: {}, turn: 0, over: false, dots: count, shape: boardShape });
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's move when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as SimState;
    if (s.edges && typeof s.edges === 'object') setEdges({ ...s.edges });
    if (typeof s.turn === 'number') setTurn(s.turn);
    if (typeof s.over === 'boolean') setOver(s.over);
    if (typeof s.dots === 'number') setCount(Math.max(6, Math.min(10, s.dots)));
    if (typeof s.shape === 'string' && (VALID_SHAPES as string[]).includes(s.shape)) {
      setBoardShape(s.shape);
    }
    // A line drawn on the other phone invalidates any dot we had selected.
    setSel(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  // Both phones compute the same result from the shared state: whoever
  // completed a triangle in their own color loses; a full board means the
  // player with no move left loses, so the last mover wins.
  useEffect(() => {
    if (!over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      let loser = -1;
      let tri: [number, number, number] | null = null;
      // Every seat draws in its own color now, so check each seat's edges
      // for a triangle — not just seats 0/1.
      for (let seat = 0; seat < names.length; seat++) {
        const mineEdges = Object.keys(edges).filter(k => edges[k] === seat);
        const found = Logic.simHasTriangle(mineEdges);
        if (found) {
          loser = seat;
          tri = found;
          break;
        }
      }
      if (loser >= 0 && tri) {
        // The player who completed a triangle in their own color loses;
        // the next seat in rotation wins. With 2 players that is the
        // other player, exactly as before.
        const winner = (loser + 1) % names.length;
        onFinish({
          winner,
          title: `${names[winner]} wins!`,
          body: (
            <div className="msg">
              {names[loser]} completed a triangle in their own color (
              {tri.map(x => x + 1).join('-')}) and loses!
            </div>
          )
        });
      } else {
        const lastSeat = (turn - 1 + names.length) % names.length;
        onFinish({
          winner: lastSeat,
          title: `${names[lastSeat]} wins!`,
          body: (
            <div className="msg">
              The board is full — {names[(lastSeat + 1) % names.length]} has no move and loses.
            </div>
          )
        });
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  // Pure end check: only flips `over`. The finish effect above reports it.
  const evaluateEnd = (currentEdges: Record<string, number>, lastSeat: number): boolean => {
    const mineEdges = Object.keys(currentEdges).filter(
      k => currentEdges[k] === lastSeat
    );
    if (Logic.simHasTriangle(mineEdges)) {
      setOver(true);
      return true;
    }

    const freeCount = totalPairs - Object.keys(currentEdges).length;
    if (freeCount === 0) {
      setOver(true);
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
    const nextTurn = turn + 1;
    const ended = evaluateEnd(nextEdges, seat);
    setEdges(nextEdges);
    setTurn(nextTurn);
    if (net) {
      net.push({ edges: nextEdges, turn: nextTurn, over: ended, dots: count, shape: boardShape });
    }
    if (ended) return;

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
          evaluateEnd(botNext, 1);
          return botNext;
        });
      }, 600);
    }
  };

  if (net && !net.remote && net.mySeat !== 0) {
    return (
      <div>
        <div className="turn-banner">⏳ Waiting for host…</div>
        <PaperPanel>
          <p className="muted text-center text-sm py-6">
            {names[0]} is setting up the board. Your moves will appear here.
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
                stroke={SEAT_COLORS[p % SEAT_COLORS.length]}
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
          <b style={{ color: SEAT_COLORS[cur % SEAT_COLORS.length] }}>
            {SEAT_COLOR_NAMES[cur % SEAT_COLOR_NAMES.length]}
          </b>
          . Tap two dots to connect them. Complete a triangle in YOUR color and you
          lose!
        </p>
      </PaperPanel>
    </div>
  );
};
