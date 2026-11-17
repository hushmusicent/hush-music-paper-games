import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface BullsAndCowsProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Live-room sync — present only in online mode. One shared secret (the
  // host's), one shared guesses list, alternating guesses: the host
  // publishes the opening state (with the secret) once, then each guess
  // is pushed as the full serialized state.
  net?: NetGameProp;
}

interface BullsState {
  secret: string;
  guesses: Array<{ g: string; bulls: number; cows: number }>;
  turn: number;
  over: boolean;
}

export const BullsAndCows: React.FC<BullsAndCowsProps> = ({ mode, names, onFinish, net }) => {
  const [secret, setSecret] = useState(() => Logic.bullsSecret());
  const [guesses, setGuesses] = useState<Array<{ g: string; bulls: number; cows: number }>>([]);
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cur = turn % names.length;
  // Online: players alternate guesses against the one shared secret.
  // PvC / hotseat: unchanged — whoever is at this device guesses the code.
  const isMine = net ? cur === net.mySeat : true;

  // --- net sync -----------------------------------------------------------
  const serialize = (): BullsState => ({ secret, guesses, turn, over });
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it.
  // The opening state carries the host's secret — the one shared secret
  // both players guess against.
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push({ secret, guesses: [], turn: 0, over: false });
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's move when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as BullsState;
    if (typeof s.secret === 'string') setSecret(s.secret);
    if (Array.isArray(s.guesses)) setGuesses([...s.guesses]);
    if (typeof s.turn === 'number') setTurn(s.turn);
    if (typeof s.over === 'boolean') setOver(s.over);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  // Both phones compute the same winner from the shared state: whoever
  // made the cracking guess wins; if the 10 shared guesses run out, the
  // original's rule stands (PvC: computer wins, otherwise seat 0).
  useEffect(() => {
    if (!over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      const last = guesses[guesses.length - 1];
      if (last && last.bulls === 4) {
        const winner = net ? (turn - 1 + names.length) % names.length : 0;
        onFinish({
          winner,
          title: 'Code Cracked!',
          body: (
            <div className="msg">
              Code cracked: <b>{secret}</b> in {guesses.length} guesses!
            </div>
          )
        });
      } else {
        onFinish({
          winner: mode === 'pvc' ? 1 : 0,
          title: 'Out of guesses!',
          body: (
            <div className="msg">
              The secret code was <b>{secret}</b>.
            </div>
          )
        });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const handleGuess = () => {
    if (over || (net && !isMine)) return;
    const val = inputVal.trim();
    if (!Logic.bullsValid(val)) {
      setErrorMsg('Enter 4 digits, all different (e.g. 3057).');
      return;
    }
    setErrorMsg('');
    Sound.click();
    const res = Logic.bullsCows(secret, val);
    const nextGuesses = [...guesses, { g: val, bulls: res.bulls, cows: res.cows }];
    const nextTurn = turn + 1;
    const ended = res.bulls === 4 || nextGuesses.length >= 10;
    setGuesses(nextGuesses);
    setInputVal('');
    setTurn(nextTurn);
    if (ended) setOver(true);
    if (net) net.push({ secret, guesses: nextGuesses, turn: nextTurn, over: ended });
  };

  if (net && !net.remote && net.mySeat !== 0) {
    return (
      <div>
        <div className="turn-banner">⏳ Waiting for host…</div>
        <PaperPanel>
          <p className="muted text-center text-sm py-6">
            The host is picking the secret code. Your guesses will appear here.
          </p>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div>
      {net && (
        <div className="turn-banner">
          {over
            ? 'Game Over'
            : isMine
            ? `🟢 Your move — ${names[cur]}`
            : `⏳ ${names[cur]} to move`}
        </div>
      )}

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
