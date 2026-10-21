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

function telDrawFor(text?: string): string {
  const up = String(text || '').toUpperCase();
  for (const w of PIC_WORDS) {
    if (up.includes(w)) return w;
  }
  if (up.includes('DOG') || up.includes('PUPPY')) return 'CAT';
  if (up.includes('RAINBOW')) return 'SUN';
  return pickA(PIC_WORDS);
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

export const PaperTelephone: React.FC<PaperTelephoneProps> = ({ names, onFinish }) => {
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [phase, setPhase] = useState<'write' | 'botdraw' | 'guess' | 'drawGuess' | 'botguess' | 'reveal'>('write');
  const [phraseInput, setPhraseInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  useEffect(() => {
    if (phase === 'drawGuess' && canvasRef.current) {
      const cv = canvasRef.current;
      const ctx = cv.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = '#22304a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [phase]);

  const handleStartPhrase = () => {
    const t = phraseInput.trim();
    if (t.length < 3) {
      setErrorMsg('Write a phrase first (3+ characters)!');
      return;
    }
    setErrorMsg('');
    Sound.click();

    const nextChain: ChainItem[] = [{ type: 'phrase', by: names[0], text: t }];
    setChain(nextChain);
    setPhase('botdraw');

    // Bot draws
    setTimeout(() => {
      const word = telDrawFor(t);
      const cv = document.createElement('canvas');
      cv.width = 340;
      cv.height = 240;
      const ctx = cv.getContext('2d');
      if (ctx && PIC_DRAW[word]) {
        drawStrokesOn(ctx, PIC_DRAW[word], 340, 240);
      }
      const img = cv.toDataURL();
      setChain(prev => [
        ...prev,
        { type: 'draw', by: 'Computer 🤖', img, word }
      ]);
      setPhase('guess');
      Sound.click();
    }, 1000);
  };

  const handleGuessSubmit = () => {
    const t = guessInput.trim();
    if (t.length < 2) {
      setErrorMsg('Make a guess!');
      return;
    }
    setErrorMsg('');
    Sound.click();

    const nextChain: ChainItem[] = [
      ...chain,
      { type: 'phrase', by: names[0], text: t }
    ];
    setChain(nextChain);
    setPhase('drawGuess');
  };

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * cv.width) / r.width,
      y: ((e.clientY - r.top) * cv.height) / r.height
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
  };

  const handleDrawDone = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    Sound.click();
    const img = cv.toDataURL();
    const nextChain: ChainItem[] = [
      ...chain,
      { type: 'draw', by: names[0], img }
    ];
    setChain(nextChain);
    setPhase('botguess');

    // Bot guesses
    setTimeout(() => {
      const phraseGuess = pickA(TEL_PHRASES);
      const finalChain: ChainItem[] = [
        ...nextChain,
        { type: 'phrase', by: 'Computer 🤖', text: phraseGuess }
      ];
      setChain(finalChain);
      setPhase('reveal');
      Sound.win();

      setTimeout(() => {
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
      }, 700);
    }, 1000);
  };

  if (phase === 'reveal') {
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
      </PaperPanel>
    );
  }

  if (phase === 'botdraw') {
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">
          2️⃣ The computer is drawing… ✍️
        </h3>
        <p className="muted text-sm">
          Peek if you like — in the real game this page stays folded!
        </p>
      </PaperPanel>
    );
  }

  if (phase === 'guess') {
    const last = chain[chain.length - 1];
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">🤔 Guess the drawing</h3>
        {last?.img && (
          <img
            src={last.img}
            alt="Drawing to guess"
            className="w-full max-w-[340px] border-2 border-[#9db9dc] rounded-xl bg-white mx-auto mb-3 block"
          />
        )}
        <div className="flex gap-2 items-center">
          <input
            value={guessInput}
            onChange={e => setGuessInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGuessSubmit()}
            placeholder="What is this drawing of?"
            className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
          />
          <button onClick={handleGuessSubmit} className="btn small !m-0">
            Guess
          </button>
        </div>
        {errorMsg && <div className="err text-xs mt-2">{errorMsg}</div>}
      </PaperPanel>
    );
  }

  if (phase === 'drawGuess') {
    const lastPhrase = chain[chain.length - 1];
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">
          🎨 Draw this guess: “{lastPhrase?.text}”
        </h3>
        <canvas
          ref={canvasRef}
          width={340}
          height={240}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full max-w-[340px] h-[240px] border-2 border-[#9db9dc] rounded-xl bg-white block mx-auto touch-none cursor-crosshair mb-3"
        />
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

  if (phase === 'botguess') {
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">
          The computer is guessing your drawing… 🤔
        </h3>
      </PaperPanel>
    );
  }

  return (
    <PaperPanel>
      <h3 className="font-bold text-lg mb-1">1️⃣ Write a starting phrase</h3>
      <p className="muted text-xs mb-3">
        Something drawable — like “a cat chasing a fish”. Or tap the dice for one.
      </p>

      <div className="flex gap-2 items-center mb-3">
        <input
          value={phraseInput}
          onChange={e => setPhraseInput(e.target.value)}
          placeholder="Your phrase…"
          autoComplete="off"
          className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
        />
        <button
          onClick={() => {
            Sound.click();
            setPhraseInput(pickA(TEL_PHRASES));
          }}
          className="btn secondary small !m-0"
        >
          🎲
        </button>
      </div>

      {errorMsg && <div className="err text-xs mb-2">{errorMsg}</div>}

      <button onClick={handleStartPhrase} className="btn">
        Pass it on 📩
      </button>
    </PaperPanel>
  );
};
