import React, { useEffect, useState } from 'react';
import { GameMode, FinishResult } from '../types';
import {
  FORTUNE_CATEGORIES,
  FortuneCategory,
  ZODIAC,
  ZodiacInfo,
  zodiacFor,
  SIGN_LINES,
  ASTRO_LINES,
  MOON_LINES
} from '../data/fortunes';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface MashGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

type Stage = 'pick' | 'blanks' | 'reveal';

const fill = (s: string, v: Record<string, string>) =>
  s.split('{a}').join(v.a).split('{b}').join(v.b).split('{c}').join(v.c);

const fillAstro = (s: string, z: ZodiacInfo) =>
  s
    .split('{sign}')
    .join(z.emoji + ' ' + z.sign)
    .split('{planet}')
    .join(z.planet)
    .split('{element}')
    .join(z.element)
    .split('{trait}')
    .join(z.trait);

export const MashGame: React.FC<MashGameProps> = ({ names, onFinish }) => {
  const [stage, setStage] = useState<Stage>('pick');
  const [cat, setCat] = useState<FortuneCategory | null>(null);
  const [values, setValues] = useState<Record<string, string>>({ a: '', b: '', c: '' });
  const [birthday, setBirthday] = useState<string>('');
  const [fortune, setFortune] = useState<{
    lines: string[];
    spirit: number;
    lucky: number;
    sign: ZodiacInfo;
    born: boolean;
  } | null>(null);
  const [shown, setShown] = useState(0);

  const seeker = names && names[0] ? names[0] : 'Seeker';

  const chooseCategory = (c: FortuneCategory) => {
    Sound.click();
    setCat(c);
    const init: Record<string, string> = {};
    c.blanks.forEach(b => (init[b.key] = b.def));
    setValues(init);
    setStage('blanks');
  };

  const consult = () => {
    if (!cat) return;
    const v: Record<string, string> = {};
    cat.blanks.forEach(b => {
      const raw = (values[b.key] || '').trim();
      v[b.key] = raw || b.def; // the spirits fill any silence
    });
    const charSum = (v.a + v.b + v.c + cat.id + birthday)
      .split('')
      .reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const spirit = 3 + (charSum % 8); // the ancient count runs 3..10
    const lucky = ((charSum * 7) % 90) + 1;
    // astrology: the birthday blank sets the seeker's stars
    let sign: ZodiacInfo | null = null;
    const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || '');
    if (dm) {
      const mo = parseInt(dm[2], 10);
      const dy = parseInt(dm[3], 10);
      if (mo >= 1 && mo <= 12 && dy >= 1 && dy <= 31) sign = zodiacFor(mo, dy);
    }
    const born = !!sign;
    if (!sign) sign = ZODIAC[charSum % 12]; // no birthday: the spirits cast the chart
    const banks: Record<string, string[]> = {
      Opener: cat.openers,
      Moon: MOON_LINES,
      Main: cat.mains,
      Astro: [...(SIGN_LINES[sign.sign] || []), ...ASTRO_LINES],
      Second: cat.seconds || [],
      Twist: cat.twists,
      Closing: cat.closings
    };
    if (cat.special) banks.Special = cat.special.options;
    const picks = Logic.mashEliminate(banks, spirit);
    const lines: string[] = [
      fill(picks.Opener, v),
      fill(picks.Moon, v),
      fill(picks.Main, v),
      fillAstro(picks.Astro, sign),
      fill(picks.Second, v)
    ];
    if (cat.special) lines.push(cat.special.line.split('{x}').join(picks.Special));
    lines.push(fill(picks.Twist, v), fill(picks.Closing, v));
    Sound.win();
    setFortune({ lines, spirit, lucky, sign, born });
    setShown(0);
    setStage('reveal');
  };

  useEffect(() => {
    if (stage !== 'reveal' || !fortune) return;
    const timers = fortune.lines.map((_, i) =>
      setTimeout(() => setShown(i + 1), 1300 + i * 850)
    );
    return () => timers.forEach(clearTimeout);
  }, [stage, fortune]);

  const seal = () => {
    if (!cat || !fortune) return;
    onFinish({
      winner: 0,
      title: '🔮 The spirits have spoken',
      result: 'w',
      body: (
        <div className="paper my-3 text-base leading-relaxed">
          <p className="text-xs font-bold mb-1">
            {cat.icon} A {cat.name} fortune for {seeker}
          </p>
          {fortune.lines.map((l, i) => (
            <p key={i} className="mb-1">
              {l}
            </p>
          ))}
          <p className="text-xs muted mt-2">
            {fortune.sign.emoji} {fortune.born ? 'Born under' : 'The spirits cast your chart:'}{' '}
            {fortune.sign.sign}, ruled by {fortune.sign.planet} · ✨ Spirit number{' '}
            {fortune.spirit} · Lucky number {fortune.lucky} · The notebook has spoken! 📓
          </p>
        </div>
      )
    });
  };

  if (stage === 'pick') {
    return (
      <div>
        <PaperPanel>
          <div className="text-center mb-3">
            <div className="animate-pulse" style={{ fontSize: '44px' }}>
              🔮
            </div>
            <h3 className="font-bold text-lg">The spirits are listening…</h3>
            <p className="muted text-xs">
              A fortune for <b>{seeker}</b>. Choose what you wish to know, and the ancient MASH
              count will reveal it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FORTUNE_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => chooseCategory(c)}
                className="rounded-2xl cursor-pointer text-left"
                style={{
                  padding: '12px',
                  border: '1px solid #7c5cbf',
                  background: 'linear-gradient(160deg, #241247, #3b1d6e)',
                  color: '#efe8ff',
                  boxShadow: '0 4px 14px rgba(59,29,110,.35)'
                }}
              >
                <div style={{ fontSize: '26px' }}>{c.icon}</div>
                <div className="font-bold" style={{ fontSize: '16px' }}>
                  {c.name}
                </div>
                <div className="text-xs" style={{ color: '#c9b3f5' }}>
                  {c.tagline}
                </div>
              </button>
            ))}
          </div>
          <p className="muted text-center mt-3 text-xs">
            ✨ Love · Work · Money · Kids · Home · Travel · Luck ✨
          </p>
        </PaperPanel>
      </div>
    );
  }

  if (stage === 'blanks' && cat) {
    return (
      <div>
        <PaperPanel>
          <button
            onClick={() => {
              Sound.click();
              setStage('pick');
            }}
            className="btn secondary small"
          >
            ← Choose another category
          </button>
          <div className="text-center my-3">
            <div style={{ fontSize: '38px' }}>{cat.icon}</div>
            <h3 className="font-bold text-lg">{cat.name} Fortune</h3>
            <p className="muted text-xs">
              The spirits need three truths from you. Leave one empty and they will fill the
              silence themselves…
            </p>
          </div>

          <div className="mb-2">
            <label className="text-xs font-bold text-[#17457e] block">
              🎂 Your birthday — the spirits read your stars
            </label>
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              className="w-full bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
            />
          </div>

          {cat.blanks.map(b => (
            <div key={b.key} className="mb-2">
              <label className="text-xs font-bold text-[#17457e] block">{b.label}</label>
              <input
                value={values[b.key] || ''}
                onChange={e => setValues(prev => ({ ...prev, [b.key]: e.target.value }))}
                placeholder={b.def}
                className="w-full bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
              />
            </div>
          ))}

          {cat.special && (
            <p className="text-xs text-center my-3" style={{ color: '#5b21b6' }}>
              🏠 {cat.special.label}: Mansion · Apartment · Shack · House
            </p>
          )}

          <button onClick={consult} className="btn">
            🔮 Consult the spirits
          </button>
        </PaperPanel>
      </div>
    );
  }

  // reveal
  if (cat && fortune) {
    const done = shown >= fortune.lines.length;
    return (
      <div>
        <div
          className="rounded-3xl text-center"
          style={{
            padding: '22px 18px',
            background:
              'radial-gradient(circle at 50% 0%, #4c2a85 0%, #241247 55%, #150a2e 100%)',
            color: '#efe8ff',
            border: '1px solid #a98fe0',
            boxShadow: '0 10px 34px rgba(21,10,46,.5)'
          }}
        >
          <div className="animate-pulse" style={{ fontSize: '52px' }}>
            🔮
          </div>
          <p style={{ color: '#c9b3f5', letterSpacing: '3px', fontSize: '11px' }}>
            {cat.icon} THE {cat.name.toUpperCase()} FORTUNE OF {seeker.toUpperCase()} {cat.icon}
          </p>
          <p style={{ color: '#e9dcff', fontSize: '12px', marginTop: '4px' }}>
            {fortune.sign.emoji}{' '}
            {fortune.born ? 'Born under' : 'The spirits cast your chart:'} {fortune.sign.sign} ·
            ruled by {fortune.sign.planet} · {fortune.sign.element} spirit
          </p>
          <div className="my-4" style={{ minHeight: '230px' }}>
            {shown === 0 && (
              <p className="animate-pulse" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                The mists are parting… ✨ 🌙 ✨
              </p>
            )}
            {fortune.lines.slice(0, shown).map((l, i) => (
              <p
                key={i}
                className="mb-2"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16px' }}
              >
                {l}
              </p>
            ))}
          </div>
          {done && (
            <>
              <p className="text-xs mb-3" style={{ color: '#c9b3f5' }}>
                ✨ Spirit number {fortune.spirit} · Lucky number {fortune.lucky} ✨
              </p>
              <button onClick={seal} className="btn mb-2">
                ✨ Seal my fortune
              </button>
              <button
                onClick={() => {
                  Sound.click();
                  setStage('pick');
                  setFortune(null);
                }}
                className="btn secondary small"
              >
                🔮 Ask about another category
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};
