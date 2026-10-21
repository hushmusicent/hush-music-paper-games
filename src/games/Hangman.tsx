import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { HANG_WORDS } from '../data/words';
import { Logic, pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface HangmanProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const Hangman: React.FC<HangmanProps> = ({ mode, names, onFinish }) => {
  const [word] = useState(() => pickA(HANG_WORDS));
  const [guessed, setGuessed] = useState<string[]>([]);
  const [turn, setTurn] = useState<number>(0);
  const [over, setOver] = useState<boolean>(false);

  const cur = mode === 'pvc' ? 0 : turn % names.length;
  const isMine = mode === 'pvc' ? true : true; // In pass & play either player takes turns
  const wrong = Logic.hangWrong(word, guessed);

  const checkGameEnd = (newGuessed: string[]) => {
    const wrongCount = Logic.hangWrong(word, newGuessed);
    const won = Logic.hangRevealed(word, newGuessed);
    const lastSeat = mode === 'pvc' ? 0 : turn % names.length;

    if (won) {
      setOver(true);
      setTimeout(() => {
        onFinish({
          winner: lastSeat,
          title: `${names[lastSeat]} wins!`,
          body: (
            <div className="msg">
              {names[lastSeat]} guessed the last letter — the word was <b>{word}</b>!
            </div>
          )
        });
      }, 400);
      return true;
    }

    if (wrongCount >= 6) {
      setOver(true);
      const losingSeat = lastSeat;
      const winningSeat = mode === 'pvc' ? 1 : 1 - losingSeat;
      setTimeout(() => {
        onFinish({
          winner: winningSeat,
          title: mode === 'pvc' ? 'Game Over' : `${names[winningSeat]} wins!`,
          body: (
            <div className="msg">
              {names[losingSeat]} made the 6th wrong guess. The word was <b>{word}</b>.
            </div>
          )
        });
      }, 400);
      return true;
    }
    return false;
  };

  const handleGuess = (letter: string) => {
    if (guessed.includes(letter) || over) return;
    Sound.click();
    const nextGuessed = [...guessed, letter];
    setGuessed(nextGuessed);
    setTurn(t => t + 1);
    checkGameEnd(nextGuessed);
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

  return (
    <div>
      <div className="turn-banner">
        {over
          ? 'Game Over'
          : mode === 'pvc'
          ? `🟢 Your turn to guess — ${names[0]}`
          : `🟢 ${names[cur]}'s turn to guess`}
      </div>

      <PaperPanel>
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
                disabled={used || over}
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
