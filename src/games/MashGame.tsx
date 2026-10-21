import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { MASH_CATS } from '../data/words';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface MashGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const MashGame: React.FC<MashGameProps> = ({ names, onFinish }) => {
  const [magic, setMagic] = useState<number>(5);
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const cat in MASH_CATS) {
      init[cat] = MASH_CATS[cat].join(', ');
    }
    return init;
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleTellFortune = () => {
    setErrorMsg('');
    const parsed: Record<string, string[]> = {};
    for (const cat in inputs) {
      const opts = inputs[cat]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (opts.length < 2) {
        setErrorMsg(`Give at least 2 options for ${cat}.`);
        return;
      }
      parsed[cat] = opts;
    }

    Sound.win();
    const result = Logic.mashEliminate(parsed, magic);

    setTimeout(() => {
      onFinish({
        winner: 0,
        title: '🔮 Your fortune is sealed…',
        result: 'w',
        body: (
          <div className="paper my-3 text-base leading-relaxed">
            You will live in a <b>{result.Home}</b> in <b>{result.City}</b>, married
            to <b>{result.Partner}</b>. You will work as a <b>{result.Job}</b>, drive a{' '}
            <b>{result.Car}</b>, and have <b>{result.Kids}</b> kid(s). The notebook
            has spoken! 📓✨
          </div>
        )
      });
    }, 500);
  };

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-lg mb-1">🔮 Write your options</h3>
        <p className="muted text-xs mb-3">
          Four options per category, separated by commas. The first letters of Home
          spell M-A-S-H: Mansion, Apartment, Shack, House.
        </p>

        {Object.keys(MASH_CATS).map(cat => (
          <div key={cat} className="mb-2">
            <label className="text-xs font-bold text-[#17457e] block">{cat}</label>
            <input
              value={inputs[cat] || ''}
              onChange={e =>
                setInputs(prev => ({ ...prev, [cat]: e.target.value }))
              }
              className="w-full bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-1.5 text-sm"
            />
          </div>
        ))}

        <div className="my-3">
          <label className="text-xs font-bold text-[#17457e] block mb-1">
            Magic number (3–10)
          </label>
          <select
            value={magic}
            onChange={e => setMagic(Number(e.target.value))}
            className="w-full bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm font-bold"
          >
            {Array.from({ length: 8 }, (_, i) => i + 3).map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {errorMsg && <div className="err text-xs mb-2">{errorMsg}</div>}

        <button onClick={handleTellFortune} className="btn">
          🔮 Tell my fortune
        </button>
      </PaperPanel>
    </div>
  );
};
