import React, { useEffect, useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { LADDER_PUZZLES } from '../data/words';
import { DICTIONARY_WORDS } from '../data/dictionary';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface WordLadderGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

const TURN_SECONDS = 30;

const LEVEL_LABELS: Record<number, string> = {
  1: '3-letter words',
  2: '4-letter words',
  3: '4 letters · longer routes',
  4: '5-letter words',
  5: '5 letters · longer routes',
  6: '6-letter words',
  7: '6 letters · longer routes',
  8: '7-letter words',
  9: '7 letters · longest routes',
  10: 'Championship · the longest routes in the game'
};

const puzzlesFor = (lvl: number) => LADDER_PUZZLES.filter(p => p.lvl === lvl);

export const WordLadderGame: React.FC<WordLadderGameProps> = ({ mode, names, onFinish }) => {
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [timerOn, setTimerOn] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const [puzzle, setPuzzle] = useState(() => pickA(puzzlesFor(1)));
  const [steps, setSteps] = useState<string[]>([puzzle.s]);
  const [seats, setSeats] = useState<number[]>([-1]);
  const [turnSeat, setTurnSeat] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(TURN_SECONDS);
  const [inputVal, setInputVal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

  const botTurn = mode === 'pvc' && turnSeat === 1;
  const distToTarget = (w: string): number => {
    let d = 0;
    for (let i = 0; i < w.length; i++) if (w[i] !== puzzle.t[i]) d++;
    return d;
  };
  const legalMoves = (from: string, chain: string[]): string[] =>
    DICTIONARY_WORDS.map(w => w.toUpperCase()).filter(
      w =>
        w.length === from.length &&
        w !== from &&
        Logic.ladderOneLetter(from.toLowerCase(), w.toLowerCase()) &&
        !chain.includes(w)
    );

  const finish = (winner: number, title: string, body: React.ReactNode) => {
    setOver(true);
    Sound.win();
    setTimeout(() => onFinish({ winner, title, body }), 600);
  };

  const applyMove = (w: string, seat: number) => {
    Sound.click();
    const nextSteps = [...steps, w];
    setSteps(nextSteps);
    setSeats([...seats, seat]);
    setInputVal('');
    setErrorMsg('');
    setMsg(`${names[seat]} played ${w}.`);

    if (w === puzzle.t) {
      finish(
        seat,
        `${names[seat]} reached ${puzzle.t} and wins the race!`,
        <div className="msg">
          {names[seat]} played the target word {puzzle.t} after {nextSteps.length - 1} total
          moves on the chain.
        </div>
      );
      return;
    }
    if (legalMoves(w, nextSteps).length === 0) {
      finish(
        seat,
        `${names[seat]} wins the race!`,
        <div className="msg">
          {names[1 - seat]} has no legal move from {w} — every one-letter change is either not
          a word or already on the chain.
        </div>
      );
      return;
    }
    setTurnSeat(1 - seat);
  };

  const handleStep = (val: string) => {
    if (over || botTurn) return;
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
    applyMove(w, turnSeat);
  };

  const botMove = () => {
    const cur = steps[steps.length - 1];
    const moves = legalMoves(cur, steps);
    if (!moves.length) {
      finish(
        0,
        `${names[0]} wins the race!`,
        <div className="msg">The computer has no legal move from {cur}.</div>
      );
      return;
    }
    const sol = puzzle.sol;
    const idx = sol.indexOf(cur);
    const solNext = idx >= 0 && idx < sol.length - 1 && moves.includes(sol[idx + 1]) ? sol[idx + 1] : null;
    const closer = moves
      .filter(w => distToTarget(w) < distToTarget(cur))
      .sort((a, b) => distToTarget(a) - distToTarget(b));
    let choice: string;
    if (Math.random() < 0.3) {
      choice = pickA(moves); // occasional loose play, so the race stays winnable
    } else if (solNext) {
      choice = solNext;
    } else if (closer.length) {
      choice = closer[0];
    } else {
      choice = pickA(moves);
    }
    applyMove(choice, 1);
  };

  // Bot moves are driven by state (same pattern as Ghost): whenever it is
  // the computer's turn during play, it moves after a short think.
  useEffect(() => {
    if (mode !== 'pvc' || phase !== 'play' || over || turnSeat !== 1) return;
    const t = setTimeout(botMove, 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, over, turnSeat, steps]);

  // 30-second turn clock (optional): on a human turn it counts down, and
  // running out passes the turn to the other player.
  useEffect(() => {
    if (!timerOn || phase !== 'play' || over || botTurn) return;
    setSecondsLeft(TURN_SECONDS);
    const iv = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(iv);
  }, [timerOn, phase, over, turnSeat, steps, botTurn]);

  useEffect(() => {
    if (!timerOn || phase !== 'play' || over || botTurn || secondsLeft > 0) return;
    setMsg(`⏰ Time! ${names[turnSeat]} took too long — turn passes to ${names[1 - turnSeat]}.`);
    setTurnSeat(1 - turnSeat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const startWith = (pz: (typeof LADDER_PUZZLES)[number]) => {
    setPuzzle(pz);
    setSteps([pz.s]);
    setSeats([-1]);
    setTurnSeat(0);
    setOver(false);
    setMsg('');
    setErrorMsg('');
    setInputVal('');
  };

  const handleNewPuzzle = () => {
    Sound.click();
    const bank = puzzlesFor(level);
    const others = bank.filter(p => p.s !== puzzle.s || p.t !== puzzle.t);
    startWith(pickA(others.length ? others : bank));
  };

  const startRace = () => {
    Sound.click();
    startWith(pickA(puzzlesFor(level)));
    setPhase('play');
  };

  if (phase === 'setup') {
    return (
      <div>
        <PaperPanel>
          <h3 className="font-bold text-sm mb-2 text-[#17457e]">🪜 Word Ladders — the race</h3>
          <p className="text-sm mb-2">
            Both players climb the SAME ladder, taking turns. Change exactly one letter to
            make a new word — whoever plays the target word first wins. Leave your opponent
            with no legal move and you win too.
          </p>

          <p className="text-sm font-bold mt-3 mb-1">Level (words get longer as you climb)</p>
          <div className="flex flex-wrap gap-1 my-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`btn small !m-0 ${level === l ? '' : 'secondary'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="muted text-xs">
            Level {level} — {LEVEL_LABELS[level]} · {puzzlesFor(level).length} ladders
          </p>

          <p className="text-sm font-bold mt-3 mb-1">Turn timer</p>
          <div className="flex gap-2 my-1">
            <button
              onClick={() => setTimerOn(true)}
              className={`btn small !m-0 ${timerOn ? '' : 'secondary'}`}
            >
              ⏱️ 30-second turns ON
            </button>
            <button
              onClick={() => setTimerOn(false)}
              className={`btn small !m-0 ${!timerOn ? '' : 'secondary'}`}
            >
              Timer OFF
            </button>
          </div>
          <p className="muted text-xs">
            {timerOn
              ? 'On: each player gets 30 seconds per turn. Run out of time and your turn passes to the other player.'
              : 'Off: take as long as you like on each turn.'}
          </p>

          <button onClick={startRace} className="btn mt-3">
            ▶ Start race
          </button>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-lg mb-1">
          Level {level} · {puzzle.s} ➜ {puzzle.t}
        </h3>
        <p className="text-sm mb-2">
          First to play <b>{puzzle.t}</b> wins · Moves so far: <b>{steps.length - 1}</b>
        </p>

        <div className="turn-banner my-2">
          {over
            ? '🏁 Race over'
            : botTurn
            ? `⏳ ${names[1]} is thinking…`
            : `🟢 Your move — ${names[turnSeat]}`}
          {timerOn && !over && !botTurn && (
            <span className={secondsLeft <= 10 ? 'text-red-600 font-black' : ''}>
              {' '}· ⏱️ {secondsLeft}s
            </span>
          )}
        </div>

        {msg && <div className="msg my-2">{msg}</div>}

        <div className="my-3 flex flex-wrap items-center gap-1">
          {steps.map((w, i) => (
            <React.Fragment key={i}>
              <span
                className={`chip font-mono font-bold ${
                  seats[i] === 0
                    ? '!bg-[#cfe4ff]'
                    : seats[i] === 1
                    ? '!bg-[#ffd9d9]'
                    : ''
                } ${i === steps.length - 1 ? 'outline outline-2 outline-[#17457e]' : ''}`}
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
            placeholder={botTurn ? 'Computer is thinking…' : 'Next word — change ONE letter'}
            disabled={over || botTurn}
            autoComplete="off"
            className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm font-mono font-bold"
          />
          <button onClick={() => handleStep(inputVal)} disabled={over || botTurn} className="btn small !m-0">
            Step
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <button onClick={handleNewPuzzle} className="btn secondary small flex-1">
            🎲 New puzzle (restart race)
          </button>
        </div>

        {errorMsg && <div className="err text-xs mt-1">{errorMsg}</div>}
      </PaperPanel>
    </div>
  );
};
