import { CAT_CATS, CAT_LISTS, CrosswordPuzzle } from '../data/words';
import { WEBSTER_WORDS, WEBSTER_SET } from '../data/dictionary';

export const rnd = (n: number) => Math.floor(Math.random() * n);
export const ri = (a: number, b: number) => a + rnd(b - a + 1);
export const pickA = <T>(a: T[]): T => a[rnd(a.length)];
export const shuffle = <T>(a: T[]): T[] => {
  const c = a.slice();
  for (let i = c.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

export const Logic = {
  /* --- Dots and Boxes --- */
  // One grid size per level (boxes: cols x rows). EVERY level has more dots
  // than the level before it — dot count (cols+1)*(rows+1) strictly rises
  // from 9 dots at Level 1 (2x2) to 225 dots at Level 50 (14x14).
  DOTS_LEVELS: [
    [2, 2], [2, 3], [3, 3], [3, 4], [3, 5],
    [4, 4], [4, 5], [4, 6], [5, 5], [5, 6],
    [5, 7], [6, 6], [5, 8], [6, 7], [5, 9],
    [6, 8], [7, 7], [6, 9], [7, 8], [6, 10],
    [7, 9], [8, 8], [7, 10], [8, 9], [7, 11],
    [9, 9], [7, 12], [8, 11], [9, 10], [8, 12],
    [9, 11], [10, 10], [8, 13], [9, 12], [10, 11],
    [8, 14], [9, 13], [10, 12], [11, 11], [9, 14],
    [10, 13], [10, 14], [11, 13], [12, 12], [11, 14],
    [12, 13], [12, 14], [13, 13], [13, 14], [14, 14]
  ] as Array<[number, number]>,
  dotsSizeForLevel(level: number) {
    const L = Math.max(1, Math.min(50, Math.floor(level) || 1));
    const [w, h] = this.DOTS_LEVELS[L - 1];
    return { w, h, dots: (w + 1) * (h + 1), boxes: w * h };
  },
  dotsNew(cols: number, rows: number) {
    return {
      cols,
      rows,
      h: Array((rows + 1) * cols).fill(0),
      v: Array(rows * (cols + 1)).fill(0),
      boxes: Array(cols * rows).fill(0),
      turn: 0,
      over: false,
      scores: [0, 0] as [number, number]
    };
  },
  dotsEdgeIdx(kind: 'h' | 'v', r: number, c: number, S: any) {
    return kind === 'h' ? r * S.cols + c : r * (S.cols + 1) + c;
  },
  dotsBoxesForEdge(kind: 'h' | 'v', r: number, c: number, S: any): number[] {
    const out: number[] = [];
    if (kind === 'h') {
      if (r > 0) out.push((r - 1) * S.cols + c);
      if (r < S.rows) out.push(r * S.cols + c);
    } else {
      if (c > 0) out.push(r * S.cols + (c - 1));
      if (c < S.cols) out.push(r * S.cols + c);
    }
    return out;
  },
  dotsBoxEdges(S: any, bi: number): Array<['h' | 'v', number, number]> {
    const r = Math.floor(bi / S.cols);
    const c = bi % S.cols;
    return [['h', r, c], ['h', r + 1, c], ['v', r, c], ['v', r, c + 1]];
  },
  dotsBoxComplete(S: any, bi: number) {
    return this.dotsBoxEdges(S, bi).every(
      ([k, r, c]) => S[k][this.dotsEdgeIdx(k, r, c, S)] !== 0
    );
  },
  dotsApply(S: any, kind: 'h' | 'v', r: number, c: number, player: number) {
    const idx = this.dotsEdgeIdx(kind, r, c, S);
    if (S[kind][idx]) return { ok: false, claimed: 0, extra: false };
    S[kind][idx] = player + 1;
    let claimed = 0;
    for (const bi of this.dotsBoxesForEdge(kind, r, c, S)) {
      if (!S.boxes[bi] && this.dotsBoxComplete(S, bi)) {
        S.boxes[bi] = player + 1;
        claimed++;
        S.scores[player]++;
      }
    }
    const total = S.boxes.filter(Boolean).length;
    if (total === S.cols * S.rows) S.over = true;
    return { ok: true, claimed, extra: claimed > 0 };
  },
  dotsLegal(S: any): Array<['h' | 'v', number, number]> {
    const L: Array<['h' | 'v', number, number]> = [];
    for (let r = 0; r <= S.rows; r++) {
      for (let c = 0; c < S.cols; c++) {
        if (!S.h[r * S.cols + c]) L.push(['h', r, c]);
      }
    }
    for (let r = 0; r < S.rows; r++) {
      for (let c = 0; c <= S.cols; c++) {
        if (!S.v[r * (S.cols + 1) + c]) L.push(['v', r, c]);
      }
    }
    return L;
  },
  dotsBotMove(S: any): ['h' | 'v', number, number] | null {
    const legal = this.dotsLegal(S);
    if (!legal.length) return null;
    for (const [k, r, c] of legal) {
      const t = JSON.parse(JSON.stringify(S));
      const res = this.dotsApply(t, k, r, c, 1);
      if (res.claimed > 0) return [k, r, c];
    }
    const safe = legal.filter(([k, r, c]) => {
      const t = JSON.parse(JSON.stringify(S));
      this.dotsApply(t, k, r, c, 1);
      return !this.dotsBoxesForEdge(k, r, c, S).some(bi => {
        const filled = this.dotsBoxEdges(S, bi).filter(
          ([ek, er, ec]) => t[ek][this.dotsEdgeIdx(ek, er, ec, S)]
        ).length;
        return filled === 3 && !t.boxes[bi];
      });
    });
    return pickA(safe.length ? safe : legal);
  },

  /* --- Tic-Tac-Toe --- */
  tttWin(b: string[]): string | 'draw' | null {
    const L = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, c, d] of L) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return b.every(x => x) ? 'draw' : null;
  },
  tttBest(b: string[], me: string, opp: string): number {
    let best = -1e9;
    let move = -1;
    const score = (bd: string[], d: number) => {
      const w = this.tttWin(bd);
      if (w === me) return 10 - d;
      if (w === opp) return d - 10;
      if (w === 'draw') return 0;
      return null;
    };
    const mm = (bd: string[], turn: string, d: number): number => {
      const s = score(bd, d);
      if (s !== null) return s;
      let bs = turn === me ? -1e9 : 1e9;
      for (let i = 0; i < 9; i++) {
        if (bd[i]) continue;
        bd[i] = turn;
        const v = mm(bd, turn === me ? opp : me, d + 1);
        bd[i] = '';
        bs = turn === me ? Math.max(bs, v) : Math.min(bs, v);
      }
      return bs;
    };
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = me;
      const v = mm(b, opp, 0);
      b[i] = '';
      if (v > best) {
        best = v;
        move = i;
      }
    }
    return move;
  },

  /* --- Hangman --- */
  hangWrong(word: string, guessed: string[]) {
    return guessed.filter(g => !word.includes(g)).length;
  },
  hangRevealed(word: string, guessed: string[]) {
    return word.split('').every(ch => guessed.includes(ch));
  },

  /* --- Bulls and Cows --- */
  bullsCows(secret: string, guess: string) {
    let bulls = 0;
    let cows = 0;
    const s = String(secret);
    const g = String(guess);
    for (let i = 0; i < s.length; i++) {
      if (g[i] === s[i]) bulls++;
      else if (s.includes(g[i])) cows++;
    }
    return { bulls, cows };
  },
  bullsSecret(): string {
    const d = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    if (d[0] === 0) {
      const j = d.findIndex(x => x !== 0);
      [d[0], d[j]] = [d[j], d[0]];
    }
    return d.join('');
  },
  bullsValid(g: string): boolean {
    return /^[0-9]{4}$/.test(g) && new Set(g).size === 4;
  },

  /* --- Sim --- */
  simEdgesKey(a: number, b: number) {
    return Math.min(a, b) + '-' + Math.max(a, b);
  },
  simHasTriangle(edges: string[]): [number, number, number] | null {
    const set = new Set(edges);
    const nodes = new Set<number>();
    edges.forEach(e => e.split('-').forEach(x => nodes.add(+x)));
    for (const a of nodes) {
      for (const b of nodes) {
        for (const c of nodes) {
          if (
            a < b &&
            b < c &&
            set.has(this.simEdgesKey(a, b)) &&
            set.has(this.simEdgesKey(b, c)) &&
            set.has(this.simEdgesKey(a, c))
          ) {
            return [a, b, c];
          }
        }
      }
    }
    return null;
  },
  simLoses(edges: string[]): boolean {
    return !!this.simHasTriangle(edges);
  },

  /* --- Ghost --- */
  ghostIsWord(frag: string): boolean {
    return frag.length >= 4 && WEBSTER_SET.has(frag.toLowerCase());
  },
  ghostContinuations(frag: string): string[] {
    const f = frag.toLowerCase();
    return WEBSTER_WORDS.filter(w => w.startsWith(f) && w.length > f.length);
  },
  ghostCompleteMove(frag: string): boolean {
    return this.ghostIsWord(frag);
  },

  /* --- Word Ladder --- */
  ladderOneLetter(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) d++;
    }
    return d === 1;
  },
  ladderValid(word: string): boolean {
    return WEBSTER_SET.has(String(word).toLowerCase());
  },

  /* --- Word Search --- */
  wsGenerate(words: string[], size: number = 10): { grid: string[]; placements: Record<string, [number, number][]> } | null {
    const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const ordered = [...words].sort((a, b) => b.length - a.length);
    for (let attempt = 0; attempt < 60; attempt++) {
      const grid = Array.from({ length: size }, () => Array(size).fill(''));
      const placements: Record<string, [number, number][]> = {};
      let failed = false;
      for (const w0 of ordered) {
        const w = w0.toUpperCase();
        let placed = false;
        let tries = 0;
        while (!placed && tries < 400) {
          tries++;
          const [dr, dc] = pickA(dirs);
          const r = ri(0, size - 1);
          const c = ri(0, size - 1);
          const er = r + dr * (w.length - 1);
          const ec = c + dc * (w.length - 1);
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
          let ok = true;
          for (let i = 0; i < w.length; i++) {
            const cell = grid[r + dr * i][c + dc * i];
            if (cell && cell !== w[i]) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;
          const cells: [number, number][] = [];
          for (let i = 0; i < w.length; i++) {
            grid[r + dr * i][c + dc * i] = w[i];
            cells.push([r + dr * i, c + dc * i]);
          }
          placements[w] = cells;
          placed = true;
        }
        if (!placed) {
          failed = true;
          break;
        }
      }
      if (failed) continue;
      const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!grid[r][c]) grid[r][c] = AZ[rnd(26)];
        }
      }
      return { grid: grid.map(row => row.join('')), placements };
    }
    return null;
  },
  wsWordAt(grid: string[], cells: [number, number][]): string {
    return cells.map(([r, c]) => grid[r][c]).join('');
  },

  /* --- Crossword --- */
  cwBuild(puzzle: CrosswordPuzzle): { grid: string[]; nums: Record<string, number> } | null {
    const size = puzzle.size;
    const grid = Array.from({ length: size }, () => Array(size).fill('#'));
    const nums: Record<string, number> = {};
    for (const p of puzzle.entries) {
      for (let i = 0; i < p.answer.length; i++) {
        const r = p.r + (p.dir === 'D' ? i : 0);
        const c = p.c + (p.dir === 'A' ? i : 0);
        if (r < 0 || r >= size || c < 0 || c >= size) return null;
        const cur = grid[r][c];
        if (cur !== '#' && cur !== p.answer[i]) return null;
        grid[r][c] = p.answer[i];
      }
    }
    const starts: Record<string, boolean> = {};
    for (const p of puzzle.entries) {
      starts[p.r + ',' + p.c] = true;
    }
    let n = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== '#' && starts[r + ',' + c]) {
          n++;
          nums[r + ',' + c] = n;
        }
      }
    }
    for (const p of puzzle.entries) {
      p.num = nums[p.r + ',' + p.c];
      if (!p.num) return null;
    }
    return { grid: grid.map(row => row.join('')), nums };
  },

  /* --- Categories --- */
  catValid(cat: string, ans: string, letter: string): boolean {
    ans = String(ans || '').trim().toUpperCase();
    letter = String(letter).toUpperCase();
    if (!ans || ans[0] !== letter || !/^[A-Z][A-Z '\-]*$/.test(ans)) return false;
    const list = CAT_LISTS[cat] || [];
    const forLetter = list.filter(w => w[0] === letter);
    if (forLetter.length) return list.includes(ans);
    return ans.length >= 2;
  },
  catScore(mine: Record<string, string>, bot: Record<string, string>, letter: string) {
    let total = 0;
    const detail: Record<string, { ans: string; valid: boolean; pts: number; bot: string; botValid: boolean }> = {};
    for (const cat of CAT_CATS) {
      const m = String(mine[cat] || '').trim().toUpperCase();
      const b = String(bot[cat] || '').trim().toUpperCase();
      const mv = this.catValid(cat, m, letter);
      const bv = this.catValid(cat, b, letter);
      let pts = 0;
      if (mv) pts = bv && m === b ? 5 : 10;
      detail[cat] = { ans: m, valid: mv, pts, bot: b, botValid: bv };
      total += pts;
    }
    return { total, detail };
  },
  catBotCard(letter: string): Record<string, string> {
    const card: Record<string, string> = {};
    for (const cat of CAT_CATS) {
      const opts = (CAT_LISTS[cat] || []).filter(w => w[0] === letter);
      card[cat] = opts.length && Math.random() < 0.9 ? pickA(opts) : '';
    }
    return card;
  },

  /* --- MASH --- */
  mashEliminate(categories: Record<string, string[]>, magic: number): Record<string, string> {
    const result: Record<string, string> = {};
    const pools: Record<string, string[]> = {};
    for (const cat in categories) pools[cat] = categories[cat].slice();
    const cats = Object.keys(categories);
    let ci = 0;
    let guard = 0;
    const remaining = () => cats.filter(c => pools[c].length > 1);
    while (remaining().length && guard++ < 10000) {
      const cat = cats[ci % cats.length];
      ci++;
      if (pools[cat].length <= 1) continue;
      const pool = pools[cat];
      let steps = magic;
      let pos = 0;
      while (steps > 1) {
        pos = (pos + 1) % pool.length;
        steps--;
      }
      pool.splice(pos, 1);
    }
    for (const cat of cats) result[cat] = pools[cat][0];
    return result;
  }
};

/* --- Sim board layouts --- */
export type SimShape = 'ring' | 'grid' | 'scatter';

// Dot positions for Sim on the 300x260 board, for 6-10 dots in 3 shapes.
// Ring at 6 dots is the classic hexagon, exactly as the game shipped.
export function simPositions(n: number, shape: SimShape): Array<[number, number]> {
  const count = Math.max(6, Math.min(10, Math.floor(n) || 6));
  if (shape === 'ring') {
    if (count === 6) {
      return [
        [150, 25],
        [245, 77],
        [245, 182],
        [150, 235],
        [55, 182],
        [55, 77]
      ];
    }
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < count; i++) {
      const th = -Math.PI / 2 + (i * 2 * Math.PI) / count;
      pts.push([
        Math.round(150 + 106 * Math.cos(th)),
        Math.round(130 + 102 * Math.sin(th))
      ]);
    }
    return pts;
  }
  if (shape === 'grid') {
    const cols = Math.ceil(Math.sqrt(count * (230 / 190)));
    const rows = Math.ceil(count / cols);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < count; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      pts.push([
        Math.round(35 + ((c + 0.5) * 230) / cols),
        Math.round(35 + ((r + 0.5) * 190) / rows)
      ]);
    }
    return pts;
  }
  // scatter: seeded random placement with a minimum gap, same board every
  // time for a given count (and always matching the option-screen preview)
  let seed = 1234567 + count * 99991;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pts: Array<[number, number]> = [];
  let minDist = 56;
  while (pts.length < count) {
    let placed = false;
    for (let tries = 0; tries < 500 && !placed; tries++) {
      const x = Math.round(34 + rnd() * 232);
      const y = Math.round(34 + rnd() * 192);
      if (pts.every(([px, py]) => Math.hypot(px - x, py - y) >= minDist)) {
        pts.push([x, y]);
        placed = true;
      }
    }
    if (!placed) minDist -= 6; // relax and keep going; still well spaced
  }
  return pts;
}

