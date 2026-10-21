import React, { useState } from 'react';
import { GameMode, FinishResult } from '../types';
import { CROSSWORDS } from '../data/words';
import { Logic } from '../utils/logic';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface CrosswordGameProps {
  mode: GameMode;
  names: string[];
  onFinish: (result: FinishResult) => void;
}

export const CrosswordGame: React.FC<CrosswordGameProps> = ({ onFinish }) => {
  const [puzzleIdx, setPuzzleIdx] = useState<number>(-1);
  const [built, setBuilt] = useState<any>(null);
  const [cells, setCells] = useState<Record<string, string>>({});
  const [cellStatus, setCellStatus] = useState<Record<string, 'ok' | 'bad'>>({});
  const [msg, setMsg] = useState('');

  const handleSelectPuzzle = (idx: number) => {
    Sound.click();
    const pz = JSON.parse(JSON.stringify(CROSSWORDS[idx]));
    const b = Logic.cwBuild(pz);
    setBuilt(b);
    setPuzzleIdx(idx);
    setCells({});
    setCellStatus({});
    setMsg('');
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    const key = `${r},${c}`;
    const nextCells = { ...cells, [key]: char };
    setCells(nextCells);

    // Auto-focus next cell in row if available
    if (char && c < CROSSWORDS[puzzleIdx].size - 1) {
      const nextInput = document.querySelector(
        `input[data-cell="${r},${c + 1}"]`
      ) as HTMLInputElement | null;
      if (nextInput) nextInput.focus();
    }

    // Check completion
    checkCompleted(nextCells);
  };

  const checkCompleted = (curCells: Record<string, string>) => {
    if (!built) return;
    const size = CROSSWORDS[puzzleIdx].size;
    let allRight = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (built.grid[r][c] === '#') continue;
        if ((curCells[`${r},${c}`] || '') !== built.grid[r][c]) {
          allRight = false;
          break;
        }
      }
    }

    if (allRight) {
      Sound.win();
      setTimeout(() => {
        onFinish({
          winner: 0,
          title: 'Crossword Completed! 🎉',
          body: (
            <div className="msg">
              Puzzle {puzzleIdx + 1} completed — every answer correct!
            </div>
          )
        });
      }, 400);
    }
  };

  const handleCheck = () => {
    if (!built) return;
    Sound.click();
    const size = CROSSWORDS[puzzleIdx].size;
    let right = 0;
    let wrong = 0;
    const nextStatus: Record<string, 'ok' | 'bad'> = {};

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = `${r},${c}`;
        const val = (cells[key] || '').toUpperCase();
        if (built.grid[r][c] === '#') continue;
        if (!val) continue;
        if (val === built.grid[r][c]) {
          nextStatus[key] = 'ok';
          right++;
        } else {
          nextStatus[key] = 'bad';
          wrong++;
        }
      }
    }
    setCellStatus(nextStatus);
    setMsg(`Check: ${right} right, ${wrong} wrong.`);
    checkCompleted(cells);
  };

  const handleReveal = () => {
    if (!built) return;
    Sound.click();
    const size = CROSSWORDS[puzzleIdx].size;
    const nextCells: Record<string, string> = {};
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (built.grid[r][c] !== '#') {
          nextCells[`${r},${c}`] = built.grid[r][c];
        }
      }
    }
    setCells(nextCells);
    setTimeout(() => {
      onFinish({
        winner: -1,
        title: '👀 Answers revealed',
        body: (
          <div className="paper my-2">
            <p>The solution is on the board — try another puzzle and beat it fair and square!</p>
          </div>
        ),
        result: 't',
        pts: 0
      });
    }, 400);
  };

  if (puzzleIdx < 0 || !built) {
    return (
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">Pick a puzzle</h3>
        {CROSSWORDS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSelectPuzzle(i)}
            className="btn secondary mb-2 text-left"
          >
            Puzzle {i + 1} — {p.size}×{p.size}, {p.entries.length} answers
          </button>
        ))}
      </PaperPanel>
    );
  }

  const pz = CROSSWORDS[puzzleIdx];
  const size = pz.size;
  const across = pz.entries.filter(e => e.dir === 'A');
  const down = pz.entries.filter(e => e.dir === 'D');

  return (
    <div>
      <PaperPanel>
        <h3 className="font-bold text-lg mb-2">Puzzle {puzzleIdx + 1}</h3>

        <div
          className="cwgrid mb-4"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((__, c) => {
              const sol = built.grid[r][c];
              const key = `${r},${c}`;
              if (sol === '#') {
                return <div key={key} className="cwcell block" />;
              }
              const num = built.nums[key];
              const status = cellStatus[key];
              return (
                <div key={key} className="cwcell">
                  {num && <span className="num">{num}</span>}
                  <input
                    data-cell={key}
                    maxLength={1}
                    value={cells[key] || ''}
                    onChange={e => handleCellChange(r, c, e.target.value)}
                    autoComplete="off"
                    className={
                      status === 'ok'
                        ? 'okc'
                        : status === 'bad'
                        ? 'badc'
                        : ''
                    }
                  />
                </div>
              );
            })
          )}
        </div>

        {msg && <div className="msg my-2">{msg}</div>}

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <h4 className="font-bold mb-1">Across</h4>
            {across.map(e => (
              <div key={e.answer} className="mb-1">
                <b>{e.num}.</b> {e.clue}{' '}
                <span className="muted">({e.answer.length})</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-bold mb-1">Down</h4>
            {down.map(e => (
              <div key={e.answer} className="mb-1">
                <b>{e.num}.</b> {e.clue}{' '}
                <span className="muted">({e.answer.length})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={handleCheck} className="btn">
            ✔️ Check
          </button>
          <button onClick={handleReveal} className="btn secondary">
            👀 Reveal answers
          </button>
          <button
            onClick={() => {
              Sound.click();
              setPuzzleIdx(-1);
            }}
            className="btn secondary"
          >
            ↩️ Pick another puzzle
          </button>
        </div>
      </PaperPanel>
    </div>
  );
};
