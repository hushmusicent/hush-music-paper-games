import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { CONS_FIELDS, CONS_BOT } from '../data/words';
import { pickA } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface ConsequencesGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const ConsequencesGame: React.FC<ConsequencesGameProps> = ({
  mode,
  names,
  onFinish
}) => {
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

  const activeFields = CONS_FIELDS.filter(f => f.who === currentWho);

  const handleInputChange = (k: string, v: string) => {
    setInputs(prev => ({ ...prev, [k]: v }));
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
      const merged: Record<string, string> = { ...vals, ...inputs };
      for (const f of CONS_FIELDS) {
        if (f.who === 'other') {
          merged[f.k] = pickA(CONS_BOT[f.k] || ['???']);
        }
      }
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
        title: '📖 The story is complete!',
        result: 'w',
        body: (
          <div className="paper my-3 text-base leading-relaxed">
            The <b>{storyVals.adj1 || '?'}</b> <b>{storyVals.man || '?'}</b> met the{' '}
            <b>{storyVals.adj2 || '?'}</b> <b>{storyVals.woman || '?'}</b> at{' '}
            <b>{storyVals.place || '?'}</b>.<br />
            He said, “{storyVals.heSaid || '…'}”<br />
            She said, “{storyVals.sheSaid || '…'}”<br />
            And the consequence was… <b>{storyVals.ending || '…'}</b>
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
          ✍️{' '}
          {mode === 'hotseat'
            ? `${Object.keys(vals).length === 0 ? names[0] : names[1]}, write your secret lines`
            : 'Write your secret lines'}
        </h3>
        <p className="muted text-xs mb-3">
          Shh — the other lines are hidden until the reveal, just like folding the
          paper over.
        </p>

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
          Fold the paper &amp; pass it on 🙈
        </button>
      </PaperPanel>
    </div>
  );
};
