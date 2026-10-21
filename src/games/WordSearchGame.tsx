import React, { useState, useEffect } from 'react';
import { GameMode, FinishResult } from '../types';
import { WS_WORDS } from '../data/words';
import { Logic, shuffle } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface WordSearchGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({ onFinish }) => {
  const [data] = useState(() => {
    let gen = null;
    let tries = 0;
    while (!gen && tries++ < 15) {
      gen = Logic.wsGenerate(shuffle(WS_WORDS).slice(0, 8), 10);
    }
    return gen || { grid: [], placements: {} };
  });

  const [found, setFound] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (over) return;
    const timer = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [over]);

  const handleCellClick = (r: number, c: number) => {
    if (over) return;
    setErrorMsg('');

    if (!sel) {
      Sound.click();
      setSel([r, c]);
      return;
    }

    const [r1, c1] = sel;
    const dr = Math.sign(r - r1);
    const dc = Math.sign(c - c1);
    const len = Math.max(Math.abs(r - r1), Math.abs(c - c1)) + 1;
    const straight =
      (r === r1 || c === c1 || Math.abs(r - r1) === Math.abs(c - c1)) && len >= 3;

    if (straight) {
      const cells: [number, number][] = [];
      for (let i = 0; i < len; i++) {
        cells.push([r1 + dr * i, c1 + dc * i]);
      }
      const word = Logic.wsWordAt(data.grid, cells);
      const rev = word.split('').reverse().join('');
      const hit = [word, rev].find(
        w => data.placements[w] && !found.includes(w)
      );

      if (hit) {
        Sound.win();
        const nextFound = [...found, hit];
        const nextFoundCells = { ...foundCells };
        data.placements[hit].forEach(([rr, cc]) => {
          nextFoundCells[`${rr},${cc}`] = true;
        });
        setFound(nextFound);
        setFoundCells(nextFoundCells);
        setSel(null);

        if (nextFound.length >= Object.keys(data.placements).length) {
          setOver(true);
          setTimeout(() => {
            onFinish({
              winner: 0,
              title: 'All words found! 🔎🎉',
              body: (
                <div className="msg">
                  Found all {nextFound.length} words in {elapsed} seconds!
                </div>
              )
            });
          }, 400);
        }
        return;
      }
    }

    Sound.beep(300, 0.08, 'square');
    setSel(null);
    setErrorMsg('Not a hidden word — try again.');
  };

  const wordsList = Object.keys(data.placements);

  return (
    <div>
      <PaperPanel>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[#17457e]">
            Find all {wordsList.length} words
          </h3>
          <div className="font-bold text-[#17457e] bg-blue-100 px-3 py-1 rounded-full text-sm">
            ⏱️ {elapsed}s
          </div>
        </div>

        {errorMsg && <div className="err text-xs text-center">{errorMsg}</div>}

        <div className="wsgrid">
          {data.grid.map((row, r) =>
            row.split('').map((char, c) => {
              const key = `${r},${c}`;
              const isFound = foundCells[key];
              const isSelected = sel && sel[0] === r && sel[1] === c;
              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(r, c)}
                  className={`wscell ${isFound ? 'found' : ''} ${
                    isSelected ? 'sel' : ''
                  }`}
                >
                  {char}
                </div>
              );
            })
          )}
        </div>

        <div className="my-3 flex flex-wrap justify-center gap-1">
          {wordsList.map(w => (
            <span
              key={w}
              className={`chip ${found.includes(w) ? 'done' : ''}`}
            >
              {w}
            </span>
          ))}
        </div>

        <p className="muted text-xs text-center">
          {sel
            ? 'First letter picked — now tap the LAST letter of the word.'
            : 'Tap the first letter of a hidden word.'}
        </p>
      </PaperPanel>
    </div>
  );
};
