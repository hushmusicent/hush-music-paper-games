import React, { useState, useEffect } from 'react';
import { GameMode, FinishResult } from '../types';
import { TABOO_BANK } from '../data/words';
import { shuffle } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface TabooGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const TabooGame: React.FC<TabooGameProps> = ({ mode, names, onFinish }) => {
  const [deck] = useState(() => shuffle(TABOO_BANK.map((_, i) => i)));
  const [cardIdx, setCardIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [seen, setSeen] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [inputGuess, setInputGuess] = useState('');
  const [lastMsg, setLastMsg] = useState('');
  const [over, setOver] = useState(false);
  // pass & play: the card stays covered until the clue-giver peeks,
  // so guessers never see the word or its taboo words
  const [showCard, setShowCard] = useState(false);

  const card = TABOO_BANK[deck[cardIdx % deck.length]];

  useEffect(() => {
    if (over) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          finishRound(score, seen);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [over, score, seen]);

  const finishRound = (finalScore: number, finalSeen: number) => {
    setOver(true);
    const win = finalScore >= 5;
    if (win) Sound.win();
    else Sound.lose();

    setTimeout(() => {
      onFinish({
        winner: win ? 0 : 1,
        title: `${win ? '🏆 Time! ' : '⏰ Time! '}You got ${finalScore} of ${finalSeen} cards.`,
        result: mode === 'hotseat' ? null : win ? 'w' : 'l',
        body: (
          <div className="paper my-2">
            <p>
              Score <b>{finalScore}</b> · Cards seen <b>{finalSeen}</b> ·{' '}
              {win
                ? '5+ correct — that is a win! 🎉'
                : 'Get 5+ correct to win next time.'}
            </p>
          </div>
        )
      });
    }, 500);
  };

  const handleNext = (correct: boolean, msg: string) => {
    if (correct) {
      Sound.win();
      setScore(s => s + 1);
    } else {
      Sound.click();
    }
    setSeen(s => s + 1);
    setShowCard(false);
    setCardIdx(i => i + 1);
    setLastMsg(msg);
    setInputGuess('');
  };

  const handleGuessSubmit = () => {
    const val = inputGuess.trim().toUpperCase();
    if (!val) return;
    if (val === card.target.toUpperCase()) {
      handleNext(true, `✔️ Correct — it was ${card.target}!`);
    } else {
      Sound.beep(300, 0.08, 'square');
      setLastMsg(`Not quite — try again or skip.`);
    }
  };

  return (
    <div>
      <PaperPanel>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[#17457e]">
            Score: <span className="text-xl font-black">{score}</span> · Seen: {seen}
          </h3>
          <div className="font-bold text-[#17457e] bg-blue-100 px-3 py-1 rounded-full text-sm">
            ⏱️ {timeLeft}s
          </div>
        </div>

        {lastMsg && <div className="msg my-2">{lastMsg}</div>}

        {mode === 'hotseat' ? (
          !showCard ? (
            <div className="text-center py-4">
              <div style={{ fontSize: '44px' }}>🙈</div>
              <p className="font-bold mb-1">Card covered</p>
              <p className="muted text-xs mb-4">
                Guessers, look away! Only the clue-giver may peek — nobody else should
                see the word or its taboo words.
              </p>
              <button onClick={() => { Sound.click(); setShowCard(true); }} className="btn">
                👀 Clue-giver: peek at the card
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-2">
                🙈 <b>Clue-giver only:</b> the word is{' '}
                <span className="text-xl font-black text-[#17457e]">
                  {card.target}
                </span>
              </p>
              <p className="text-sm mb-3">
                🚫 Never say: <b>{card.taboo.join(', ')}</b> (or the word itself!)
              </p>
              <p className="muted text-xs mb-4">
                Describe it out loud. When the others get it, tap Correct.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleNext(true, `✔️ Correct — it was ${card.target}!`)
                  }
                  className="btn flex-1"
                >
                  ✔️ They guessed it
                </button>
                <button
                  onClick={() =>
                    handleNext(false, `⏭️ Skipped — it was ${card.target}.`)
                  }
                  className="btn secondary flex-1"
                >
                  Skip card ⏭️
                </button>
              </div>
            </div>
          )
        ) : (
          <div>
            <p className="text-xs font-bold text-[#17457e]">
              🤖 The computer's clue:
            </p>
            <p className="text-base font-medium my-2 italic">“{card.clue}”</p>
            <p className="muted text-xs mb-3">
              The computer described it without using the word itself or any of its 5
              secret taboo words — those stay hidden from the guesser. What is the word?
            </p>

            <div className="flex gap-2 items-center mb-3">
              <input
                value={inputGuess}
                onChange={e => setInputGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuessSubmit()}
                placeholder="Your guess…"
                autoComplete="off"
                className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
              />
              <button onClick={handleGuessSubmit} className="btn small !m-0">
                Guess
              </button>
            </div>

            <button
              onClick={() =>
                handleNext(false, `⏭️ Skipped — it was ${card.target}.`)
              }
              className="btn secondary small"
            >
              Skip card ⏭️
            </button>
          </div>
        )}
      </PaperPanel>
    </div>
  );
};