/* --- Sprouts helpers --- */
// Starting dot layouts for 3-20 dots on the 300x260 board.
// 3 dots keeps the classic triangle; larger counts use a jittered grid so
// dots are evenly spread with real space between them — never overlaid.
export function sproutsStartDots(n: number): Array<{ x: number; y: number; deg: number }> {
  const count = Math.max(3, Math.min(20, Math.floor(n) || 3));
  if (count === 3) {
    return [
      { x: 60, y: 130, deg: 0 },
      { x: 240, y: 130, deg: 0 },
      { x: 150, y: 45, deg: 0 }
    ];
  }
  const cols = Math.ceil(Math.sqrt(count * (300 / 260)));
  const rows = Math.ceil(count / cols);
  const cw = 300 / cols;
  const ch = 260 / rows;
  // small deterministic jitter (same layout every game for a given count)
  const jit = (i: number, k: number) => {
    const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return (v - Math.floor(v) - 0.5) * 2;
  };
  const jx = Math.min(11, cw * 0.18);
  const jy = Math.min(11, ch * 0.18);
  const pts: Array<{ x: number; y: number; deg: number }> = [];
  for (let i = 0; i < count; i++) {
    const cx = (i % cols) * cw + cw / 2;
    const cy = Math.floor(i / cols) * ch + ch / 2;
    pts.push({
      x: Math.round(cx + jit(i, 1) * jx),
      y: Math.round(cy + jit(i, 2) * jy),
      deg: 0
    });
  }
  return pts;
}


