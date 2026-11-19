import React, { useEffect, useRef, useState } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
import { DICTIONARY_SET } from '../data/dictionary';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface GhostGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Live-room sync — present only in online mode. Same pattern as
  // TicTacToe: serialize the full local state after every move, apply remote
  // state when it arrives, gate turns by mySeat. The fragment, both
  // players' GHOST letters, round, phase and prove seat all travel, so the
  // challenge/prove steps stay turn-gated across phones. Validity runs
  // locally on both phones from the same dictionary, so both sides agree.
  net?: NetGameProp;
}

// Full shared state — one plain JSON object, always with `turn` and `over`
// top-level. `ghost` holds one GHOST-progress string per seat (2 in
// vs-computer / pass-and-play, N in an online room); `msg` travels too so
// both phones show the same narration; `proveWord` travels as part of the
// shape (always '' in pushed states — the defender types locally and only
// the prove resolution is pushed).
interface GhostState {
  frag: string;
  ghost: string[];
  round: number;
  turn: number;
  phase: 'play' | 'prove';
  proveSeat: number;
  proveWord: string;
  msg: string;
  over: boolean;
}

const EMPTY: GhostState = {
  frag: '',
  ghost: [],
  round: 1,
  turn: 0,
  phase: 'play',
  proveSeat: -1,
  proveWord: '',
  msg: '',
  over: false,
};

