export type GameId =
  | 'dots'
  | 'ttt'
  | 'hangman'
  | 'sprouts'
  | 'sim'
  | 'bulls'
  | 'categories'
  | 'mash'
  | 'taboo'
  | 'crossword'
  | 'wordsearch'
  | 'ghost'
  | 'ladder'
  | 'consequences'
  | 'telephone';

export type GameMode = 'pvc' | 'hotseat' | 'online';

export interface GameMeta {
  id: GameId;
  name: string;
  icon: string;
  desc: string;
  p: [number, number];
  payout: number;
  rules: string;
}

export interface User {
  uid: string;
  username: string;
  code: string;
}

export interface UserStats {
  w: number;
  l: number;
  t: number;
}

export interface AccountData {
  username: string;
  pw?: string;
  code: string;
  points: number;
  winsObj?: Record<string, UserStats>;
  lastDaily: number;
  friends: { username: string; code: string }[];
  requests: { username: string; code: string }[];
  sent: { username: string; code: string }[];
  _seededReq?: boolean;
}

export interface DemoRoom {
  code: string;
  game: GameId;
  host: string;
  status: 'waiting' | 'playing' | 'over';
  created: number;
}

export interface ChatMessage {
  who: string;
  text: string;
  at: number;
}

export interface FinishResult {
  winner: number; // seat index, or -1 for draw/custom
  title?: string;
  body?: React.ReactNode;
  result?: 'w' | 'l' | 't' | null;
  pts?: number;
}

export interface GameContext<S = any> {
  gameId: GameId;
  mode: GameMode;
  names: string[];
  S: S;
  isNet: boolean;
  seatName: (i: number) => string;
  cur: () => number;
  mine: () => boolean;
  update: (fn: (s: S) => void, quiet?: boolean) => void;
  finish: (result: FinishResult) => void;
}
