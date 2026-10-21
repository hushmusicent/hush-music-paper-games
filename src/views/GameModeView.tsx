import React, { useState } from 'react';
import { GameId, GameMode } from '../types';
import { GAMES_METADATA } from '../data/games';
import { Logic, sproutsStartDots, simPositions, SimShape } from '../utils/logic';
import { HANG_LEVELS } from '../data/words';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface GameModeViewProps {
  gameId: GameId;
  onBack: () => void;
  onSelectMode: (mode: GameMode, playersCount?: number) => void;
  onBrowseRooms: () => void;
  onOnlineLobby: () => void;
  onDotsLevel?: (level: number) => void;
  onHangLevel?: (level: number) => void;
  onSproutsDots?: (dots: number) => void;
  onSimSetup?: (dots: number, shape: SimShape) => void;
}

const LEVEL_KEY = 'pg_dots_level';
const HANG_LEVEL_KEY = 'pg_hang_level';
const SPR_DOTS_KEY = 'pg_sprouts_dots';
const SIM_DOTS_KEY = 'pg_sim_dots';
const SIM_SHAPE_KEY = 'pg_sim_shape';

function savedLevel(): number {
  try {
    const v = parseInt(localStorage.getItem(LEVEL_KEY) || '1', 10);
    return v >= 1 && v <= 50 ? v : 1;
  } catch (e) {
    return 1;
  }
}

function savedSimDots(): number {
  try {
    const v = parseInt(localStorage.getItem(SIM_DOTS_KEY) || '6', 10);
    return v >= 6 && v <= 10 ? v : 6;
  } catch (e) {
    return 6;
  }
}

function savedSimShape(): SimShape {
  try {
    const v = localStorage.getItem(SIM_SHAPE_KEY);
    return v === 'grid' || v === 'scatter' ? v : 'ring';
  } catch (e) {
    return 'ring';
  }
}

function savedSprDots(): number {
  try {
    const v = parseInt(localStorage.getItem(SPR_DOTS_KEY) || '3', 10);
    return v >= 3 && v <= 20 ? v : 3;
  } catch (e) {
    return 3;
  }
}

function savedHangLevel(): number {
  try {
    const v = parseInt(localStorage.getItem(HANG_LEVEL_KEY) || '1', 10);
    return v >= 1 && v <= 10 ? v : 1;
  } catch (e) {
    return 1;
  }
}

