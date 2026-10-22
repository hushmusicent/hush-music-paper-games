import React, { useEffect, useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { WS_PUZZLES, WSPuzzle } from '../data/wordsearch';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface WordSearchGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

const DONE_KEY = 'pg_ws_done_v1';
const PAGE = 100;

const TIERS = [
  { name: 'Beginner', dirs: 'Across & down only' },
  { name: 'Easy', dirs: 'Adds diagonals ↘' },
  { name: 'Casual', dirs: 'Adds backwards across ←' },
  { name: 'Medium', dirs: 'Adds backwards down ↑' },
  { name: 'Tricky', dirs: 'Adds diagonal ↙' },
  { name: 'Hard', dirs: 'Adds diagonal ↖' },
  { name: 'Expert', dirs: 'All 8 directions' },
  { name: 'Master', dirs: 'All 8 directions, bigger grid' },
  { name: 'Grandmaster', dirs: 'All 8 directions, bigger grid' },
  { name: 'Ultimate', dirs: 'All 8 directions · #1000 finale hides 100 words' }
];

const tierOf = (id: number) => Math.floor((id - 1) / 100);

const loadDone = (): Set<number> => {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch (e) {
    /* ignore */
  }
  return new Set();
};

const saveDone = (done: Set<number>) => {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
  } catch (e) {
    /* ignore */
  }
};

const findCells = (pz: WSPuzzle, w: string): [number, number][] | null => {
  const n = pz.size;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const [dr, dc] of [
        [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [1, -1], [-1, 1], [-1, -1]
      ]) {
        const r1 = r + dr * (w.length - 1);
        const c1 = c + dc * (w.length - 1);
        if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
        let ok = true;
        for (let i = 0; i < w.length; i++) {
          if (pz.grid[r + dr * i][c + dc * i] !== w[i]) {
            ok = false;
            break;
          }
        }
        if (ok) {
          const cells: [number, number][] = [];
          for (let i = 0; i < w.length; i++) cells.push([r + dr * i, c + dc * i]);
          return cells;
        }
      }
    }
  }
  return null;
};

