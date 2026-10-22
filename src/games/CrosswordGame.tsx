import React, { useMemo, useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { CW_PUZZLES, CWPuzzle } from '../data/crosswords';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface CrosswordGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

const DONE_KEY = 'pg_cw_done_v1';
const PAGE = 100;

// 10 tiers of 100: the grids and the clue counts grow every tier.
const CW_TIERS: { name: string; size: number }[] = [
  { name: 'Starter', size: 8 },
  { name: 'Easy', size: 9 },
  { name: 'Casual', size: 10 },
  { name: 'Medium', size: 11 },
  { name: 'Tricky', size: 12 },
  { name: 'Hard', size: 13 },
  { name: 'Expert', size: 14 },
  { name: 'Master', size: 15 },
  { name: 'Grandmaster', size: 16 },
  { name: 'Championship', size: 17 }
];
const tierOfCw = (id: number) => Math.min(9, Math.floor((id - 1) / 100));

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

interface BuiltPuzzle {
  size: number;
  nums: Record<string, number>;
  cellEntry: Record<string, { A?: number; D?: number }>; // cellKey -> entry index per dir
}

const buildPuzzle = (pz: CWPuzzle): BuiltPuzzle => {
  const nums: Record<string, number> = {};
  const cellEntry: Record<string, { A?: number; D?: number }> = {};
  pz.entries.forEach((e, ei) => {
    nums[`${e.r},${e.c}`] = e.num;
    const dr = e.dir === 'D' ? 1 : 0;
    const dc = e.dir === 'A' ? 1 : 0;
    for (let i = 0; i < e.word.length; i++) {
      const key = `${e.r + dr * i},${e.c + dc * i}`;
      if (!cellEntry[key]) cellEntry[key] = {};
      cellEntry[key][e.dir] = ei;
    }
  });
  return { size: pz.size, nums, cellEntry };
};

export const CrosswordGame: React.FC<CrosswordGameProps> = ({ onFinish }) => {
  const [done, setDone] = useState<Set<number>>(() => loadDone());
  const [puzzleIdx, setPuzzleIdx] = useState<number>(-1);
  const [page, setPage] = useState(0);
  const [jump, setJump] = useState('');
  const [cells, setCells] = useState<Record<string, string>>({});
  const [cellStatus, setCellStatus] = useState<Record<string, 'ok' | 'bad'>>({});
  const [sel, setSel] = useState<{ r: number; c: number; dir: 'A' | 'D' } | null>(null);
  const [msg, setMsg] = useState('');

  const pz: CWPuzzle | null = puzzleIdx >= 0 ? CW_PUZZLES[puzzleIdx] : null;
  const built = useMemo(() => (pz ? buildPuzzle(pz) : null), [pz]);

  const startPuzzle = (idx: number) => {
    Sound.click();
    setPuzzleIdx(idx);
    setCells({});
    setCellStatus({});
    setSel(null);
    setMsg('');
  };

  const checkCompleted = (curCells: Record<string, string>, p: CWPuzzle) => {
    for (const e of p.entries) {
      const dr = e.dir === 'D' ? 1 : 0;
      const dc = e.dir === 'A' ? 1 : 0;
      for (let i = 0; i < e.word.length; i++) {
        if ((curCells[`${e.r + dr * i},${e.c + dc * i}`] || '') !== e.word[i]) return false;
      }
    }
    return true;
  };

  const finishPuzzle = (idx: number) => {
    const next = new Set(done);
    next.add(idx);
    setDone(next);
    saveDone(next);
    Sound.win();
    setTimeout(() => {
      onFinish({
        winner: 0,
        result: 'w',
        title: `📰 Crossword #${idx + 1} completed! 🎉`,
        body: (
          <div className="paper my-2">
            <p>
              Every answer correct — that is <b>{next.size} of {CW_PUZZLES.length}</b> puzzles
              done on your checklist. ✔️
            </p>
          </div>
        )
      });
    }, 500);
  };

  const focusCell = (r: number, c: number) => {
    const el = document.querySelector(
      `input[data-cw="${r},${c}"]`
    ) as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleCellTap = (r: number, c: number) => {
    if (!built) return;
    const key = `${r},${c}`;
    const ce = built.cellEntry[key] || {};
    setSel(prev => {
      if (prev && prev.r === r && prev.c === c) {
        const other = prev.dir === 'A' ? 'D' : 'A';
        if (ce[other] !== undefined) return { r, c, dir: other };
        return prev;
      }
      const dir = ce.A !== undefined ? 'A' : 'D';
      return { r, c, dir };
    });
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (!pz || !built) return;
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const key = `${r},${c}`;
    const nextCells = { ...cells, [key]: char };
    setCells(nextCells);
    if (cellStatus[key]) {
      const ns = { ...cellStatus };
      delete ns[key];
      setCellStatus(ns);
    }
    // selection follows the typed cell; advance along the current word
    const ce = built.cellEntry[key] || {};
    const dir: 'A' | 'D' =
      sel && sel.r === r && sel.c === c ? sel.dir : ce.A !== undefined ? 'A' : 'D';
    setSel({ r, c, dir });
    if (char) {
      const ei = ce[dir];
      if (ei !== undefined) {
        const e = pz.entries[ei];
        const dr = e.dir === 'D' ? 1 : 0;
        const dc = e.dir === 'A' ? 1 : 0;
        const pos = dir === 'A' ? c - e.c : r - e.r;
        if (pos < e.word.length - 1) focusCell(r + dr, c + dc);
      }
    }
    if (checkCompleted(nextCells, pz)) finishPuzzle(puzzleIdx);
  };

  const handleCheck = () => {
    if (!pz) return;
    Sound.click();
    let right = 0;
    let wrong = 0;
    const ns: Record<string, 'ok' | 'bad'> = {};
    for (const e of pz.entries) {
      const dr = e.dir === 'D' ? 1 : 0;
      const dc = e.dir === 'A' ? 1 : 0;
      for (let i = 0; i < e.word.length; i++) {
        const key = `${e.r + dr * i},${e.c + dc * i}`;
        const v = (cells[key] || '').toUpperCase();
        if (!v) continue;
        if (v === e.word[i]) {
          ns[key] = 'ok';
          right++;
        } else {
          ns[key] = 'bad';
          wrong++;
        }
      }
    }
    setCellStatus(ns);
    setMsg(`✔️ Check: ${right} right, ${wrong} wrong.`);
  };

  const handleReveal = () => {
    if (!pz) return;
    Sound.click();
    const full: Record<string, string> = {};
    for (const e of pz.entries) {
      const dr = e.dir === 'D' ? 1 : 0;
      const dc = e.dir === 'A' ? 1 : 0;
      for (let i = 0; i < e.word.length; i++) {
        full[`${e.r + dr * i},${e.c + dc * i}`] = e.word[i];
      }
    }
    setCells(full);
    setTimeout(() => {
      onFinish({
        winner: -1,
        result: 't',
        pts: 0,
        title: '👀 Answers revealed',
        body: (
          <div className="paper my-2">
            <p>
              The solution is on the board, so this one does <b>not</b> count on your
              checklist. Pick it from the list and beat it fair and square!
            </p>
          </div>
        )
      });
    }, 600);
  };

  /* ---------- checklist screen ---------- */
  if (!pz || !built) {
    const pages = Math.ceil(CW_PUZZLES.length / PAGE);
    const start = page * PAGE;
    const slice = CW_PUZZLES.slice(start, start + PAGE);
    const nextUnfinished = CW_PUZZLES.findIndex(p => !done.has(p.id - 1));
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-1">📰 Crossword Checklist</h3>
        <p className="text-sm muted mb-2">
          <b>{done.size}</b> of <b>{CW_PUZZLES.length}</b> real crosswords finished. Finished
          puzzles get a ✔️ — your checklist is saved on this device.
        </p>
        <div
          className="mb-3"
          style={{ height: '10px', background: '#dbe7f5', borderRadius: '6px', overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${(done.size / CW_PUZZLES.length) * 100}%`,
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
              if (n >= 1 && n <= CW_PUZZLES.length) startPuzzle(n - 1);
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
        <p className="text-sm mb-2">
          <b>Tier {page + 1} · {CW_TIERS[page].name}</b>{' '}
          <span className="muted">
            — {CW_TIERS[page].size}×{CW_TIERS[page].size} grids
            {page === 9 ? ', and #1000 is the giant 21×21 Sunday finale' : ''}. Every tier the
            puzzles get bigger, with more clues to solve.
          </span>
        </p>
        <div className="flex justify-between items-center">
          <button
            className="btn small secondary !m-0"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            ← Prev 100
          </button>
          <span className="text-xs muted">
            Page {page + 1} of {pages}
          </span>
          <button
            className="btn small secondary !m-0"
            disabled={page >= pages - 1}
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
          >
            Next 100 →
          </button>
        </div>
      </PaperPanel>
    );
  }

  /* ---------- play screen ---------- */
  const size = pz.size;
  const across = pz.entries.filter(e => e.dir === 'A');
  const down = pz.entries.filter(e => e.dir === 'D');
  const selEntry =
    sel && built.cellEntry[`${sel.r},${sel.c}`]
      ? pz.entries[built.cellEntry[`${sel.r},${sel.c}`][sel.dir] ?? -1]
      : undefined;
  const selCells = new Set<string>();
  if (selEntry) {
    const dr = selEntry.dir === 'D' ? 1 : 0;
    const dc = selEntry.dir === 'A' ? 1 : 0;
    for (let i = 0; i < selEntry.word.length; i++) {
      selCells.add(`${selEntry.r + dr * i},${selEntry.c + dc * i}`);
    }
  }

  return (
    <div>
      <PaperPanel>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">
            📰 Crossword #{pz.id}{' '}
            <span className="muted text-sm">
              Tier {tierOfCw(pz.id) + 1} {CW_TIERS[tierOfCw(pz.id)].name} · {size}×{size} ·{' '}
              {pz.entries.length} clues
              {pz.id === 1000 ? ' · Sunday finale!' : ''}
            </span>
          </h3>
          {done.has(pz.id - 1) && <span className="text-sm">✔️ Done</span>}
        </div>

        <div
          className="cwgrid mb-3"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            maxWidth: size >= 13 ? '430px' : '330px',
            fontSize: `${
              size >= 21 ? 10.5 :
              size >= 17 ? 12 :
              size >= 16 ? 12.5 :
              size >= 15 ? 13 :
              size >= 14 ? 13.5 :
              size >= 13 ? 14 :
              size >= 12 ? 15 :
              size >= 11 ? 16 :
              size >= 10 ? 17 :
              size >= 9 ? 18 : 19
            }px`
          }}
        >
          {pz.grid.map((row, r) =>
            row.split('').map((sol, c) => {
              const key = `${r},${c}`;
              if (sol === '#') return <div key={key} className="cwcell block" />;
              const num = built.nums[key];
              const status = cellStatus[key];
              const inWord = selCells.has(key);
              const isSel = sel && sel.r === r && sel.c === c;
              return (
                <div
                  key={key}
                  className="cwcell"
                  style={{
                    background: isSel ? '#ffe08a' : inWord ? '#dcebfb' : undefined
                  }}
                  onClick={() => handleCellTap(r, c)}
                >
                  {num && <span className="num">{num}</span>}
                  <input
                    data-cw={key}
                    maxLength={1}
                    value={cells[key] || ''}
                    onChange={e => handleCellChange(r, c, e.target.value)}
                    onFocus={() => handleCellTap(r, c)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    className={status === 'ok' ? 'okc' : status === 'bad' ? 'badc' : ''}
                  />
                </div>
              );
            })
          )}
        </div>

        {selEntry && (
          <div className="msg my-2">
            <b>
              {selEntry.num} {selEntry.dir === 'A' ? 'Across' : 'Down'}:
            </b>{' '}
            {selEntry.clue} <span className="muted">({selEntry.word.length})</span>
            <span className="muted"> — tap the word again to switch direction</span>
          </div>
        )}
        {msg && <div className="msg my-2">{msg}</div>}

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <h4 className="font-bold mb-1">Across</h4>
            {across.map(e => (
              <div
                key={'A' + e.num}
                className="mb-1"
                style={{
                  background:
                    selEntry && selEntry.num === e.num && selEntry.dir === 'A'
                      ? '#dcebfb'
                      : undefined,
                  borderRadius: '4px',
                  padding: '1px 3px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSel({ r: e.r, c: e.c, dir: 'A' });
                  focusCell(e.r, e.c);
                }}
              >
                <b>{e.num}.</b> {e.clue} <span className="muted">({e.word.length})</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-bold mb-1">Down</h4>
            {down.map(e => (
              <div
                key={'D' + e.num}
                className="mb-1"
                style={{
                  background:
                    selEntry && selEntry.num === e.num && selEntry.dir === 'D'
                      ? '#dcebfb'
                      : undefined,
                  borderRadius: '4px',
                  padding: '1px 3px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSel({ r: e.r, c: e.c, dir: 'D' });
                  focusCell(e.r, e.c);
                }}
              >
                <b>{e.num}.</b> {e.clue} <span className="muted">({e.word.length})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={handleCheck} className="btn">
            ✔️ Check
          </button>
          <button onClick={handleReveal} className="btn secondary">
            👀 Reveal answers (no checklist credit)
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

        {/* Answers, printed upside down like the newspaper — no peeking! */}
        <div
          className="my-4"
          style={{
            transform: 'rotate(180deg)',
            border: '2px dashed #9db9dc',
            borderRadius: '10px',
            padding: '10px',
            background: '#f4f8fd'
          }}
        >
          <p className="font-bold text-sm mb-2">
            🔑 ANSWERS — Crossword #{pz.id} (turn your phone upside down!)
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-bold mb-1">Across</h4>
              {across.map(e => (
                <div key={'a' + e.num}>
                  <b>{e.num}.</b> {e.word}
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-bold mb-1">Down</h4>
              {down.map(e => (
                <div key={'d' + e.num}>
                  <b>{e.num}.</b> {e.word}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PaperPanel>
    </div>
  );
};
