import React, { useEffect, useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { DICTIONARY_SET } from '../data/dictionary';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface GhostGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const GhostGame: React.FC<GhostGameProps> = ({ mode, names, onFinish }) => {
  const [frag, setFrag] = useState<string>('');
  const [ghost, setGhost] = useState<[string, string]>(['', '']);
  const [round, setRound] = useState<number>(1);
  const [turn, setTurn] = useState<number>(0);
  const [phase, setPhase] = useState<'play' | 'prove'>('play');
  const [proveSeat, setProveSeat] = useState<number>(-1);
  const [proveWord, setProveWord] = useState<string>('');
  const [letterInput, setLetterInput] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [over, setOver] = useState<boolean>(false);

  const cur = turn % names.length;
  const isMine = mode === 'pvc' ? cur === 0 : true;

  const loseRound = (losingSeat: number, reason: string) => {
    Sound.lose();
    const nextGhost = [...ghost] as [string, string];
    nextGhost[losingSeat] += 'GHOST'[nextGhost[losingSeat].length];
    setGhost(nextGhost);
    setMsg(reason);
    setFrag('');
    setPhase('play');
    setProveSeat(-1);
    setRound(r => r + 1);
    setTurn(losingSeat);

    if (nextGhost[losingSeat].length >= 5) {
      setOver(true);
      const winner = 1 - losingSeat;
      setTimeout(() => {
        onFinish({
          winner,
          title: `${names[winner]} wins the match!`,
          body: (
            <div className="msg">
              {names[losingSeat]} has spelled GHOST and loses the match.
            </div>
          )
        });
      }, 400);
      return;
    }
    // The loser starts the next round (setTurn above). If that is the bot,
    // the bot-turn effect below makes its move — no manual kickoff needed.
  };

  const addLetter = (L: string, seat: number) => {
    Sound.click();
    const nextFrag = frag + L.toLowerCase();
    setFrag(nextFrag);
    setTurn(t => t + 1);
    setLetterInput('');
    setMsg(`${names[seat]} added ${L}.`);

    if (Logic.ghostCompleteMove(nextFrag)) {
      loseRound(
        seat,
        `${names[seat]} completed the word "${nextFrag.toUpperCase()}" — round lost!`
      );
      return;
    }
  };

  // Bot moves are driven by state, not by setTimeout chains inside the
  // handlers: whenever it is the bot's turn in the play phase, it moves.
  // (The original handler-chained timeouts deadlocked after every round the
  // bot lost — the turn sat on the bot with nothing left to trigger its
  // move, and the one kickoff that did exist reused a stale fragment.)
  useEffect(() => {
    if (mode !== 'pvc' || over || phase !== 'play' || cur !== 1) return;
    const t = setTimeout(() => handleBotTurn(frag), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, over, phase, cur, frag, turn]);

  const handleBotTurn = (currentFrag: string) => {
    const conts = Logic.ghostContinuations(currentFrag);
    if (currentFrag.length >= 3 && (conts.length === 0 || Math.random() < 0.08)) {
      // Bot challenges human
      setPhase('prove');
      setProveSeat(0);
      setMsg(
        `The computer challenges you — it does not believe a word continues "${currentFrag.toUpperCase()}"!`
      );
      return;
    }
    if (!conts.length) {
      // Bot challenges human
      setPhase('prove');
      setProveSeat(0);
      setMsg(
        `The computer challenges you — it does not believe a word continues "${currentFrag.toUpperCase()}"!`
      );
      return;
    }
    const safe = conts.filter(w => w.length !== currentFrag.length + 1);
    const pool = safe.length ? safe : conts;
    const target = pickA(pool);
    const nextChar = target[currentFrag.length].toUpperCase();
    addLetter(nextChar, 1);
  };

  const handleHumanAddLetter = () => {
    const L = letterInput.trim().toUpperCase();
    if (!/^[A-Z]$/.test(L)) return;
    addLetter(L, cur);
  };

  const handleChallenge = () => {
    Sound.click();
    const challenger = cur;
    const defender = 1 - challenger;

    if (mode === 'pvc' && defender === 1) {
      // Challenging the bot
      const conts = Logic.ghostContinuations(frag);
      if (conts.length) {
        loseRound(
          challenger,
          `The computer proves it: "${pickA(conts).toUpperCase()}" continues the fragment. Your challenge fails — you lose the round.`
        );
      } else {
        loseRound(
          defender,
          `The computer cannot name a word continuing "${frag.toUpperCase()}" — bluff called! The computer loses the round.`
        );
      }
      return;
    }

    setPhase('prove');
    setProveSeat(defender);
    setMsg(`${names[challenger]} challenges!`);
  };

  const handleProve = () => {
    Sound.click();
    const w = proveWord.trim().toLowerCase();
    const ok = w.startsWith(frag) && w.length > frag.length && DICTIONARY_SET.has(w);
    if (ok) {
      loseRound(
        1 - proveSeat,
        `${names[proveSeat]} proved it with "${w.toUpperCase()}" — the challenger loses the round.`
      );
    } else {
      loseRound(
        proveSeat,
        `${names[proveSeat]} could not name a valid word continuing "${frag.toUpperCase()}" — round lost.`
      );
    }
    setProveWord('');
  };

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-sm mb-1 text-[#17457e]">
          Round {round} · 👻 {names[0]}: "{ghost[0] || '—'}" · {names[1]}: "
          {ghost[1] || '—'}"
        </h3>

        {msg && <div className="msg my-2">{msg}</div>}

        <div className="frag text-3xl font-black text-center my-4 tracking-widest text-[#17457e]">
          {frag ? frag.toUpperCase() : '?'}
        </div>

        {phase === 'prove' ? (
          <div className="my-3">
            <p className="text-sm mb-2">
              <b>{names[proveSeat]}</b>, you were challenged! Type a real word (4+
              letters) that starts with <b>{frag.toUpperCase()}</b>:
            </p>
            <div className="flex gap-2">
              <input
                value={proveWord}
                onChange={e => setProveWord(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleProve()}
                placeholder="Your word…"
                className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-1.5 text-sm"
              />
              <button onClick={handleProve} className="btn small !m-0">
                Prove it
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="turn-banner my-2">
              {over
                ? 'Game Over'
                : isMine
                ? `🟢 Your move — ${names[cur]}`
                : `⏳ ${names[cur]} to move`}
            </div>

            <div className="flex gap-2 items-center my-2">
              <input
                value={letterInput}
                onChange={e => setLetterInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleHumanAddLetter()}
                maxLength={1}
                disabled={!isMine || over}
                placeholder="Add a letter (A–Z)"
                className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm text-center font-bold"
              />
              <button
                onClick={handleHumanAddLetter}
                disabled={!isMine || over}
                className="btn small !m-0"
              >
                Add letter
              </button>
            </div>

            <button
              onClick={handleChallenge}
              disabled={frag.length < 2 || !isMine || over}
              className="btn secondary text-xs"
            >
              ⚔️ Challenge {names[1 - cur]} — no word continues this!
            </button>

            <p className="muted text-xs text-center mt-2">
              Fragment: {frag.length} letter(s). Completing a word of 4+ letters
              loses the round.
            </p>
          </div>
        )}
      </PaperPanel>
    </div>
  );
};
