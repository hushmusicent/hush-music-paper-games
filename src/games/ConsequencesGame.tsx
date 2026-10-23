import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { CONS_STORIES, CONS_BANKS, ConsStory } from '../data/consequences';
import { pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface ConsequencesGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

// Fill {key} tokens from the story values, bolding each filled blank.
const renderTemplate = (story: ConsStory, values: Record<string, string>) => {
  const lines = story.template;
  return lines.map((line, li) => (
    <React.Fragment key={li}>
      {line.split(/(\{\w+\})/g).map((part, pi) => {
        const m = part.match(/^\{(\w+)\}$/);
        return m ? (
          <b key={pi}>{values[m[1]] || '?'}</b>
        ) : (
          <React.Fragment key={pi}>{part}</React.Fragment>
        );
      })}
      {li < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

export const ConsequencesGame: React.FC<ConsequencesGameProps> = ({
  mode,
  names,
  onFinish
}) => {
  const [story, setStory] = useState<ConsStory>(() => pickA(CONS_STORIES));
  const [vals, setVals] = useState<Record<string, string>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'write' | 'cover' | 'reveal'>('write');
  const [errorMsg, setErrorMsg] = useState('');

  const currentWho =
    mode === 'pvc'
      ? 'me'
      : Object.keys(vals).length === 0
      ? 'me'
      : 'other';

  const activeFields = story.fields.filter(f => f.who === currentWho);

  const handleInputChange = (k: string, v: string) => {
    setInputs(prev => ({ ...prev, [k]: v }));
  };

  const shuffleStory = () => {
    if (Object.keys(vals).length > 0) return;
    Sound.click();
    const others = CONS_STORIES.filter(s => s.id !== story.id);
    setStory(pickA(others));
    setInputs({});
    setErrorMsg('');
  };

  // The computer fills the other player's blanks from the themed banks,
  // never repeating a bank entry inside one story.
  const botFill = (base: Record<string, string>): Record<string, string> => {
    const merged = { ...base };
    const usedByBank = new Map<string, Set<string>>();
    for (const f of story.fields) {
      if (f.who !== 'other') continue;
      const bankKey = f.bank || 'dialogue';
      const bank = CONS_BANKS[bankKey] || CONS_BANKS.dialogue;
      if (!usedByBank.has(bankKey)) usedByBank.set(bankKey, new Set());
      const used = usedByBank.get(bankKey)!;
      const fresh = bank.filter(v => !used.has(v));
      const val = pickA(fresh.length ? fresh : bank);
      used.add(val);
      merged[f.k] = val;
    }
    return merged;
  };

  const handlePassOrFinish = () => {
    let missing = false;
    for (const f of activeFields) {
      if (!inputs[f.k] || !inputs[f.k].trim()) {
        missing = true;
        break;
      }
    }
    if (missing) {
      setErrorMsg('Please fill in every line first!');
      return;
    }
    setErrorMsg('');
    Sound.click();

    if (mode === 'pvc') {
      const merged = botFill({ ...vals, ...inputs });
      setVals(merged);
      setPhase('reveal');
      finishStory(merged);
    } else {
      if (Object.keys(vals).length === 0) {
        setVals({ ...inputs });
        setInputs({});
        setPhase('cover');
      } else {
        const merged = { ...vals, ...inputs };
        setVals(merged);
        setPhase('reveal');
        finishStory(merged);
      }
    }
  };

  const finishStory = (storyVals: Record<string, string>) => {
    Sound.win();
    setTimeout(() => {
      onFinish({
        winner: 0,
        title: `📖 ${story.icon} ${story.title} — the story is complete!`,
        result: 'w',
        body: (
          <div className="paper my-3 text-base leading-relaxed">
            {renderTemplate(story, storyVals)}
          </div>
        )
      });
    }, 600);
  };

  if (phase === 'cover') {
    return (
      <div className="card text-center my-8 p-6">
        <div className="text-6xl mb-3">🙈</div>
        <h2 className="text-xl font-bold mb-2">Pass to {names[1]}</h2>
        <div className="text-[var(--muted)] text-sm mb-4">
          No peeking, {names[0]}!
        </div>
        <button
          onClick={() => setPhase('write')}
          className="btn"
        >
          I'm {names[1]} — ready
        </button>
      </div>
    );
  }

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-lg mb-1">
          {story.icon} {story.title}
        </h3>
        <p className="text-sm font-bold text-[#17457e] mb-1">
          ✍️{' '}
          {mode === 'hotseat'
            ? `${Object.keys(vals).length === 0 ? names[0] : names[1]}, write your secret lines`
            : 'Write your secret lines'}
        </p>
        <p className="muted text-xs mb-3">
          Shh — the other lines are hidden until the reveal, just like folding
          the paper over. A different story every game!
        </p>

        {Object.keys(vals).length === 0 && (
          <button onClick={shuffleStory} className="btn secondary small !m-0 mb-3">
            🎲 Shuffle story ({CONS_STORIES.length} to choose from)
          </button>
        )}

        {activeFields.map(f => (
          <div key={f.k} className="mb-2">
            <label className="text-xs font-bold text-[#17457e] block mb-1">
              {f.label}
            </label>
            <input
              value={inputs[f.k] || ''}
              onChange={e => handleInputChange(f.k, e.target.value)}
              autoComplete="off"
              className="w-full bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-1.5 text-sm"
            />
          </div>
        ))}

        {errorMsg && <div className="err text-xs my-2">{errorMsg}</div>}

        <button onClick={handlePassOrFinish} className="btn mt-3">
          {mode !== 'pvc' && Object.keys(vals).length === 0
            ? 'Fold the paper & pass it on 🙈'
            : 'Fold the paper & reveal the story 📖'}
        </button>
      </PaperPanel>
    </div>
  );
};