export const GhostGame: React.FC<GhostGameProps> = ({ mode, names, onFinish, net }) => {
  const [frag, setFrag] = useState<string>('');
  const [ghost, setGhost] = useState<string[]>(() => Array(names.length).fill(''));
  const [round, setRound] = useState<number>(1);
  const [turn, setTurn] = useState<number>(0);
  const [phase, setPhase] = useState<'play' | 'prove'>('play');
  const [proveSeat, setProveSeat] = useState<number>(-1);
  const [proveWord, setProveWord] = useState<string>('');
  const [letterInput, setLetterInput] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [over, setOver] = useState<boolean>(false);

  const cur = turn % names.length;
  const isMine = net ? cur === net.mySeat : mode === 'pvc' ? cur === 0 : true;
  // In the prove phase the actor is the defender (proveSeat), not the
  // player whose turn it was when the challenge was made.
  const proveMine = net
    ? proveSeat === net.mySeat
    : mode === 'pvc'
      ? proveSeat === 0
      : true;

  // --- net sync -----------------------------------------------------------
  const serialize = (): GhostState => ({
    frag,
    ghost: [...ghost],
    round,
    turn,
    phase,
    proveSeat,
    proveWord,
    msg,
    over,
  });
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it. The
  // opening state carries the host's real ghost array (one '' per seat) —
  // pushing EMPTY's [] would leave the guest with no entries and break the
  // first round loss (undefined + 'G').
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push(serialize());
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's move when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as GhostState;
    if (typeof s.frag === 'string') setFrag(s.frag);
    if (Array.isArray(s.ghost)) {
      setGhost(s.ghost.map(g => (g ?? '') as string));
    }
    if (typeof s.round === 'number') setRound(s.round);
    if (typeof s.turn === 'number') setTurn(s.turn);
    if (s.phase === 'play' || s.phase === 'prove') setPhase(s.phase);
    if (typeof s.proveSeat === 'number') setProveSeat(s.proveSeat);
    if (typeof s.proveWord === 'string') setProveWord(s.proveWord);
    if (typeof s.msg === 'string') setMsg(s.msg);
    if (typeof s.over === 'boolean') setOver(s.over);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  // Both phones compute the same result from the same shared state: the
  // seat whose GHOST letters reached 5 loses the match.
  useEffect(() => {
    if (!over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      // The match ends when a seat's GHOST letters reach 5. The winner is
      // the seat with the FEWEST letters — with 2 players that is the other
      // player, exactly as before; with 3-4, a tie for fewest letters is a
      // shared win (tied seats split the pot, +100 ⭐ each).
      const losingSeat = ghost.findIndex(g => (g || '').length >= 5);
      const fewest = Math.min(...ghost.map(g => (g || '').length));
      const tied = ghost.map((g, i) => ((g || '').length === fewest ? i : -1)).filter(i => i >= 0);
      const winner = tied.length === 1 ? tied[0] : -1;
      // Standings: fewest GHOST letters first (fewer letters = winning).
      const standings = names
        .map((n, i) => ({ n, l: (ghost[i] || '').length }))
        .sort((a, b) => a.l - b.l);
      onFinish({
        winner,
        tied,
        title:
          winner !== -1
            ? `${names[winner]} wins the match!`
            : `🤝 ${tied.map(i => names[i]).join(' & ')} tie the match!`,
        body: (
          <div className="msg">
            {names[losingSeat]} has spelled GHOST and loses the match. Standings:{' '}
            {standings.map(o => `${o.n} "${'GHOST'.slice(0, o.l) || '—'}"`).join(' · ')}.
          </div>
        ),
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  // Apply a fully computed next state locally and publish it online.
  const commit = (next: GhostState) => {
    setFrag(next.frag);
    setGhost([...next.ghost]);
    setRound(next.round);
    setTurn(next.turn);
    setPhase(next.phase);
    setProveSeat(next.proveSeat);
    setProveWord(next.proveWord);
    setMsg(next.msg);
    setOver(next.over);
    if (net) net.push({ ...next, ghost: [...next.ghost] });
  };

  // Pure round resolution, mirroring the original ghostRoundLose: the loser
  // takes the next GHOST letter, the fragment clears, the round advances,
  // and the loser starts the next round (turn = losing seat).
  const loseRoundState = (s: GhostState, losingSeat: number, reason: string): GhostState => {
    const nextGhost = [...s.ghost];
    nextGhost[losingSeat] += 'GHOST'[nextGhost[losingSeat].length];
    return {
      ...s,
      ghost: nextGhost,
      msg: reason,
      frag: '',
      phase: 'play',
      proveSeat: -1,
      proveWord: '',
      round: s.round + 1,
      turn: losingSeat,
      over: nextGhost[losingSeat].length >= 5,
    };
  };

  const loseRound = (losingSeat: number, reason: string) => {
    Sound.lose();
    commit(loseRoundState(serialize(), losingSeat, reason));
    // The loser starts the next round (turn set above). If that is the bot,
    // the bot-turn effect below makes its move — no manual kickoff needed.
  };

  const addLetter = (L: string, seat: number) => {
    Sound.click();
    setLetterInput('');
    const nextFrag = frag + L.toLowerCase();

    if (Logic.ghostCompleteMove(nextFrag)) {
      loseRound(
        seat,
        `${names[seat]} completed the word "${nextFrag.toUpperCase()}" — round lost!`
      );
      return;
    }
    commit({ ...serialize(), frag: nextFrag, turn: turn + 1, msg: `${names[seat]} added ${L}.` });
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
      commit({
        ...serialize(),
        phase: 'prove',
        proveSeat: 0,
        msg: `The computer challenges you — it does not believe a word continues "${currentFrag.toUpperCase()}"!`,
      });
      return;
    }
    if (!conts.length) {
      // Bot challenges human
      commit({
        ...serialize(),
        phase: 'prove',
        proveSeat: 0,
        msg: `The computer challenges you — it does not believe a word continues "${currentFrag.toUpperCase()}"!`,
      });
      return;
    }
    const safe = conts.filter(w => w.length !== currentFrag.length + 1);
    const pool = safe.length ? safe : conts;
    const target = pickA(pool);
    const nextChar = target[currentFrag.length].toUpperCase();
    addLetter(nextChar, 1);
  };

  const handleHumanAddLetter = () => {
    if (!isMine || over) return;
    const L = letterInput.trim().toUpperCase();
    if (!/^[A-Z]$/.test(L)) return;
    addLetter(L, cur);
  };

  const handleChallenge = () => {
    if (!isMine || over) return;
    Sound.click();
    const challenger = cur;
    // The defender is the next seat in rotation. With 2 players that is
    // the other player, exactly as before.
    const defender = (challenger + 1) % names.length;

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

    commit({ ...serialize(), phase: 'prove', proveSeat: defender, msg: `${names[challenger]} challenges!` });
  };

  const handleProve = () => {
    if (!proveMine || over) return;
    Sound.click();
    const w = proveWord.trim().toLowerCase();
    const ok = w.startsWith(frag) && w.length > frag.length && DICTIONARY_SET.has(w);
    // The challenger is the seat before the defender in rotation.
    const challenger = (proveSeat - 1 + names.length) % names.length;
    if (ok) {
      loseRound(
        challenger,
        `${names[proveSeat]} proved it with "${w.toUpperCase()}" — the challenger loses the round.`
      );
    } else {
      loseRound(
        proveSeat,
        `${names[proveSeat]} could not name a valid word continuing "${frag.toUpperCase()}" — round lost.`
      );
    }
  };

  if (net && !net.remote && net.mySeat !== 0) {
    return (
      <div>
        <div className="turn-banner">⏳ Waiting for host…</div>
        <PaperPanel>
          <p className="muted text-center text-sm py-6">
            The host is setting up the game. Your moves will appear here.
          </p>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-sm mb-1 text-[#17457e]">
          Round {round} · 👻{' '}
          {names.map((n, i) => `${n}: "${ghost[i] || '—'}"`).join(' · ')}
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
                disabled={!proveMine || over}
                placeholder="Your word…"
                className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-1.5 text-sm"
              />
              <button
                onClick={handleProve}
                disabled={!proveMine || over}
                className="btn small !m-0"
              >
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
              ⚔️ Challenge {names[(cur + 1) % names.length]} — no word continues this!
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
