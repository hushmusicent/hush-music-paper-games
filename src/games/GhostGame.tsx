import React, { useEffect, useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { GHOST_SET } from '../data/words';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface GhostGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const GhostGame: React.FC<GhostGameProps> = ({ mode, names, onFinish }) => {
  const [variant, setVariant] = useState<'classic' | 'reverse'>('classic');
  const [challengesOn, setChallengesOn] = useState<boolean>(true);
  const [oneUse, setOneUse] = useState<boolean>(false);
  const [frag, setFrag] = useState<string>('');
  const [ghost, setGhost] = useState<[string, string]>(['', '']);
  const [round, setRound] = useState<number>(1);
  const [turn, setTurn] = useState<number>(0);
  const [phase, setPhase] = useState<'setup' | 'play' | 'prove'>('setup');
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

  const isLegalLetter = (L: string, f: string): boolean =>
    !oneUse || 'aeiou'.includes(L.toLowerCase()) || !f.includes(L.toLowerCase());

  const addLetter = (L: string, seat: number) => {
    if (!isLegalLetter(L, frag)) {
      setMsg(
        `${L} is already in the fragment — with 1-Letter Use on, a consonant can only be played once per round (vowels can repeat).`
      );
      return;
    }
    Sound.click();
    const nextFrag = frag + L.toLowerCase();

    if (!challengesOn && !Logic.ghostCompleteMove(nextFrag) && Logic.ghostContinuations(nextFrag).length === 0) {
      // Challenges off: a letter no word can continue is simply not
      // allowed — the move is rejected and the player picks another letter.
      // (It used to lose the round on the spot; the user flagged that from
      // a screenshot — "KEZ" ended his round instantly. With challenges on
      // this check does not run: bluffing is legal and the next player is
      // expected to challenge.)
      setMsg(
        `"${nextFrag.toUpperCase()}" — no word can continue that, so the letter isn't allowed with Challenges off. Pick a letter that keeps a real word alive.`
      );
      return;
    }

    setFrag(nextFrag);
    setTurn(t => t + 1);
    setLetterInput('');
    setMsg(`${names[seat]} added ${L}.`);

    if (Logic.ghostCompleteMove(nextFrag)) {
      if (variant === 'reverse') {
        // Reverse Ghost: building the word first WINS the round — the
        // other player takes the GHOST letter.
        loseRound(
          1 - seat,
          `${names[seat]} built the word "${nextFrag.toUpperCase()}" and wins the round — ${names[1 - seat]} takes a letter!`
        );
      } else {
        loseRound(
          seat,
          `${names[seat]} completed the word "${nextFrag.toUpperCase()}" — round lost!`
        );
      }
      return;
    }
  };

  // Bot moves are driven by state, not by setTimeout chains inside the
  // handlers: whenever it is the bot's turn in the play phase, it moves.
  // (The old handler-chained timeouts deadlocked after every round the bot
  // lost — the turn sat on the bot with nothing left to trigger its move,
  // and the one kickoff that did exist reused a stale fragment.)
  useEffect(() => {
    if (mode !== 'pvc' || over || phase !== 'play' || cur !== 1) return;
    const t = setTimeout(() => handleBotTurn(frag), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, over, phase, cur, frag, turn]);

  const handleBotTurn = (currentFrag: string) => {
    const allConts = Logic.ghostContinuations(currentFrag);
    // With 1-Letter Use on, the bot may only pick words whose next letter
    // it is actually allowed to play.
    const conts = oneUse
      ? allConts.filter(w => isLegalLetter(w[currentFrag.length], currentFrag))
      : allConts;
    if (challengesOn && currentFrag.length >= 3 && (conts.length === 0 || Math.random() < 0.08)) {
      // Bot challenges human
      setPhase('prove');
      setProveSeat(0);
      setMsg(
        `The computer challenges you — it does not believe a word continues "${currentFrag.toUpperCase()}"!`
      );
      return;
    }
    if (!conts.length) {
      if (challengesOn) {
        // Bot challenges human
        setPhase('prove');
        setProveSeat(0);
        setMsg(
          `The computer challenges you — it does not believe a word continues "${currentFrag.toUpperCase()}"!`
        );
        return;
      }
      // Challenges off and no continuation the bot may legally play:
      // find any legal letter that keeps a word alive; if none exists the
      // bot is genuinely stuck and loses the round.
      const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const playable = [...AZ].find(
        ch =>
          isLegalLetter(ch, currentFrag) &&
          Logic.ghostContinuations(currentFrag + ch.toLowerCase()).length > 0
      );
      if (playable) {
        addLetter(playable, 1);
      } else {
        loseRound(1, 'The computer has no letter that keeps a word alive — round lost!');
      }
      return;
    }
    if (variant === 'reverse') {
      // Reverse Ghost: complete a word the moment one is reachable.
      const completing = conts.filter(w => w.length === currentFrag.length + 1);
      if (completing.length) {
        const target = pickA(completing);
        addLetter(target[currentFrag.length].toUpperCase(), 1);
        return;
      }
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
    if (!challengesOn) return;
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
    const ok = w.startsWith(frag) && w.length > frag.length && GHOST_SET.has(w);
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

  if (phase === 'setup') {
    return (
      <div>
        <PaperPanel>
          <h3 className="font-bold text-sm mb-2 text-[#17457e]">👻 Ghost — pick your game</h3>

          <p className="text-sm font-bold mt-2 mb-1">Game type</p>
          <div className="flex gap-2 my-1">
            <button
              onClick={() => setVariant('classic')}
              className={`btn small !m-0 ${variant === 'classic' ? '' : 'secondary'}`}
            >
              👻 Classic Ghost
            </button>
            <button
              onClick={() => setVariant('reverse')}
              className={`btn small !m-0 ${variant === 'reverse' ? '' : 'secondary'}`}
            >
              🔄 Reverse Ghost
            </button>
          </div>
          <p className="muted text-xs">
            {variant === 'classic'
              ? 'Classic: DON’T be the one who completes a word of 4+ letters — that loses the round.'
              : 'Reverse: race to BUILD a word of 4+ letters first — completing it WINS the round and the other player takes a GHOST letter.'}
          </p>

          <p className="text-sm font-bold mt-3 mb-1">Challenges</p>
          <div className="flex gap-2 my-1">
            <button
              onClick={() => setChallengesOn(true)}
              className={`btn small !m-0 ${challengesOn ? '' : 'secondary'}`}
            >
              ⚔️ Challenges ON
            </button>
            <button
              onClick={() => setChallengesOn(false)}
              className={`btn small !m-0 ${!challengesOn ? '' : 'secondary'}`}
            >
              Challenges OFF
            </button>
          </div>
          <p className="muted text-xs">
            {challengesOn
              ? 'On: a player may challenge instead of adding a letter — “no word continues this!” The challenged player must name a real word or lose the round.'
              : 'Off: no challenges — and a letter no word can continue is not allowed, so every letter you play has to keep a real word alive.'}
          </p>

          <p className="text-sm font-bold mt-3 mb-1">Letter use</p>
          <div className="flex gap-2 my-1">
            <button
              onClick={() => setOneUse(true)}
              className={`btn small !m-0 ${oneUse ? '' : 'secondary'}`}
            >
              🔤 1-Letter Use ON
            </button>
            <button
              onClick={() => setOneUse(false)}
              className={`btn small !m-0 ${!oneUse ? '' : 'secondary'}`}
            >
              1-Letter Use OFF
            </button>
          </div>
          <p className="muted text-xs">
            {oneUse
              ? 'On: each consonant can be played only ONCE per round — once it is in the fragment, nobody can play it again. Vowels (A E I O U) are excepted and can repeat freely.'
              : 'Off: any letter can be played again and again, like the doubles in APPLE or BOOK.'}
          </p>

          <button onClick={() => { Sound.click(); setPhase('play'); }} className="btn mt-3">
            ▶ Start game
          </button>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-sm mb-1 text-[#17457e]">
          Round {round} · {variant === 'reverse' ? '🔄 Reverse Ghost' : '👻 Ghost'} · {names[0]}: "{ghost[0] || '—'}" · {names[1]}: "
          {ghost[1] || '—'}"
        </h3>

        {msg && <div className="msg my-2">{msg}</div>}

        <div className="frag text-3xl font-black text-center my-4 tracking-widest text-[#17457e]">
          {frag ? frag.toUpperCase() : '?'}
        </div>

        {oneUse && (
          <p className="muted text-xs text-center -mt-2 mb-2">
            🔤 1-Letter Use: consonants already played are locked —{' '}
            {[...new Set(frag.split('').filter(ch => !'aeiou'.includes(ch)))]
              .map(ch => ch.toUpperCase())
              .join(' · ') || 'none yet'}{' '}
            (vowels can repeat)
          </p>
        )}

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

            {challengesOn && (
              <button
                onClick={handleChallenge}
                disabled={frag.length < 2 || !isMine || over}
                className="btn secondary text-xs"
              >
                ⚔️ Challenge {names[1 - cur]} — no word continues this!
              </button>
            )}

            <p className="muted text-xs text-center mt-2">
              Fragment: {frag.length} letter(s).{' '}
              {variant === 'reverse'
                ? 'Complete a word of 4+ letters to WIN the round.'
                : 'Completing a word of 4+ letters loses the round.'}
              {!challengesOn && ' Letters no word can continue are not allowed.'}
            </p>
          </div>
        )}
      </PaperPanel>
    </div>
  );
};
