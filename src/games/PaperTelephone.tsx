import React, { useState, useRef, useEffect } from 'react';
import { GameMode, FinishResult } from '../types';
import { TEL_PHRASES, PIC_WORDS, PIC_DRAW } from '../data/words';
import { pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface PaperTelephoneProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

interface ChainItem {
  type: 'phrase' | 'draw';
  by: string;
  text?: string;
  img?: string;
  word?: string;
}

// The chain always runs: phrase → draw → guess → draw → final guess.
// Seats: the two players alternate jobs; in PvC seat 1 is the computer.
const PLAN: Array<{ type: 'phrase' | 'draw'; seat: 0 | 1 }> = [
  { type: 'phrase', seat: 0 },
  { type: 'draw', seat: 1 },
  { type: 'phrase', seat: 0 },
  { type: 'draw', seat: 0 },
  { type: 'phrase', seat: 1 }
];

function telDrawFor(text?: string): string {
  const up = String(text || '').toUpperCase();
  for (const w of PIC_WORDS) {
    if (up.includes(w) && PIC_DRAW[w]) return w;
  }
  if (up.includes('DOG') || up.includes('PUPPY')) return 'CAT';
  if (up.includes('RAINBOW')) return 'SUN';
  return pickA(PIC_WORDS.filter(w => PIC_DRAW[w]));
}

// The computer's guess at a drawing: a plausible misread. It prefers a
// phrase about the same subject the chain was drawing two steps ago, and
// never repeats a phrase already in the chain.
function telGuessFor(chain: ChainItem[]): string {
  const used = new Set(
    chain.filter(c => c.type === 'phrase').map(c => (c.text || '').toLowerCase())
  );
  const fresh = TEL_PHRASES.filter(p => !used.has(p.toLowerCase()));
  const pool = fresh.length ? fresh : TEL_PHRASES;
  const drawnPhrase = chain.length >= 2 ? chain[chain.length - 2] : undefined;
  if (drawnPhrase?.text) {
    const up = drawnPhrase.text.toUpperCase();
    const subject = PIC_WORDS.find(w => up.includes(w));
    if (subject) {
      const kin = pool.filter(p => p.toUpperCase().includes(subject));
      if (kin.length) return pickA(kin);
    }
  }
  return pickA(pool);
}

function drawStrokesOn(
  ctx: CanvasRenderingContext2D,
  strokes: [number, number][][],
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#22304a';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const flat: Array<{ p: [number, number]; br: boolean }> = [];
  strokes.forEach(st => {
    st.forEach((p, i) => flat.push({ p, br: i === 0 }));
  });

  ctx.beginPath();
  let pen = false;
  for (let i = 0; i < flat.length; i++) {
    const { p, br } = flat[i];
    const x = (p[0] / 100) * w;
    const y = (p[1] / 100) * h;
    if (br || !pen) {
      ctx.moveTo(x, y);
      pen = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function botDoodleDataUrl(phraseText?: string): { img: string; word: string } {
  const word = telDrawFor(phraseText);
  const cv = document.createElement('canvas');
  cv.width = 340;
  cv.height = 240;
  const ctx = cv.getContext('2d');
  if (ctx && PIC_DRAW[word]) {
    drawStrokesOn(ctx, PIC_DRAW[word], 340, 240);
  }
  return { img: cv.toDataURL(), word };
}

export const PaperTelephone: React.FC<PaperTelephoneProps> = ({ mode, names, onFinish }) => {
  const [chain, setChain] = useState<ChainItem[]>([]);
  // The step number is DERIVED from the chain, never stored: every finished
  // step appends exactly one item, so chain.length IS the current step.
  // (Storing it in state let a stale timer closure resurrect an old step —
  // the bot redrew its own step forever and the game stuck on "drawing…".)
  const stepIdx = chain.length;
  const [screen, setScreen] = useState<'cover' | 'input' | 'bot' | 'reveal'>('input');
  const [textInput, setTextInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<[number, number][][]>([]);
  const drawingRef = useRef<boolean>(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = PLAN[Math.min(stepIdx, PLAN.length - 1)];
  const actorName = names[step.seat] || (step.seat === 1 ? 'Computer 🤖' : 'Player 1');
  const lastItem = chain[chain.length - 1];

  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  // Fresh pad for every draw step.
  useEffect(() => {
    if (screen === 'input' && step.type === 'draw') {
      strokesRef.current = [];
      drawingRef.current = false;
      paintPad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, stepIdx]);

  const paintPad = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    drawStrokesOn(ctx, strokesRef.current, cv.width, cv.height);
  };

  const runBotStep = (
    botStep: { type: 'phrase' | 'draw'; seat: 0 | 1 },
    currentChain: ChainItem[]
  ) => {
    const prev = currentChain[currentChain.length - 1];
    let item: ChainItem;
    if (botStep.type === 'draw') {
      const { img, word } = botDoodleDataUrl(prev?.text);
      item = { type: 'draw', by: actorNameFor(botStep.seat), img, word };
    } else {
      item = { type: 'phrase', by: actorNameFor(botStep.seat), text: telGuessFor(currentChain) };
    }
    Sound.click();
    advanceFrom(currentChain, item);
  };

  const actorNameFor = (seat: 0 | 1) =>
    names[seat] || (seat === 1 ? 'Computer 🤖' : 'Player 1');

  // Append one finished item and move the game on. Used by both the human
  // handlers and the bot so the turn order lives in exactly one place.
  const advanceFrom = (baseChain: ChainItem[], item: ChainItem) => {
    const nextChain = [...baseChain, item];
    setChain(nextChain);
    setTextInput('');
    setErrorMsg('');
    const next = nextChain.length;
    if (next >= PLAN.length) {
      // The reveal is the payoff — it stays up until the player taps
      // Finish. (It used to auto-jump to the result screen after 0.7s,
      // far too fast to read the chain.)
      setScreen('reveal');
      Sound.win();
      return;
    }
    const nextStep = PLAN[next];
    if (mode === 'pvc' && nextStep.seat === 1) {
      setScreen('bot');
      botTimerRef.current = setTimeout(() => runBotStep(nextStep, nextChain), 2000);
    } else if (mode !== 'pvc' && nextStep.seat !== PLAN[nextChain.length - 1].seat) {
      // Pass-and-play: only show the pass screen when the phone actually
      // changes hands — drawing your own guess keeps the phone with you.
      setScreen('cover');
    } else {
      setScreen('input');
    }
  };

  const finishGame = () => {
    Sound.click();
    onFinish({
      winner: 0,
      title: '📞 Chain complete!',
      result: 'w',
      body: (
        <div className="paper my-2">
          <p>
            The full chain is on the board — start phrase vs last guess.
            That is the game: it ALWAYS mutates! 😂
          </p>
        </div>
      )
    });
  };

  const handleTextSubmit = () => {
    const t = textInput.trim();
    if (stepIdx === 0) {
      if (t.length < 3) {
        setErrorMsg('Write a phrase first (3+ characters)!');
        return;
      }
    } else if (t.length < 2) {
      setErrorMsg('Make a guess!');
      return;
    }
    Sound.click();
    advanceFrom(chain, { type: 'phrase', by: actorName, text: t });
  };

  /* --- drawing pad: strokes are kept as data (0-100 coordinates) and
         repainted from that data, so a re-render can never wipe a drawing.
         Pointer capture keeps the stroke alive when a finger slips off
         the pad mid-line. --- */
  const padPoint = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    return [
      Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))
    ];
  };

  const paintSegment = (from: [number, number], to: [number, number]) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#22304a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo((from[0] / 100) * cv.width, (from[1] / 100) * cv.height);
    ctx.lineTo((to[0] / 100) * cv.width, (to[1] / 100) * cv.height);
    ctx.stroke();
  };

  const paintDot = (p: [number, number]) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#22304a';
    ctx.beginPath();
    ctx.arc((p[0] / 100) * cv.width, (p[1] / 100) * cv.height, 1.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cv = canvasRef.current;
    if (!cv) return;
    try {
      cv.setPointerCapture(e.pointerId);
    } catch {
      /* older WebViews: capture is a bonus, drawing still works without it */
    }
    drawingRef.current = true;
    const p = padPoint(e);
    strokesRef.current.push([p]);
    paintDot(p);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    if (!stroke) return;
    const p = padPoint(e);
    const prev = stroke[stroke.length - 1];
    stroke.push(p);
    paintSegment(prev, p);
  };

  const endStroke = () => {
    drawingRef.current = false;
  };

  const handleClearCanvas = () => {
    strokesRef.current = [];
    paintPad();
  };

  const handleDrawDone = () => {
    const hasInk = strokesRef.current.some(s => s.length > 0);
    if (!hasInk) {
      setErrorMsg('Draw something first — the pad is blank!');
      return;
    }
    setErrorMsg('');
    Sound.click();
    const cv = document.createElement('canvas');
    cv.width = 340;
    cv.height = 240;
    const ctx = cv.getContext('2d');
    if (ctx) drawStrokesOn(ctx, strokesRef.current, 340, 240);
    advanceFrom(chain, { type: 'draw', by: actorName, img: cv.toDataURL() });
  };

  /* ---------------- screens ---------------- */

  if (screen === 'reveal') {
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-3">
          📞 The whole chain, start to finish!
        </h3>
        {chain.map((item, idx) => (
          <div key={idx} className="my-3 pb-3 border-b border-[#bcd6f7]/50">
            <div className="text-xs font-bold text-[#17457e] mb-1">
              {idx + 1}. {item.by} — {item.type === 'draw' ? 'drew' : 'wrote'}:
            </div>
            {item.type === 'draw' ? (
              <img
                src={item.img}
                alt={`Drawing ${idx + 1}`}
                className="w-full max-w-[340px] border-2 border-[#9db9dc] rounded-xl bg-white mx-auto block"
              />
            ) : (
              <div className="text-base font-medium italic">“{item.text}”</div>
            )}
          </div>
        ))}
        <p className="mt-3 text-sm">
          It started as “<b>{chain[0]?.text || ''}</b>” and ended as “
          <b>{chain[chain.length - 1]?.text || ''}</b>” 😂
        </p>
        <button onClick={finishGame} className="btn mt-4">
          Finish 🏁
        </button>
      </PaperPanel>
    );
  }

  if (screen === 'cover') {
    const prevName = chain[chain.length - 1]?.by || names[0];
    return (
      <div className="card text-center my-8 p-6">
        <div className="text-6xl mb-3">🙈</div>
        <h2 className="text-xl font-bold mb-2">Pass to {actorName}</h2>
        <div className="text-[var(--muted)] text-sm mb-4">
          No peeking, {prevName}! The paper stays folded.
        </div>
        <button onClick={() => { Sound.click(); setScreen('input'); }} className="btn">
          I'm {actorName} — ready
        </button>
      </div>
    );
  }

  if (screen === 'bot') {
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">
          {step.type === 'draw'
            ? `${actorName} is drawing… ✍️`
            : `${actorName} is guessing your drawing… 🤔`}
        </h3>
        <p className="muted text-sm">
          Peek if you like — in the real game this page stays folded!
        </p>
      </PaperPanel>
    );
  }

  if (step.type === 'draw') {
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">
          🎨 {actorName}, draw this: “{lastItem?.text}”
        </h3>
        <canvas
          ref={canvasRef}
          width={340}
          height={240}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          className="w-full max-w-[340px] aspect-[340/240] border-2 border-[#9db9dc] rounded-xl bg-white block mx-auto touch-none cursor-crosshair mb-3"
        />
        {errorMsg && <div className="err text-xs mb-2">{errorMsg}</div>}
        <div className="flex gap-2">
          <button onClick={handleClearCanvas} className="btn secondary small flex-1">
            Clear
          </button>
          <button onClick={handleDrawDone} className="btn small flex-1">
            Done drawing ✔
          </button>
        </div>
      </PaperPanel>
    );
  }

  // phrase step
  const isFirst = stepIdx === 0;
  return (
    <PaperPanel>
      <h3 className="font-bold text-lg mb-1">
        {isFirst
          ? `1️⃣ ${actorName}, write a starting phrase`
          : `🤔 ${actorName}, guess the drawing`}
      </h3>
      {isFirst ? (
        <p className="muted text-xs mb-3">
          Something drawable — like “a cat chasing a fish”. Or tap the dice for one.
        </p>
      ) : (
        lastItem?.img && (
          <img
            src={lastItem.img}
            alt="Drawing to guess"
            className="w-full max-w-[340px] border-2 border-[#9db9dc] rounded-xl bg-white mx-auto mb-3 block"
          />
        )
      )}

      <div className="flex gap-2 items-center mb-3">
        <input
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          placeholder={isFirst ? 'Your phrase…' : 'What is this drawing of?'}
          autoComplete="off"
          className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
        />
        {isFirst && (
          <button
            onClick={() => {
              Sound.click();
              setTextInput(pickA(TEL_PHRASES));
            }}
            className="btn secondary small !m-0"
          >
            🎲
          </button>
        )}
        <button onClick={handleTextSubmit} className="btn small !m-0">
          {isFirst ? 'Pass it on 📩' : 'Guess'}
        </button>
      </div>

      {errorMsg && <div className="err text-xs mb-2">{errorMsg}</div>}
    </PaperPanel>
  );
};
