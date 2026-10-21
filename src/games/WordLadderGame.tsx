import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { LADDER_PUZZLES, LADDER_WORDS } from '../data/words';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface WordLadderGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const WordLadderGame: React.FC<WordLadderGameProps> = ({ onFinish }) => {
  const [puzzle, setPuzzle] = useState(() => pickA(LADDER_PUZZLES));
  const [steps, setSteps] = useState<string[]>([puzzle.s]);
  const [hints, setHints] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleStep = (val: string) => {
    const w = val.trim().toUpperCase();
    const last = steps[steps.length - 1];
    setErrorMsg('');

    if (w.length !== last.length) {
      setErrorMsg(`Must be ${last.length} letters, same as ${last}.`);
      return;
    }
    if (!Logic.ladderOneLetter(last.toLowerCase(), w.toLowerCase())) {
      setErrorMsg(`Change EXACTLY one letter from ${last}.`);
      return;
    }
    if (!Logic.ladderValid(w)) {
      setErrorMsg(`"${w}" is not in the word list.`);
      return;
    }
    if (steps.includes(w)) {
      setErrorMsg(`You already used ${w}.`);
      return;
    }

    Sound.click();
    const nextSteps = [...steps, w];
    setSteps(nextSteps);
    setInputVal('');

    if (w === puzzle.t) {
      Sound.win();
      const n = nextSteps.length - 1;
      const par = puzzle.sol.length - 1;
      setTimeout(() => {
        onFinish({
          winner: 0,
          title: `Reached ${puzzle.t} in ${n} steps!`,
          body: (
            <div className="msg">
              Par was {par} steps{n <= par ? ' — par or better! 🏆' : '.'}
            </div>
          )
        });
      }, 400);
    }
  };

  const handleHint = () => {
    Sound.click();
    const sol = puzzle.sol;
    const cur = steps[steps.length - 1];
    const idx = sol.indexOf(cur);
    let next: string | null = null;

    if (idx >= 0 && idx < sol.length - 1) {
      next = sol[idx + 1];
    } else {
      const cand = LADDER_WORDS.map(w => w.toUpperCase()).filter(
        w =>
          w.length === cur.length &&
          Logic.ladderOneLetter(cur.toLowerCase(), w.toLowerCase()) &&
          !steps.includes(w)
      );
      const closer = cand.filter(w => {
        let d0 = 0;
        let d1 = 0;
        for (let i = 0; i < w.length; i++) {
          if (cur[i] !== puzzle.t[i]) d0++;
          if (w[i] !== puzzle.t[i]) d1++;
        }
        return d1 < d0;
      });
      next = closer[0] || cand[0];
    }

    if (next) {
      setHints(h => h + 1);
      handleStep(next);
    } else {
      setErrorMsg('No hint found from here — try stepping back with a new puzzle.');
    }
  };

  const handleNewPuzzle = () => {
    Sound.click();
    const pz = pickA(LADDER_PUZZLES);
    setPuzzle(pz);
    setSteps([pz.s]);
    setHints(0);
    setErrorMsg('');
    setInputVal('');
  };

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-lg mb-1">
          {puzzle.s} ➜ {puzzle.t}
        </h3>
        <p className="text-sm mb-3">
          Par: <b>{puzzle.sol.length - 1} steps</b> · Your steps:{' '}
          <b>{steps.length - 1}</b>
          {hints > 0 && ` · Hints used: ${hints}`}
        </p>

        <div className="my-3 flex flex-wrap items-center gap-1">
          {steps.map((w, i) => (
            <React.Fragment key={i}>
              <span
                className={`chip font-mono font-bold ${
                  i === steps.length - 1 ? '!bg-[#ffe9a8]' : ''
                }`}
              >
                {w}
              </span>
              {i < steps.length - 1 && <span className="text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-2 items-center mb-3">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleStep(inputVal)}
            placeholder="Next word — change ONE letter"
            autoComplete="off"
            className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm font-mono font-bold"
          />
          <button onClick={() => handleStep(inputVal)} className="btn small !m-0">
            Step
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <button onClick={handleHint} className="btn secondary small flex-1">
            💡 Hint (uses solution)
          </button>
          <button onClick={handleNewPuzzle} className="btn secondary small flex-1">
            🎲 New puzzle
          </button>
        </div>

        {errorMsg && <div className="err text-xs mt-1">{errorMsg}</div>}
      </PaperPanel>
    </div>
  );
};
