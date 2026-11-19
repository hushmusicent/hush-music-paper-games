import React, { useState, useEffect, useRef } from 'react';
import { GameMode, FinishResult, NetGameProp } from '../types';
import { HANG_LEVELS } from '../data/words';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface HangmanProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
  // Chosen on the level selection screen (GameModeView) BEFORE the game starts.
  level?: number;
  // Live-room sync — present only in online mode. Same pattern as TicTacToe:
  // serialize the full local state after every guess, apply remote state
  // when it arrives, gate turns by mySeat. The host's word is the ONE
  // shared word: it lives in the serialized state, so the guest never picks
  // their own word.
  net?: NetGameProp;
}

interface HangState {
  word: string;
  guessed: string[];
  wrong: number;
  turn: number;
  over: boolean;
  // The host's level bank: the word comes from it, so the level chip must
  // travel too — otherwise the guest sees their own saved level while
  // playing the host's word.
  level: number;
}

export const Hangman: React.FC<HangmanProps> = ({ mode, names, onFinish, level: levelProp, net }) => {
  const [level, setLevel] = useState(() => Math.max(1, Math.min(10, levelProp || 1)));
  const [word, setWord] = useState(() => pickA(HANG_LEVELS[level - 1]));
  const [guessed, setGuessed] = useState<string[]>([]);
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);

  const cur = mode === 'pvc' ? 0 : turn % names.length;
  const isMine = net ? cur === net.mySeat : true; // In pass & play either player takes turns
  const wrong = Logic.hangWrong(word, guessed);

  // --- net sync -----------------------------------------------------------
  const serialize = (): HangState => ({ word, guessed: [...guessed], wrong, turn, over, level });
  const localJson = useRef('');
  localJson.current = JSON.stringify(serialize());
  const pushedInit = useRef(false);
  const finishFired = useRef(false);

  // Host publishes the opening state once; the guest waits for it. The
  // opening state carries the word the host picked from its level bank.
  useEffect(() => {
    if (net && net.mySeat === 0 && !net.remote && !pushedInit.current) {
      pushedInit.current = true;
      net.push(serialize());
    }
    // Only on mount: the host's opening push must fire exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the opponent's guess when remote state arrives (skip our own echo).
  useEffect(() => {
    if (!net || !net.remote) return;
    const incoming = JSON.stringify(net.remote);
    if (incoming === localJson.current) return;
    const s = net.remote as HangState;
    if (typeof s.word === 'string' && s.word) setWord(s.word);
    if (Array.isArray(s.guessed)) setGuessed([...s.guessed]);
    if (typeof s.turn === 'number') setTurn(s.turn);
    if (typeof s.over === 'boolean') setOver(s.over);
    if (typeof s.level === 'number') setLevel(Math.max(1, Math.min(10, s.level)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net ? net.remote : null]);

  // Finish fires from state (local move OR remote apply), once, both sides.
  // Both phones compute the same result from the same shared state: the
  // last guesser is (turn - 1) % names.length, since turn was already
  // incremented past their guess when the ending state was published.
  useEffect(() => {
    if (!over || finishFired.current) return;
    finishFired.current = true;
    const t = setTimeout(() => {
      const won = Logic.hangRevealed(word, guessed);
      const lastSeat = mode === 'pvc' ? 0 : ((turn - 1) % names.length + names.length) % names.length;
      if (won) {
        onFinish({
          winner: lastSeat,
          title: `${names[lastSeat]} wins!`,
          body: (
            <div className="msg">
              {names[lastSeat]} guessed the last letter — the word was <b>{word}</b>!
            </div>
          )
        });
      } else {
        const losingSeat = lastSeat;
        // The next seat in rotation after the loser wins the round. With
        // 2 players that is the other player, exactly as before; with 3-4
        // it is the player who would have guessed next. The host stays the
        // setter (their word is the shared word) — only the guessing turns
        // rotate through every seat.
        const winningSeat = mode === 'pvc' ? 1 : (losingSeat + 1) % names.length;
        onFinish({
          winner: winningSeat,
          title: mode === 'pvc' ? 'Game Over' : `${names[winningSeat]} wins!`,
          body: (
            <div className="msg">
              {names[losingSeat]} made the 6th wrong guess. The word was <b>{word}</b>.
            </div>
          )
        });
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  // End detection only: sets over and reports whether the game ended.
  // The finish itself fires from the effect above, so a remote apply that
  // lands an ended state finishes the game on this phone too.
  const checkGameEnd = (newGuessed: string[]): boolean => {
    const wrongCount = Logic.hangWrong(word, newGuessed);
    const won = Logic.hangRevealed(word, newGuessed);
    if (won || wrongCount >= 6) {
      setOver(true);
      return true;
    }
    return false;
  };

  const handleGuess = (letter: string) => {
    if (guessed.includes(letter) || over || !isMine) return;
    Sound.click();
    const nextGuessed = [...guessed, letter];
    const nextTurn = turn + 1;
    const ended = checkGameEnd(nextGuessed);
    setGuessed(nextGuessed);
    setTurn(nextTurn);
    if (net) {
      net.push({
        word,
        guessed: nextGuessed,
        wrong: Logic.hangWrong(word, nextGuessed),
        turn: nextTurn,
        over: ended
      });
    }
  };

  const parts = [
    <g key="0">
      <line x1="20" y1="140" x2="60" y2="140" stroke="#22304a" strokeWidth="4" />
      <line x1="40" y1="140" x2="40" y2="20" stroke="#22304a" strokeWidth="4" />
    </g>,
    <g key="1">
      <line x1="40" y1="20" x2="105" y2="20" stroke="#22304a" strokeWidth="4" />
      <line x1="40" y1="35" x2="55" y2="20" stroke="#22304a" strokeWidth="3" />
    </g>,
    <line key="2" x1="105" y1="20" x2="105" y2="42" stroke="#22304a" strokeWidth="3" />,
    <circle key="3" cx="105" cy="54" r="12" fill="none" stroke="#c0392b" strokeWidth="3" />,
    <line key="4" x1="105" y1="66" x2="105" y2="100" stroke="#c0392b" strokeWidth="3" />,
    <g key="5">
      <line x1="105" y1="76" x2="90" y2="90" stroke="#c0392b" strokeWidth="3" />
      <line x1="105" y1="76" x2="120" y2="90" stroke="#c0392b" strokeWidth="3" />
      <line x1="105" y1="100" x2="92" y2="118" stroke="#c0392b" strokeWidth="3" />
      <line x1="105" y1="100" x2="118" y2="118" stroke="#c0392b" strokeWidth="3" />
    </g>
  ];

  const disp = word
    .split('')
    .map(ch => (guessed.includes(ch) ? ch : '_'))
    .join(' ');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (net && !net.remote && net.mySeat !== 0) {
    return (
      <div>
        <div className="turn-banner">⏳ Waiting for host…</div>
        <PaperPanel>
          <p className="muted text-center text-sm py-6">
            The host is picking the word. The shared word and guesses will appear here.
          </p>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div>
      <div className="turn-banner">
        {over
          ? 'Game Over'
          : net
          ? isMine
            ? `🟢 Your turn to guess — ${names[cur]}`
            : `⏳ ${names[cur]}'s turn to guess`
          : mode === 'pvc'
          ? `🟢 Your turn to guess — ${names[0]}`
          : `🟢 ${names[cur]}'s turn to guess`}
      </div>

      <PaperPanel>
        <div className="text-center mb-1">
          <span className="chip">🎚️ Level {level} · 300 words</span>
        </div>
        <svg viewBox="0 0 140 150" className="w-[170px] block mx-auto my-2">
          {parts.slice(0, Math.min(wrong, parts.length))}
        </svg>

        <div className="frag text-2xl font-black text-center my-3 tracking-widest text-[#17457e]">
          {disp}
        </div>

        <p className="text-center font-bold text-sm my-2">
          Wrong guesses: {wrong} / 6
          {guessed.length > 0 && ` · Guessed: ${guessed.join(', ')}`}
        </p>

        <div className="text-center my-3 max-w-[380px] mx-auto">
          {alphabet.map(L => {
            const used = guessed.includes(L);
            const bad = used && !word.includes(L);
            const good = used && word.includes(L);
            return (
              <button
                key={L}
                onClick={() => handleGuess(L)}
                disabled={used || over || !isMine}
                className={`kbtn ${bad ? 'bad' : good ? 'good' : ''}`}
              >
                {L}
              </button>
            );
          })}
        </div>
      </PaperPanel>
    </div>
  );
};
