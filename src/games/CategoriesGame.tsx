import React, { useState, useEffect } from 'react';
import { GameMode, FinishResult } from '../types';
import { CAT_CATS } from '../data/words';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface CategoriesGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const CategoriesGame: React.FC<CategoriesGameProps> = ({ mode, names, onFinish }) => {
  const [letter] = useState(() => pickA('ABCDEFGHIJKLMNOPRSTW'.split('')));
  const [timeLeft, setTimeLeft] = useState(60);
  const [cards, setCards] = useState<Record<string, Record<string, string>>>({});
  const [currentInputs, setCurrentInputs] = useState<Record<string, string>>({
    Name: '',
    Place: '',
    Animal: '',
    Thing: '',
    Food: ''
  });
  const [phase, setPhase] = useState<'fill' | 'cover' | 'done'>('fill');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (phase !== 'fill') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, currentInputs]);

  const handleInputChange = (cat: string, val: string) => {
    setCurrentInputs(prev => ({ ...prev, [cat]: val }));
  };

  const handleDone = () => {
    Sound.click();
    if (mode === 'pvc') {
      const myCard = { ...currentInputs };
      const botCard = Logic.catBotCard(letter);
      finishGame(myCard, botCard, names[0], names[1]);
    } else {
      if (!cards.p1) {
        setCards({ p1: { ...currentInputs } });
        setCurrentInputs({ Name: '', Place: '', Animal: '', Thing: '', Food: '' });
        setTimeLeft(60);
        setPhase('cover');
      } else {
        const p2Card = { ...currentInputs };
        finishGame(cards.p1, p2Card, names[0], names[1]);
      }
    }
  };

  const finishGame = (
    cardA: Record<string, string>,
    cardB: Record<string, string>,
    nameA: string,
    nameB: string
  ) => {
    const scA = Logic.catScore(cardA, cardB, letter);
    const scB = Logic.catScore(cardB, cardA, letter);
    const res = {
      scA,
      scB,
      nameA,
      nameB
    };
    setResults(res);
    setPhase('done');

    setTimeout(() => {
      const winner =
        scA.total === scB.total ? -1 : scA.total > scB.total ? 0 : 1;
      onFinish({
        winner,
        title:
          scA.total === scB.total
            ? 'Tied cards!'
            : `${winner === 0 ? nameA : nameB} wins the round!`,
        body: (
          <div className="paper my-2">
            <h3 className="font-bold text-[#17457e] mb-2">
              Letter {letter} — Score Card
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#9db9dc]">
                  <th className="text-left py-1">Category</th>
                  <th className="text-left py-1">{nameA}</th>
                  <th className="text-left py-1">Pts</th>
                  <th className="text-left py-1">{nameB}</th>
                </tr>
              </thead>
              <tbody>
                {CAT_CATS.map(cat => {
                  const da = scA.detail[cat];
                  return (
                    <tr key={cat} className="border-b border-[#bcd6f7]/50">
                      <td className="py-1 font-semibold">{cat}</td>
                      <td className="py-1">
                        {da.ans || <i>blank</i>}
                        {!da.valid && <span className="text-red-500 ml-1">✗</span>}
                      </td>
                      <td className="py-1 font-bold">{da.pts}</td>
                      <td className="py-1">{da.bot || <i>blank</i>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 font-bold text-sm">
              Totals — {nameA}: {scA.total} pts · {nameB}: {scB.total} pts
            </p>
          </div>
        )
      });
    }, 800);
  };

  if (phase === 'cover') {
    return (
      <div className="card text-center my-8 p-6">
        <div className="text-6xl mb-3">🙈</div>
        <h2 className="text-xl font-bold mb-2">Pass to {names[1]}</h2>
        <div className="text-[var(--muted)] text-sm mb-4">
          No peeking, {names[0]}!
        </div>
        <button
          onClick={() => setPhase('fill')}
          className="btn"
        >
          I'm {names[1]} — ready
        </button>
      </div>
    );
  }

  return (
    <div>
      <PaperPanel>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">
            Letter: <span className="text-2xl font-black text-[#17457e]">{letter}</span>
          </h3>
          <div className="font-bold text-[#17457e] bg-blue-100 px-3 py-1 rounded-full text-sm">
            ⏱️ {timeLeft}s left
          </div>
        </div>

        <p className="muted text-xs mb-3">
          {mode === 'hotseat'
            ? `${cards.p1 ? names[1] : names[0]}, fill your card`
            : 'Fill your card'}{' '}
          — every answer must start with <b>{letter}</b>.
        </p>

        {CAT_CATS.map(cat => (
          <div key={cat} className="mb-2">
            <label className="text-xs font-bold text-[#17457e] block">{cat}</label>
            <input
              value={currentInputs[cat] || ''}
              onChange={e => handleInputChange(cat, e.target.value)}
              placeholder={`${cat} starting with ${letter}…`}
              autoComplete="off"
              className="w-full bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-1.5 text-sm font-medium"
            />
          </div>
        ))}

        <button onClick={handleDone} className="btn mt-3">
          Done ✔
        </button>
      </PaperPanel>
    </div>
  );
};