function segInt(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
  if (!d) return false;
  const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
  const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
  return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98;
}

export function sproutsMid(
  a: { x: number; y: number },
  b: { x: number; y: number },
  side: number = 1
): { x: number; y: number } {
  const clampX = (x: number) => Math.max(16, Math.min(284, x));
  const clampY = (y: number) => Math.max(16, Math.min(244, y));
  if (a.x === b.x && a.y === b.y) {
    // a proper Sprouts loop: a big teardrop out and back to the same dot
    const lx = a.x <= 150 ? 62 : -62;
    const ly = a.y <= 130 ? -62 : 62;
    return { x: clampX(a.x + lx * side), y: clampY(a.y + ly) };
  }
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // big sweeping bow, like pencil Sprouts: ~42% of the line length
  const off = Math.max(16, Math.min(66, len * 0.42)) * side;
  return {
    x: clampX(mx - (dy / len) * off),
    y: clampY(my + (dx / len) * off)
  };
}

export function sproutsCrosses(
  S: any,
  a: number,
  b: number,
  mid: { x: number; y: number }
): boolean {
  const A = S.dots[a];
  const B = S.dots[b];
  const segs: [[number, number], [number, number]][] = [
    [[A.x, A.y], [mid.x, mid.y]],
    [[mid.x, mid.y], [B.x, B.y]]
  ];
  for (const e of S.edges) {
    const P = S.dots[e.a];
    const Q = S.dots[e.b];
    const M = { x: e.mx, y: e.my };
    const es: [[number, number], [number, number]][] = [
      [[P.x, P.y], [M.x, M.y]],
      [[M.x, M.y], [Q.x, Q.y]]
    ];
    for (const s1 of segs) {
      for (const s2 of es) {
        const shared =
          (s1[0][0] === s2[0][0] && s1[0][1] === s2[0][1]) ||
          (s1[0][0] === s2[1][0] && s1[0][1] === s2[1][1]) ||
          (s1[1][0] === s2[0][0] && s1[1][1] === s2[0][1]) ||
          (s1[1][0] === s2[1][0] && s1[1][1] === s2[1][1]);
        if (shared) continue;
        if (segInt(s1[0], s1[1], s2[0], s2[1])) return true;
      }
    }
  }
  return false;
}