export const GameModeView: React.FC<GameModeViewProps> = ({
  gameId,
  onBack,
  onSelectMode,
  onBrowseRooms,
  onOnlineLobby,
  onDotsLevel,
  onHangLevel,
  onSproutsDots,
  onSimSetup
}) => {
  const g = GAMES_METADATA[gameId];
  const [pmin, pmax] = g.p;
  const isDots = gameId === 'dots';
  const isHang = gameId === 'hangman';
  const isSpr = gameId === 'sprouts';
  const isSim = gameId === 'sim';

  // Dots and Boxes only: mode first, then a level selection screen,
  // and only then does the game start (level picked BEFORE play).
  const [step, setStep] = useState<'mode' | 'level'>('mode');
  const [pendingMode, setPendingMode] = useState<GameMode>('pvc');
  const [level, setLevel] = useState<number>(() => savedLevel());
  const [hangLevel, setHangLevel] = useState<number>(() => savedHangLevel());
  const [sprDots, setSprDots] = useState<number>(() => savedSprDots());
  const [simDots, setSimDots] = useState<number>(() => savedSimDots());
  const [simShape, setSimShape] = useState<SimShape>(() => savedSimShape());

  const chooseMode = (mode: GameMode) => {
    Sound.click();
    if (isDots || isHang || isSpr || isSim) {
      setPendingMode(mode);
      setStep('level');
      return;
    }
    if (mode === 'hotseat') onSelectMode('hotseat', pmax);
    else onSelectMode(mode);
  };

  const startSim = () => {
    try {
      localStorage.setItem(SIM_DOTS_KEY, String(simDots));
      localStorage.setItem(SIM_SHAPE_KEY, simShape);
    } catch (e) {}
    if (onSimSetup) onSimSetup(simDots, simShape);
    Sound.click();
    if (pendingMode === 'hotseat') onSelectMode('hotseat', pmax);
    else onSelectMode(pendingMode);
  };

  const startSpr = () => {
    try {
      localStorage.setItem(SPR_DOTS_KEY, String(sprDots));
    } catch (e) {}
    if (onSproutsDots) onSproutsDots(sprDots);
    Sound.click();
    if (pendingMode === 'hotseat') onSelectMode('hotseat', pmax);
    else onSelectMode(pendingMode);
  };

  const startHang = () => {
    try {
      localStorage.setItem(HANG_LEVEL_KEY, String(hangLevel));
    } catch (e) {}
    if (onHangLevel) onHangLevel(hangLevel);
    Sound.click();
    if (pendingMode === 'hotseat') onSelectMode('hotseat', pmax);
    else onSelectMode(pendingMode);
  };

  const startDots = () => {
    try {
      localStorage.setItem(LEVEL_KEY, String(level));
    } catch (e) {}
    if (onDotsLevel) onDotsLevel(level);
    Sound.click();
    if (pendingMode === 'hotseat') onSelectMode('hotseat', pmax);
    else onSelectMode(pendingMode);
  };

  if (isSim && step === 'level') {
    const preview = simPositions(simDots, simShape);
    const shapeLabel = simShape === 'ring' ? 'Ring' : simShape === 'grid' ? 'Grid' : 'Scatter';
    const shapeBtn = (id: SimShape, label: string) => {
      const sel = simShape === id;
      return (
        <button
          key={id}
          onClick={() => {
            setSimShape(id);
            Sound.click();
          }}
          className="rounded-lg font-bold cursor-pointer flex-1"
          style={{
            padding: '10px 0',
            fontSize: '14px',
            border: sel ? '2px solid #1c64d8' : '1px solid #b9c8de',
            background: sel ? '#1c64d8' : '#ffffff',
            color: sel ? '#ffffff' : '#22304a'
          }}
        >
          {label}
        </button>
      );
    };
    return (
      <div className="space-y-3">
        <button
          onClick={() => {
            Sound.click();
            setStep('mode');
          }}
          className="btn secondary small"
        >
          ← Change mode
        </button>

        <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
          <span>{g.icon}</span>
          <span>{g.name} — set up your board</span>
        </h2>

        <PaperPanel>
          <h3
            className="text-center font-black tracking-wide text-[#22304a]"
            style={{ fontSize: '22px', letterSpacing: '2px' }}
          >
            SIM
          </h3>
          <p className="text-center text-xs text-[#5a6a86] mb-3">
            {pendingMode === 'pvc' ? '🤖 Vs Computer' : '👥 Pass &amp; Play'} · Pick 6 to 10
            dots and a board shape.
          </p>

          <p className="text-xs font-bold text-[#5a6a86] mb-1">DOTS</p>
          <div className="flex gap-1.5 mb-3">
            {[6, 7, 8, 9, 10].map(n => {
              const sel = n === simDots;
              return (
                <button
                  key={n}
                  onClick={() => {
                    setSimDots(n);
                    Sound.click();
                  }}
                  className="rounded-lg font-bold cursor-pointer flex-1"
                  style={{
                    padding: '9px 0',
                    fontSize: '14px',
                    border: sel ? '2px solid #1c64d8' : '1px solid #b9c8de',
                    background: sel ? '#1c64d8' : '#ffffff',
                    color: sel ? '#ffffff' : '#22304a'
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-bold text-[#5a6a86] mb-1">BOARD SHAPE</p>
          <div className="flex gap-1.5 mb-3">
            {shapeBtn('ring', '⬡ Ring')}
            {shapeBtn('grid', '▦ Grid')}
            {shapeBtn('scatter', '✦ Scatter')}
          </div>

          <div className="text-center mb-2">
            <span className="chip">
              ⬡ {simDots} dots · {shapeLabel} · {(simDots * (simDots - 1)) / 2} possible lines
            </span>
          </div>

          <div className="flex justify-center mb-3">
            <svg width={210} height={182} viewBox="0 0 300 260">
              {preview.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={8} fill="#fffdf4" stroke="#22304a" strokeWidth={2} />
              ))}
            </svg>
          </div>

          <button onClick={startSim} className="btn">
            ▶ Start · {simDots} dots · {shapeLabel}
          </button>
          <p className="muted text-center mt-2 text-xs">
            Draw lines in your color — complete a triangle in YOUR color and you lose!
          </p>
        </PaperPanel>
      </div>
    );
  }

  if (isSpr && step === 'level') {
    const preview = sproutsStartDots(sprDots);
    return (
      <div className="space-y-3">
        <button
          onClick={() => {
            Sound.click();
            setStep('mode');
          }}
          className="btn secondary small"
        >
          ← Change mode
        </button>

        <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
          <span>{g.icon}</span>
          <span>{g.name} — how many dots?</span>
        </h2>

        <PaperPanel>
          <h3
            className="text-center font-black tracking-wide text-[#22304a]"
            style={{ fontSize: '22px', letterSpacing: '2px' }}
          >
            SPROUTS
          </h3>
          <p className="text-center text-xs text-[#5a6a86] mb-3">
            {pendingMode === 'pvc' ? '🤖 Vs Computer' : '👥 Pass &amp; Play'} · Pick 3 to 20
            starting dots. More dots = a longer, twistier game.
          </p>

          <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {Array.from({ length: 18 }).map((_, i) => {
              const n = i + 3;
              const sel = n === sprDots;
              return (
                <button
                  key={n}
                  onClick={() => {
                    setSprDots(n);
                    Sound.click();
                  }}
                  className="rounded-lg font-bold cursor-pointer"
                  style={{
                    padding: '9px 0',
                    fontSize: '14px',
                    border: sel ? '2px solid #1c64d8' : '1px solid #b9c8de',
                    background: sel ? '#1c64d8' : '#ffffff',
                    color: sel ? '#ffffff' : '#22304a'
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="text-center mb-2">
            <span className="chip">🌱 {sprDots} starting dots</span>
          </div>

          <div className="flex justify-center mb-3">
            <svg width={210} height={182} viewBox="0 0 300 260">
              {preview.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={7} fill="#fffdf4" stroke="#22304a" strokeWidth={2} />
              ))}
            </svg>
          </div>

          <button onClick={startSpr} className="btn">
            ▶ Start with {sprDots} dots
          </button>
          <p className="muted text-center mt-2 text-xs">
            Draw a line between two dots (or loop back to the same dot) and add a new dot on
            it. No crossing lines, max 3 lines per dot!
          </p>
        </PaperPanel>
      </div>
    );
  }

  if (isHang && step === 'level') {
    const bank = HANG_LEVELS[hangLevel - 1];
    const minLen = Math.min(...bank.map(w => w.length));
    const maxLen = Math.max(...bank.map(w => w.length));
    return (
      <div className="space-y-3">
        <button
          onClick={() => {
            Sound.click();
            setStep('mode');
          }}
          className="btn secondary small"
        >
          ← Change mode
        </button>

        <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
          <span>{g.icon}</span>
          <span>{g.name} — choose your level</span>
        </h2>

        <PaperPanel>
          <h3
            className="text-center font-black tracking-wide text-[#22304a]"
            style={{ fontSize: '22px', letterSpacing: '2px' }}
          >
            HANGMAN
          </h3>
          <p className="text-center text-xs text-[#5a6a86] mb-3">
            {pendingMode === 'pvc' ? '🤖 Vs Computer' : '👥 Pass &amp; Play'} · 3,000 words in
            10 levels — 300 words in every level. Higher level = longer, harder words.
          </p>

          <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const lv = i + 1;
              const sel = lv === hangLevel;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setHangLevel(lv);
                    Sound.click();
                  }}
                  className="rounded-lg font-bold cursor-pointer"
                  style={{
                    padding: '12px 0',
                    fontSize: '16px',
                    border: sel ? '2px solid #1c64d8' : '1px solid #b9c8de',
                    background: sel ? '#1c64d8' : '#ffffff',
                    color: sel ? '#ffffff' : '#22304a'
                  }}
                >
                  {lv}
                </button>
              );
            })}
          </div>

          <div className="text-center mb-3">
            <span className="chip">
              Level {hangLevel} · 300 words ·{' '}
              {minLen === maxLen ? `${minLen} letters` : `${minLen}–${maxLen} letters`}
            </span>
          </div>

          <button onClick={startHang} className="btn">
            ▶ Start Level {hangLevel}
          </button>
          <p className="muted text-center mt-2 text-xs">
            Guess the word letter by letter — 6 wrong guesses and the hangman is complete!
          </p>
        </PaperPanel>
      </div>
    );
  }

  if (isDots && step === 'level') {
    const sz = Logic.dotsSizeForLevel(level);
    const dotsCols = sz.w + 1;
    const dotsRows = sz.h + 1;
    return (
      <div className="space-y-3">
        <button
          onClick={() => {
            Sound.click();
            setStep('mode');
          }}
          className="btn secondary small"
        >
          ← Change mode
        </button>

        <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
          <span>{g.icon}</span>
          <span>{g.name} — choose your level</span>
        </h2>

        <PaperPanel>
          <h3
            className="text-center font-black tracking-wide text-[#22304a]"
            style={{ fontSize: '22px', letterSpacing: '2px' }}
          >
            DOTS &amp; BOXES
          </h3>
          <p className="text-center text-xs text-[#5a6a86] mb-3">
            {pendingMode === 'pvc' ? '🤖 Vs Computer' : '👥 Pass &amp; Play'} · Higher level = a
            bigger sheet of dots — every level has more dots than the one before it. Level 1 starts at 2×2 boxes (9 dots), Level 50 tops out at 14×14 boxes (225 dots).
          </p>

          <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {Array.from({ length: 50 }).map((_, i) => {
              const lv = i + 1;
              const sel = lv === level;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setLevel(lv);
                    Sound.click();
                  }}
                  className="rounded-lg font-bold cursor-pointer"
                  style={{
                    padding: '7px 0',
                    fontSize: '13px',
                    border: sel ? '2px solid #1c64d8' : '1px solid #b9c8de',
                    background: sel ? '#1c64d8' : '#ffffff',
                    color: sel ? '#ffffff' : '#22304a'
                  }}
                >
                  {lv}
                </button>
              );
            })}
          </div>

          <div className="text-center mb-3">
            <span className="chip">
              Level {level} · {sz.w}×{sz.h} boxes · {dotsCols}×{dotsRows} dots ({sz.dots} dots)
            </span>
          </div>

          <div className="flex justify-center mb-3">
            <svg
              width={dotsCols * 14}
              height={dotsRows * 14}
              viewBox={`0 0 ${dotsCols * 14} ${dotsRows * 14}`}
              style={{ maxWidth: '230px', height: 'auto' }}
            >
              {Array.from({ length: dotsRows }).map((_, r) =>
                Array.from({ length: dotsCols }).map((__, c) => (
                  <circle key={`${r}-${c}`} cx={7 + c * 14} cy={7 + r * 14} r={2.4} fill="#111" />
                ))
              )}
            </svg>
          </div>

          <button onClick={startDots} className="btn">
            ▶ Start Level {level}
          </button>
          <p className="muted text-center mt-2 text-xs">
            Tap a gap between 2 dots to draw a line. Complete the fourth side of a box to claim
            it with your mark — and go again!
          </p>
        </PaperPanel>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="btn secondary small">
        ← All games
      </button>

      <h2 className="text-xl font-bold text-[var(--ink2)] flex items-center gap-2">
        <span>{g.icon}</span>
        <span>{g.name}</span>
      </h2>

      <PaperPanel>
        <h3 className="font-bold text-base mb-1">📖 How to play — official rules</h3>
        <p className="text-sm leading-relaxed text-[#22304a]">{g.rules}</p>
      </PaperPanel>

      <div className="card space-y-2">
        <h3 className="font-bold text-base mb-2">How do you want to play?</h3>
        <button
          onClick={() => chooseMode('pvc')}
          className="btn"
        >
          🤖 Vs Computer
        </button>
        <button
          onClick={() => chooseMode('hotseat')}
          className="btn secondary"
        >
          👥 Pass &amp; Play ({pmin}–{pmax} players, one phone)
        </button>
        <button
          onClick={() => {
            Sound.click();
            onOnlineLobby();
          }}
          className="btn secondary"
        >
          🌐 Online PvP (room code)
        </button>
        <button
          onClick={() => {
            Sound.click();
            onBrowseRooms();
          }}
          className="btn secondary"
        >
          🚪 Browse open rooms
        </button>
      </div>
    </div>
  );
};
