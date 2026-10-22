// GENERATED tiered crossword library: 1,000 real interlocking puzzles in 10 tiers.
// Tier 1 is 8x8 and the grids grow every tier to 17x17; #1000 is a 21x21 Sunday finale.
// The puzzles live in crosswords-a.ts .. crosswords-d.ts (split for push size
// limits) and are combined here. Do not hand-edit; regenerate instead.
import { CW_PUZZLES_A } from './crosswords-a';
import { CW_PUZZLES_B } from './crosswords-b';
import { CW_PUZZLES_C } from './crosswords-c';
import { CW_PUZZLES_D } from './crosswords-d';
export type { CWEntry, CWPuzzle } from './crosswords-a';
import type { CWPuzzle } from './crosswords-a';
export const CW_PUZZLES: CWPuzzle[] = [
  ...CW_PUZZLES_A,
  ...CW_PUZZLES_B,
  ...CW_PUZZLES_C,
  ...CW_PUZZLES_D,
];