export function sproutsLegal(S: any): Array<[number, number, { x: number; y: number }]> {
  const L: Array<[number, number, { x: number; y: number }]> = [];
  // the new dot lands on the curve's apex — keep it clear of existing dots
  // so dots never stack on top of each other
  const midClear = (mid: { x: number; y: number }, a: number, b: number) =>
    S.dots.every(
      (d: { x: number; y: number }, i: number) =>
        i === a || i === b || Math.hypot(d.x - mid.x, d.y - mid.y) >= 24
    );
  for (let a = 0; a < S.dots.length; a++) {
    for (let b = a; b < S.dots.length; b++) {
      if (a === b) {
        if (S.dots[a].deg > 1) continue;
      } else if (S.dots[a].deg >= 3 || S.dots[b].deg >= 3) {
        continue;
      }
      // try the bow on both sides of the line; take the first that fits
      for (const side of [1, -1]) {
        const mid = sproutsMid(S.dots[a], S.dots[b], side);
        if (!midClear(mid, a, b)) continue;
        if (sproutsCrosses(S, a, b, mid)) continue;
        L.push([a, b, mid]);
        break;
      }
    }
  }
  return L;
}

export function sproutsApply(
  S: any,
  a: number,
  b: number,
  mid: { x: number; y: number }
) {
  S.edges.push({ a, b, mx: mid.x, my: mid.y, by: S.turn % 2 });
  S.dots.push({ x: mid.x, y: mid.y, deg: 2 });
  if (a === b) S.dots[a].deg += 2;
  else {
    S.dots[a].deg++;
    S.dots[b].deg++;
  }
  S.turn++;
}