export const WordSearchGame: React.FC<WordSearchGameProps> = ({ onFinish }) => {
  const [done, setDone] = useState<Set<number>>(() => loadDone());
  const [puzzleIdx, setPuzzleIdx] = useState<number>(-1);
  const [page, setPage] = useState(0);
  const [jump, setJump] = useState('');
  const [found, setFound] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [over, setOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pz: WSPuzzle | null = puzzleIdx >= 0 ? WS_PUZZLES[puzzleIdx] : null;

  useEffect(() => {
    if (!pz || over) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [pz, over]);

  const startPuzzle = (idx: number) => {
    Sound.click();
    setPuzzleIdx(idx);
    setFound([]);
    setFoundCells({});
    setSel(null);
    setElapsed(0);
    setOver(false);
    setErrorMsg('');
  };

  const finishPuzzle = (idx: number, secs: number) => {
    const next = new Set(done);
    next.add(idx);
    setDone(next);
    saveDone(next);
    setOver(true);
    const p = WS_PUZZLES[idx];
    setTimeout(() => {
      onFinish({
        winner: 0,
        result: 'w',
        title: `🔎 Word Search #${idx + 1} cleared! 🎉`,
        body: (
          <div className="paper my-2">
            <p>
              All {p.words.length} words found in {secs}s on the {p.size}×{p.size} grid —
              that is <b>{next.size} of {WS_PUZZLES.length}</b> puzzles done on your
              checklist. ✔️
            </p>
          </div>
        )
      });
    }, 500);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!pz || over) return;
    setErrorMsg('');
    if (!sel) {
      Sound.click();
      setSel([r, c]);
      return;
    }
    const [r1, c1] = sel;
    if (r1 === r && c1 === c) {
      setSel(null);
      return;
    }
    const dr = Math.sign(r - r1);
    const dc = Math.sign(c - c1);
    const len = Math.max(Math.abs(r - r1), Math.abs(c - c1)) + 1;
    const straight =
      (r === r1 || c === c1 || Math.abs(r - r1) === Math.abs(c - c1)) && len >= 3;
    if (straight) {
      const cells: [number, number][] = [];
      let word = '';
      for (let i = 0; i < len; i++) {
        const rr = r1 + dr * i;
        const cc = c1 + dc * i;
        cells.push([rr, cc]);
        word += pz.grid[rr][cc];
      }
      const rev = word.split('').reverse().join('');
      const hit = [word, rev].find(w => pz.words.includes(w) && !found.includes(w));
      if (hit) {
        Sound.win();
        const nextFound = [...found, hit];
        const nextCells = { ...foundCells };
        cells.forEach(([rr, cc]) => {
          nextCells[`${rr},${cc}`] = true;
        });
        setFound(nextFound);
        setFoundCells(nextCells);
        setSel(null);
        if (nextFound.length >= pz.words.length) finishPuzzle(puzzleIdx, elapsed);
        return;
      }
    }
    Sound.beep(300, 0.08, 'square');
    setSel(null);
    setErrorMsg('Not a hidden word — try again.');
  };

  const handleReveal = () => {
    if (!pz) return;
    Sound.click();
    const allCells: Record<string, boolean> = { ...foundCells };
    pz.words.forEach(w => {
      const cells = findCells(pz, w);
      if (cells) {
        cells.forEach(([rr, cc]) => {
          allCells[`${rr},${cc}`] = true;
        });
      }
    });
    setFoundCells(allCells);
    setFound([...pz.words]);
    setOver(true);
    setTimeout(() => {
      onFinish({
        winner: -1,
        result: 't',
        pts: 0,
        title: '👀 Words revealed',
        body: (
          <div className="paper my-2">
            <p>
              Every hidden word is lit up, so this one does <b>not</b> count on your
              checklist. Pick it from the list and clear it fair and square!
            </p>
          </div>
        )
      });
    }, 700);
  };

  /* ---------- checklist screen ---------- */
  if (!pz) {
    const pages = Math.ceil(WS_PUZZLES.length / PAGE);
    const start = page * PAGE;
    const slice = WS_PUZZLES.slice(start, start + PAGE);
    const pageTier = TIERS[Math.min(page, TIERS.length - 1)];
    const sample = slice[0];
    const nextUnfinished = WS_PUZZLES.findIndex(p => !done.has(p.id - 1));
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-1">🔎 Word Search Checklist</h3>
        <p className="text-sm muted mb-2">
          <b>{done.size}</b> of <b>{WS_PUZZLES.length}</b> puzzles cleared. Every 100
          puzzles the grid gets bigger and the words hide in sneakier directions. Finished
          puzzles get a ✔️ — saved on this device.
        </p>
        <div
          className="mb-3"
          style={{ height: '10px', background: '#dbe7f5', borderRadius: '6px', overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${(done.size / WS_PUZZLES.length) * 100}%`,
              background: '#2f9e44',
              transition: 'width 0.4s'
            }}
          />
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={jump}
            onChange={e => setJump(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Puzzle # (1–1000)"
            inputMode="numeric"
            className="flex-1 bg-white/70 border border-[#9db9dc] rounded-xl px-3 py-2 text-sm"
          />
          <button
            className="btn small !m-0"
            onClick={() => {
              const n = parseInt(jump, 10);
              if (n >= 1 && n <= WS_PUZZLES.length) startPuzzle(n - 1);
            }}
          >
            Go
          </button>
          {nextUnfinished >= 0 && (
            <button className="btn small secondary !m-0" onClick={() => startPuzzle(nextUnfinished)}>
              ▶ Next unfinished
            </button>
          )}
        </div>
        <p className="text-sm mb-2">
          <b>
            Tier {page + 1} · {pageTier.name}
          </b>{' '}
          <span className="muted">
            — {sample.size}×{sample.size} grid · {sample.words.length} words · {pageTier.dirs}
          </span>
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '4px',
            marginBottom: '10px'
          }}
        >
          {slice.map(p => {
            const isDone = done.has(p.id - 1);
            return (
              <button
                key={p.id}
                onClick={() => startPuzzle(p.id - 1)}
                style={{
                  padding: '6px 0',
                  fontSize: '11px',
                  borderRadius: '8px',
                  border: '1px solid #9db9dc',
                  background: isDone ? '#2f9e44' : '#ffffff',
                  color: isDone ? '#fff' : '#17457e',
                  fontWeight: 700
                }}
              >
                {p.id}
                {isDone ? ' ✔' : ''}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-center">
          <button
            className="btn small secondary !m-0"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            ← Prev tier
          </button>
          <span className="text-xs muted">
            Tier {page + 1} of {pages}
          </span>
          <button
            className="btn small secondary !m-0"
            disabled={page >= pages - 1}
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
          >
            Next tier →
          </button>
        </div>
      </PaperPanel>
    );
  }

  /* ---------- play screen ---------- */
  const tier = TIERS[tierOf(pz.id)];
  const fontSize =
    pz.size >= 40 ? 7.5 :
    pz.size >= 36 ? 8 :
    pz.size >= 32 ? 8.5 :
    pz.size >= 28 ? 9.5 :
    pz.size >= 25 ? 10.5 :
    pz.size >= 22 ? 11 :
    pz.size >= 20 ? 12 :
    pz.size >= 18 ? 13 :
    pz.size >= 16 ? 14 :
    pz.size >= 14 ? 15 : 16;
  return (
    <div>
      <PaperPanel>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[#17457e]">
            🔎 #{pz.id} · {pz.size}×{pz.size}{' '}
            <span className="muted text-xs">
              Tier {tierOf(pz.id) + 1} {tier.name} · {tier.dirs}
            </span>
          </h3>
          <div className="font-bold text-[#17457e] bg-blue-100 px-3 py-1 rounded-full text-sm">
            ⏱️ {elapsed}s
          </div>
        </div>

        {errorMsg && <div className="err text-xs text-center">{errorMsg}</div>}

        <div
          className="wsgrid"
          style={{
            gridTemplateColumns: `repeat(${pz.size}, 1fr)`,
            fontSize: `${fontSize}px`
          }}
        >
          {pz.grid.map((row, r) =>
            row.split('').map((char, c) => {
              const key = `${r},${c}`;
              const isFound = foundCells[key];
              const isSelected = sel && sel[0] === r && sel[1] === c;
              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(r, c)}
                  className={`wscell ${isFound ? 'found' : ''} ${isSelected ? 'sel' : ''}`}
                >
                  {char}
                </div>
              );
            })
          )}
        </div>

        <div className="my-3 flex flex-wrap justify-center gap-1">
          {pz.words.map(w => (
            <span key={w} className={`chip ${found.includes(w) ? 'done' : ''}`}>
              {w}
            </span>
          ))}
        </div>

        <p className="muted text-xs text-center mb-3">
          {sel
            ? 'First letter picked — now tap the LAST letter of the word.'
            : `Tap the first letter of a hidden word. ${found.length}/${pz.words.length} found.`}
        </p>

        <div className="space-y-2">
          <button onClick={handleReveal} className="btn secondary">
            👀 Reveal all words (no checklist credit)
          </button>
          <button
            onClick={() => {
              Sound.click();
              setPuzzleIdx(-1);
            }}
            className="btn secondary"
          >
            🗂️ Back to checklist
          </button>
        </div>
      </PaperPanel>
    </div>
  );
};
