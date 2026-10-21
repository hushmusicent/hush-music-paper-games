import { AccountData, ChatMessage, DemoRoom, GameId, User, UserStats } from '../types';
import { BOT_NAMES, botCode } from '../data/words';

export const START_POINTS = 1000;
export const DAILY_BONUS = 500;
export const DEMO_USER = 'demo';
export const DEMO_PASS = 'demo1234';

export const PAYOUTS: Record<GameId, number> = {
  dots: 60,
  ttt: 40,
  hangman: 50,
  sprouts: 70,
  sim: 60,
  bulls: 60,
  categories: 60,
  mash: 30,
  taboo: 60,
  crossword: 70,
  wordsearch: 60,
  ghost: 60,
  ladder: 60,
  consequences: 30,
  telephone: 40
};

export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem('pg_' + k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set<T>(k: string, v: T) {
    try {
      localStorage.setItem('pg_' + k, JSON.stringify(v));
    } catch (e) {}
  },
  del(k: string) {
    try {
      localStorage.removeItem('pg_' + k);
    } catch (e) {}
  }
};

export function newCode(): string {
  const cs = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += cs[Math.floor(Math.random() * cs.length)];
  return c;
}

export class AppStore {
  static getAccounts(): Record<string, AccountData> {
    return store.get('accounts', {});
  }

  static saveAccounts(a: Record<string, AccountData>) {
    store.set('accounts', a);
  }

  static ensureDemo() {
    const a = this.getAccounts();
    const id = 'local_' + DEMO_USER;
    if (!a[id]) {
      a[id] = {
        username: 'Demo',
        pw: DEMO_PASS,
        code: 'DEMO42',
        points: START_POINTS,
        winsObj: {},
        lastDaily: 0,
        friends: [],
        requests: [],
        sent: []
      };
      this.saveAccounts(a);
    }
  }

  static getCurrentUser(): User | null {
    this.ensureDemo();
    const sess = store.get<string | null>('session', null);
    if (!sess) return null;
    const accounts = this.getAccounts();
    const acc = accounts[sess];
    if (!acc) return null;
    return {
      uid: sess,
      username: acc.username,
      code: acc.code
    };
  }

  static demoSignup(username: string, pw?: string): { user?: User; error?: string } {
    this.ensureDemo();
    const a = this.getAccounts();
    const id = 'local_' + username.toLowerCase();
    if (a[id]) return { error: 'That username is taken on this device.' };
    const code = newCode();
    a[id] = {
      username,
      pw,
      code,
      points: START_POINTS,
      winsObj: {},
      lastDaily: 0,
      friends: [],
      requests: [],
      sent: []
    };
    this.saveAccounts(a);
    store.set('session', id);
    return { user: { uid: id, username, code } };
  }

  static demoLogin(username: string, pw?: string): { user?: User; error?: string } {
    this.ensureDemo();
    const a = this.getAccounts();
    const id = 'local_' + username.toLowerCase();
    if (!a[id]) return { error: 'No account with that username on this device.' };
    if ((a[id].pw || '') !== (pw || '')) return { error: 'Wrong password.' };
    store.set('session', id);
    return {
      user: {
        uid: id,
        username: a[id].username,
        code: a[id].code
      }
    };
  }

  static logout() {
    store.del('session');
  }

  static eraseAccount(uid: string) {
    const a = this.getAccounts();
    delete a[uid];
    this.saveAccounts(a);
    store.del('session');
  }

  static updateUsername(uid: string, newName: string): boolean {
    const a = this.getAccounts();
    if (!a[uid]) return false;
    a[uid].username = newName;
    this.saveAccounts(a);
    return true;
  }

  static getPoints(uid: string): number {
    const a = this.getAccounts();
    return a[uid]?.points ?? START_POINTS;
  }

  static addPoints(uid: string, n: number): number {
    const a = this.getAccounts();
    if (!a[uid]) return START_POINTS;
    a[uid].points = (a[uid].points ?? START_POINTS) + n;
    this.saveAccounts(a);
    return a[uid].points;
  }

  static getWins(uid: string): Record<string, UserStats> {
    const a = this.getAccounts();
    return a[uid]?.winsObj ?? {};
  }

  static getTotalWins(uid: string): number {
    const wins = this.getWins(uid);
    return Object.values(wins).reduce((s, g) => s + (g.w || 0), 0);
  }

  static recordResult(uid: string, gameId: GameId, result: 'w' | 'l' | 't') {
    const a = this.getAccounts();
    if (!a[uid]) return;
    a[uid].winsObj = a[uid].winsObj ?? {};
    if (!a[uid].winsObj![gameId]) {
      a[uid].winsObj![gameId] = { w: 0, l: 0, t: 0 };
    }
    a[uid].winsObj![gameId][result]++;
    this.saveAccounts(a);
  }

  static canClaimDaily(uid: string): boolean {
    const a = this.getAccounts();
    if (!a[uid]) return false;
    const today = Math.floor(Date.now() / 864e5);
    return a[uid].lastDaily !== today;
  }

  static claimDaily(uid: string): boolean {
    if (!this.canClaimDaily(uid)) return false;
    const a = this.getAccounts();
    if (!a[uid]) return false;
    const today = Math.floor(Date.now() / 864e5);
    a[uid].lastDaily = today;
    a[uid].points = (a[uid].points ?? START_POINTS) + DAILY_BONUS;
    this.saveAccounts(a);
    return true;
  }

  static seedFriendRequests(uid: string) {
    const a = this.getAccounts();
    if (!a[uid] || a[uid]._seededReq) return;
    a[uid]._seededReq = true;
    a[uid].requests = [
      { username: 'DoodleDee', code: botCode(2) },
      { username: 'PaperQueen', code: botCode(4) }
    ];
    this.saveAccounts(a);
  }

