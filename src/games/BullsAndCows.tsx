import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface BullsAndCowsProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const BullsAndCows: React.FC<BullsAndCowsProps> = ({ mode, names, onFinish }) => {
  const [secret] = useState(() => Logic.bullsSecret());
  const [guesses, setGuesses] = useState<Array<{ g: string; bulls: number; cows: number }>>([]);
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGuess = () => {
    const val = inputVal.trim();
    if (!Logic.bullsValid(val)) {
      setErrorMsg('Enter 4 digits, all different (e.g. 3057).');
      return;
    }
    setErrorMsg('');
    Sound.click();
    const res = Logic.bullsCows(secret, val);
    const nextGuesses = [...guesses, { g: val, bulls: res.bulls, cows: res.cows }];
    setGuesses(nextGuesses);
    setInputVal('');

    if (res.bulls === 4) {
      setTimeout(() => {
        onFinish({
          winner: 0,
          title: 'Code Cracked!',
          body: (
            <div className="msg">
              Code cracked: <b>{secret}</b> in {nextGuesses.length} guesses!
            </div>
          )
        });
      }, 350);
      return;
    }

    if (nextGuesses.length >= 10) {
      setTimeout(() => {
        onFinish({
          winner: mode === 'pvc' ? 1 : 0,
          title: 'Out of guesses!',
          body: (
            <div className="msg">
              The secret code was <b>{secret}</b>.
            </div>
          )
        });
      }, 350);
    }
  };

  return (
    <div>
      <PaperPanel>
        <h3 className="text-[#17457e] font-bold text-lg mb-1">🔢 Crack the code</h3>
        <p className="text-sm mb-3">
          Guesses left: <b>{10 - guesses.length}</b> · Secret: <b>••••</b> (4
          different digits)
        </p>

        {guesses.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-[#9db9dc]">
                <th className="text-left py-1">#</th>
                <th className="text-left py-1">Guess</th>
                <th className="text-left py-1">🐂 Bulls</th>
                <th className="text-left py-1">🐄 Cows</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((g, i) => (
                <tr key={i} className="border-b border-[#bcd6f7]/50">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1 font-mono font-bold">{g.g}</td>
                  <td className="py-1">{g.bulls}</td>
                  <td className="py-1">{g.cows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted text-xs mb-3">
            No guesses yet. Example: guess 1234 — a bull means a digit is in the
            exact right spot; a cow means it's in the secret but in the wrong spot.
          </p>
        )}

        <div className="flex gap-2 items-center">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGuess()}
            inputMode="numeric"
            maxLength={4}
            placeholder="4 different digits"
            className="flex-1 bg-white/70 border border-[#9db9dc] text-[#22304a] rounded-xl px-3 py-2 text-base font-mono font-bold"
          />
          <button onClick={handleGuess} className="btn small !m-0">
            Guess
          </button>
        </div>
        {errorMsg && <div className="err text-xs mt-2">{errorMsg}</div>}
      </PaperPanel>
    </div>
  );
};