  static getFriends(uid: string) {
    const a = this.getAccounts();
    return a[uid]?.friends ?? [];
  }

  static getFriendRequests(uid: string) {
    const a = this.getAccounts();
    return a[uid]?.requests ?? [];
  }

  static getSentRequests(uid: string) {
    const a = this.getAccounts();
    return a[uid]?.sent ?? [];
  }

  static addFriendByCode(
    myUser: User,
    code: string,
    onBotAccept?: (username: string) => void
  ): string {
    const c = code.trim().toUpperCase();
    if (!c) return 'Enter a player code.';
    if (c === myUser.code) return 'That is your own code.';

    const all = this.getAccounts();
    const me = all[myUser.uid];
    if (!me) return 'Log in first.';

    if (me.friends?.some(f => f.code === c)) {
      return 'Already your friend.';
    }

    // Check directory of bots
    const botIdx = BOT_NAMES.findIndex((_, i) => botCode(i) === c);
    const botName = botIdx >= 0 ? BOT_NAMES[botIdx] : null;

    // Check other accounts on this device
    const otherUid = Object.keys(all).find(k => all[k].code === c);

    if (!botName && !otherUid) {
      return 'No player with that code found on this device or leaderboard.';
    }

    const targetName = botName || all[otherUid!].username;

    me.sent = me.sent || [];
    if (!me.sent.some(s => s.code === c)) {
      me.sent.push({ username: targetName, code: c });
    }
    this.saveAccounts(all);

    if (otherUid) {
      all[otherUid].requests = all[otherUid].requests || [];
      if (!all[otherUid].requests.some(r => r.code === myUser.code)) {
        all[otherUid].requests.push({ username: myUser.username, code: myUser.code });
      }
      this.saveAccounts(all);
      return `Friend request sent to ${targetName}. They will see it when they log in on this device.`;
    }

    // Bot accepts after a small delay
    if (botName) {
      setTimeout(() => {
        const curr = this.getAccounts();
        const curMe = curr[myUser.uid];
        if (!curMe) return;
        curMe.sent = (curMe.sent || []).filter(s => s.code !== c);
        curMe.friends = curMe.friends || [];
        if (!curMe.friends.some(f => f.code === c)) {
          curMe.friends.push({ username: botName, code: c });
        }
        this.saveAccounts(curr);
        if (onBotAccept) onBotAccept(botName);
      }, 700);
      return `Friend request sent to ${botName}.`;
    }

    return 'Friend request sent.';
  }

  static acceptFriendRequest(myUid: string, reqCode: string) {
    const all = this.getAccounts();
    const me = all[myUid];
    if (!me) return;

    const req = (me.requests || []).find(r => r.code === reqCode);
    if (!req) return;

    me.requests = (me.requests || []).filter(r => r.code !== reqCode);
    me.friends = me.friends || [];
    if (!me.friends.some(f => f.code === reqCode)) {
      me.friends.push({ username: req.username, code: req.code });
    }

    const otherUid = Object.keys(all).find(k => all[k].code === reqCode);
    if (otherUid) {
      all[otherUid].friends = all[otherUid].friends || [];
      if (!all[otherUid].friends.some(f => f.code === me.code)) {
        all[otherUid].friends.push({ username: me.username, code: me.code });
      }
    }
    this.saveAccounts(all);
  }

  static declineFriendRequest(myUid: string, reqCode: string) {
    const all = this.getAccounts();
    const me = all[myUid];
    if (!me) return;
    me.requests = (me.requests || []).filter(r => r.code !== reqCode);
    this.saveAccounts(all);
  }

  /* Chat store */
  static getChat(path: string): ChatMessage[] {
    return store.get('chat_' + path, []);
  }

  static sendChat(path: string, who: string, text: string): ChatMessage[] {
    const msgs = this.getChat(path);
    const newMsg: ChatMessage = { who, text, at: Date.now() };
    const updated = [...msgs, newMsg].slice(-50);
    store.set('chat_' + path, updated);
    return updated;
  }

  /* Demo Rooms */
  static getDemoRooms(game?: GameId): DemoRoom[] {
    const all = store.get<DemoRoom[]>('rooms', []);
    return game ? all.filter(r => r.game === game) : all;
  }

  static createDemoRoom(game: GameId, host: string): DemoRoom {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const rooms = this.getDemoRooms();
    const newRoom: DemoRoom = {
      code,
      game,
      host,
      status: 'waiting',
      created: Date.now()
    };
    rooms.push(newRoom);
    store.set('rooms', rooms);
    return newRoom;
  }

  static joinDemoRoom(code: string): DemoRoom | null {
    const rooms = this.getDemoRooms();
    const r = rooms.find(x => x.code === code.trim());
    if (!r) return null;
    r.status = 'playing';
    store.set('rooms', rooms);
    return r;
  }

  static removeDemoRoom(code: string) {
    const rooms = this.getDemoRooms().filter(r => r.code !== code);
    store.set('rooms', rooms);
  }

  /* Leaderboard */
  static getLeaderboard(myUser: User | null): Array<{
    username: string;
    code: string;
    points: number;
    wins: number;
    me?: boolean;
  }> {
    const rows = BOT_NAMES.map((n, i) => ({
      username: n,
      code: botCode(i),
      points: 900 + ((i * 613) % 4200),
      wins: 20 + ((i * 29) % 180),
      me: false
    }));

    if (myUser) {
      const myPoints = this.getPoints(myUser.uid);
      const myWins = this.getTotalWins(myUser.uid);
      rows.push({
        username: myUser.username,
        code: myUser.code,
        points: myPoints,
        wins: myWins,
        me: true
      });
    }

    rows.sort((a, b) => b.points - a.points);
    return rows.slice(0, 50);
  }
}
