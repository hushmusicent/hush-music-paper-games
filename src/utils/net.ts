// Online layer for Hush Music Paper Games — Board-hub shape, pg_* paths.
//
// Built 2026-11-17: the React rewrite shipped with NO Firebase adapter at
// all (ProfileView saved fb_config but nothing read it; RoomsView's online
// box was a dead placeholder; VoiceBar only pretended to connect). This
// module is the missing layer, mirroring the Board hub's proven code:
//   - Firebase compat SDK v10.12.2, lazy-loaded from gstatic (no npm dep)
//   - Config is BUILT IN (2026-11-18, owner's decision) so every phone
//     opens already online — nobody has to paste anything. A config pasted
//     in Profile → Setup or on the login screen still wins over the
//     built-in one. If init fails (no network for the SDKs), the app
//     falls back to demo mode offline
//   - Real Firebase Auth, email + password (no anonymous sign-in)
//   - Rooms pg_rooms/<4-digit code> with whole-state sync, host starts the
//     game when seats fill, rejoin for players already seated
//   - Friends pg_codes / pg_requests / pg_friends, Top 50 as a pg_users
//     points query, chat pg_chats/<path>
//   - Voice is the pure-WebRTC mesh from the hand/board recipe (presence +
//     signaling under the room, Google STUN + openrelay TURN, AudioContext
//     remote gain 2.5). No LiveKit, no token worker, no keys to paste.
import { store, newCode, START_POINTS, DAILY_BONUS } from './store';
import type { GameId, User, UserStats } from '../types';

declare const firebase: any;

export interface FbConfig {
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

// Built-in Firebase config (owner's project — every phone opens online).
// These are public client keys (not secrets); the database rules are what
// protect the data. A pasted config still overrides this one.
export const BUILT_IN_FB_CONFIG: FbConfig = {
  apiKey: 'AIzaSyAhT_oPTtMTlUvHaSOf7zWvnUwTGyJf4sk',
  authDomain: 'project-556676b3-bbce-4e02-8ce.firebaseapp.com',
  databaseURL: 'https://project-556676b3-bbce-4e02-8ce-default-rtdb.firebaseio.com',
  projectId: 'project-556676b3-bbce-4e02-8ce',
  storageBucket: 'project-556676b3-bbce-4e02-8ce.firebasestorage.app',
  messagingSenderId: '1043689485585',
  appId: '1:1043689485585:web:a96258740de6856c5f88b0',
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

export const Backend = {
  mode: 'demo' as 'demo' | 'firebase',
  fb: null as any,
  auth: null as any,
  db: null as any,
  config: null as FbConfig | null,
  _initPromise: null as Promise<boolean> | null,

  configured(): boolean {
    const c = store.get<any>('fb_config', null) || BUILT_IN_FB_CONFIG;
    return !!(c && c.apiKey && c.databaseURL && c.projectId);
  },

  init(): Promise<boolean> {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      if (!this.configured()) return false;
      try {
        const cfg =
          store.get<FbConfig>('fb_config', null as unknown as FbConfig) ||
          BUILT_IN_FB_CONFIG;
        this.config = cfg;
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
        this.fb = firebase.initializeApp(cfg);
        this.auth = firebase.auth();
        this.db = firebase.database();
        this.mode = 'firebase';
        // Session restore: a signed-in user comes back as a User, not a uid.
        this.auth.onAuthStateChanged(async (fbUser: any) => {
          if (fbUser) {
            await NetAuth.refreshProfile();
          } else if (NetAuth.user) {
            NetAuth._setUser(null);
          }
        });
        return true;
      } catch (e) {
        console.warn('Firebase init failed', e);
        this.mode = 'demo';
        return false;
      }
    })();
    return this._initPromise;
  }
};

// ---------------------------------------------------------------------------
// Auth — Firebase Auth email/password in online mode. Demo mode keeps the
// hub's own local accounts (AppStore) untouched.
// ---------------------------------------------------------------------------
export const NetAuth = {
  user: null as User | null,
  _listeners: new Set<(u: User | null) => void>(),

  onUser(cb: (u: User | null) => void): () => void {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  },

  _setUser(u: User | null) {
    this.user = u;
    this._listeners.forEach(cb => {
      try {
        cb(u);
      } catch (e) {}
    });
  },

  async refreshProfile(): Promise<void> {
    const fbUser = Backend.auth && Backend.auth.currentUser;
    if (!fbUser) {
      this._setUser(null);
      return;
    }
    try {
      const snap = await Backend.db.ref('pg_users/' + fbUser.uid).get();
      const d = snap.val() || {};
      let code = d.code || '';
      if (!code) {
        code = await this._mintCode();
        const m: Record<string, any> = {};
        m['pg_users/' + fbUser.uid + '/code'] = code;
        m['pg_codes/' + code] = fbUser.uid;
        await Backend.db.ref().update(m);
      }
      this._setUser({
        uid: fbUser.uid,
        username: d.username || fbUser.displayName || 'Player',
        code
      });
    } catch (e) {
      console.warn('profile refresh failed', e);
    }
  },

  async _mintCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = newCode();
      const snap = await Backend.db.ref('pg_codes/' + code).get();
      if (!snap.exists()) return code;
    }
    return newCode();
  },

  async signup(email: string, username: string, pw: string): Promise<string | null> {
    try {
      const cred = await Backend.auth.createUserWithEmailAndPassword(email, pw);
      await cred.user.updateProfile({ displayName: username });
      const code = await this._mintCode();
      const m: Record<string, any> = {};
      m['pg_users/' + cred.user.uid] = {
        username,
        email: email.toLowerCase(),
        code,
        points: START_POINTS,
        wins: {},
        created: Date.now(),
        lastDaily: 0
      };
      m['pg_codes/' + code] = cred.user.uid;
      await Backend.db.ref().update(m);
      this._setUser({ uid: cred.user.uid, username, code });
      return null;
    } catch (e: any) {
      return (e && e.message) || 'Sign up failed.';
    }
  },

  async login(email: string, pw: string): Promise<string | null> {
    try {
      await Backend.auth.signInWithEmailAndPassword(email, pw);
      await this.refreshProfile();
      return null;
    } catch (e: any) {
      return (e && e.message) || 'Log in failed.';
    }
  },

  async logout(): Promise<void> {
    try {
      if (Backend.auth) await Backend.auth.signOut();
    } catch (e) {}
    this._setUser(null);
  },

  async updateUsername(name: string): Promise<void> {
    if (!this.user) return;
    try {
      await Backend.db.ref('pg_users/' + this.user.uid).update({ username: name });
      this._setUser({ ...this.user, username: name });
    } catch (e) {}
  },

  async erase(): Promise<void> {
    if (!this.user) return;
    const uid = this.user.uid;
    const code = this.user.code;
    try {
      const m: Record<string, any> = {};
      m['pg_users/' + uid] = null;
      if (code) m['pg_codes/' + code] = null;
      await Backend.db.ref().update(m);
    } catch (e) {}
    try {
      const fbUser = Backend.auth && Backend.auth.currentUser;
      if (fbUser) await fbUser.delete();
    } catch (e) {}
    this._setUser(null);
  }
};

// ---------------------------------------------------------------------------
// Rooms — pg_rooms/<4-digit code>, whole-state sync (Board/original pattern).
// Host starts the game when seats fill; a player already seated can rejoin
// a started game (no rejoin existed in the original single-file build).
// ---------------------------------------------------------------------------
export interface RoomDoc {
  code: string;
  game: GameId;
  seatsNeeded: number;
  seats: string[];
  names: Record<string, string>;
  state: any;
  turn: number;
  status: 'waiting' | 'playing' | 'over';
  host: string;
  created: number;
  rematch?: Record<string, boolean>;
}

export const Net = {
  room: null as RoomDoc | null,
  _off: null as (() => void) | null,
  _listeners: new Set<(room: RoomDoc | null) => void>(),

  onRoom(cb: (room: RoomDoc | null) => void): () => void {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  },

  _emit() {
    this._listeners.forEach(cb => {
      try {
        cb(this.room);
      } catch (e) {}
    });
  },

  mySeat(): number {
    if (!this.room || !NetAuth.user) return -1;
    return this.room.seats.indexOf(NetAuth.user.uid);
  },

  isHost(): boolean {
    return !!this.room && !!NetAuth.user && this.room.host === NetAuth.user.uid;
  },

  async create(game: GameId, seatsNeeded: number): Promise<string | null> {
    if (!NetAuth.user) return null;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const room: RoomDoc = {
      code,
      game,
      seatsNeeded,
      seats: [NetAuth.user.uid],
      names: { [NetAuth.user.uid]: NetAuth.user.username },
      state: null,
      turn: 0,
      status: 'waiting',
      host: NetAuth.user.uid,
      created: Date.now()
    };
    try {
      await Backend.db.ref('pg_rooms/' + code).set(room);
      store.set('lastroom', code);
      this.listen(code);
      return code;
    } catch (e) {
      console.warn('room create failed', e);
      return null;
    }
  },

  async join(code: string): Promise<{ ok: boolean; error?: string; rejoined?: boolean }> {
    const c = (code || '').trim();
    if (!NetAuth.user) return { ok: false, error: 'Log in first.' };
    if (!/^[0-9]{4}$/.test(c)) return { ok: false, error: 'Enter a 4-digit room code.' };
    try {
      const snap = await Backend.db.ref('pg_rooms/' + c).get();
      if (!snap.exists()) return { ok: false, error: 'Room not found.' };
      const room = snap.val() as RoomDoc;
      const alreadySeated = room.seats.includes(NetAuth.user.uid);
      if (alreadySeated) {
        // Rejoin: a started game lets its own players back in.
        store.set('lastroom', c);
        this.listen(c);
        return { ok: true, rejoined: room.status !== 'waiting' };
      }
      if (room.status !== 'waiting') return { ok: false, error: 'Game already started.' };
      if (room.seats.length >= room.seatsNeeded) return { ok: false, error: 'Room is full.' };
      room.seats.push(NetAuth.user.uid);
      room.names[NetAuth.user.uid] = NetAuth.user.username;
      await Backend.db.ref('pg_rooms/' + c + '/seats').set(room.seats);
      await Backend.db.ref('pg_rooms/' + c + '/names').set(room.names);
      store.set('lastroom', c);
      this.listen(c);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: (e && e.message) || 'Could not join.' };
    }
  },

  listen(code: string) {
    this.stopListen();
    const ref = Backend.db.ref('pg_rooms/' + code);
    const h = (snap: any) => {
      const v = snap.val();
      this.room = v ? (v as RoomDoc) : null;
      this._emit();
    };
    ref.on('value', h);
    this._off = () => {
      try {
        ref.off('value', h);
      } catch (e) {}
    };
  },

  stopListen() {
    if (this._off) {
      try {
        this._off();
      } catch (e) {}
      this._off = null;
    }
  },

  async push(patch: Record<string, any>): Promise<void> {
    if (!this.room) return;
    try {
      await Backend.db.ref('pg_rooms/' + this.room.code).update(patch);
    } catch (e) {
      console.warn('room push failed', e);
    }
  },

  async leave(silent: boolean): Promise<void> {
    // Silent leave (quit mid-game) keeps the room so the player can rejoin.
    // A host leaving a waiting room removes it. Leaving a finished room
    // declines any pending rematch so the other player is not left waiting.
    const room = this.room;
    const uid = NetAuth.user?.uid;
    if (room && !silent && this.isHost() && room.status === 'waiting') {
      try {
        await Backend.db.ref('pg_rooms/' + room.code).remove();
      } catch (e) {}
    } else if (room && room.status === 'over' && uid) {
      try {
        Backend.db
          .ref('pg_rooms/' + room.code + '/rematch/' + uid)
          .set(false)
          .catch(() => {});
      } catch (e) {}
    }
    this.stopListen();
    this.room = null;
    this._emit();
  }
};

// ---------------------------------------------------------------------------
// Points / wins — live on pg_users/<uid> in online mode. The winner's own
// client writes its own record (Board trust model: no server validation).
// ---------------------------------------------------------------------------
export const OnlinePoints = {
  async _read(uid: string): Promise<{ points: number; wins: Record<string, UserStats>; lastDaily: number } | null> {
    try {
      const snap = await Backend.db.ref('pg_users/' + uid).get();
      const d = snap.val();
      if (!d) return null;
      return {
        points: d.points ?? START_POINTS,
        wins: d.wins || {},
        lastDaily: d.lastDaily || 0
      };
    } catch (e) {
      return null;
    }
  },

  async get(uid: string): Promise<number> {
    const d = await this._read(uid);
    return d ? d.points : START_POINTS;
  },

  // Full profile row for Profile/Home views (points + per-game wins).
  async profile(uid: string): Promise<{
    points: number;
    wins: Record<string, UserStats>;
    lastDaily: number;
  } | null> {
    return this._read(uid);
  },

  async add(uid: string, n: number): Promise<number> {
    const d = await this._read(uid);
    const pts = (d ? d.points : START_POINTS) + n;
    try {
      await Backend.db.ref('pg_users/' + uid).update({ points: pts });
    } catch (e) {}
    return pts;
  },

  async record(uid: string, gameId: GameId, result: 'w' | 'l' | 't'): Promise<void> {
    const d = await this._read(uid);
    const wins = d ? d.wins : {};
    const cur = wins[gameId] || { w: 0, l: 0, t: 0 };
    cur[result]++;
    wins[gameId] = cur;
    try {
      await Backend.db.ref('pg_users/' + uid).update({ wins });
    } catch (e) {}
  },

  async canClaimDaily(uid: string): Promise<boolean> {
    const d = await this._read(uid);
    if (!d) return false;
    return d.lastDaily !== Math.floor(Date.now() / 864e5);
  },

  async claimDaily(uid: string): Promise<boolean> {
    if (!(await this.canClaimDaily(uid))) return false;
    const today = Math.floor(Date.now() / 864e5);
    try {
      await this.add(uid, DAILY_BONUS);
      await Backend.db.ref('pg_users/' + uid).update({ lastDaily: today });
      return true;
    } catch (e) {
      return false;
    }
  }
};

// ---------------------------------------------------------------------------
// Friends — pg_codes lookup, pg_requests, two-way pg_friends edges.
// ---------------------------------------------------------------------------
export interface FriendEntry {
  uid: string;
  username: string;
  code: string;
}

export const OnlineFriends = {
  async addByCode(myUser: User, code: string): Promise<string> {
    const c = (code || '').trim().toUpperCase();
    if (!c) return 'Enter a player code.';
    if (c === myUser.code) return 'That is your own code.';
    try {
      const snap = await Backend.db.ref('pg_codes/' + c).get();
      if (!snap.exists()) return 'No player with that code found.';
      const toUid = String(snap.val());
      const fSnap = await Backend.db.ref('pg_friends/' + myUser.uid + '/' + toUid).get();
      if (fSnap.exists()) return 'Already your friend.';
      await Backend.db.ref('pg_requests/' + toUid + '/' + myUser.uid).set({
        from: myUser.username,
        code: myUser.code,
        at: Date.now()
      });
      return 'Friend request sent.';
    } catch (e: any) {
      return (e && e.message) || 'Could not send request.';
    }
  },

  async list(uid: string): Promise<{
    friends: FriendEntry[];
    requests: FriendEntry[];
  }> {
    const friends: FriendEntry[] = [];
    const requests: FriendEntry[] = [];
    try {
      const fSnap = await Backend.db.ref('pg_friends/' + uid).get();
      const fKeys = fSnap.val() ? Object.keys(fSnap.val()) : [];
      for (const fid of fKeys) {
        const u = await Backend.db.ref('pg_users/' + fid).get();
        const d = u.val() || {};
        friends.push({ uid: fid, username: d.username || 'Player', code: d.code || '' });
      }
      const rSnap = await Backend.db.ref('pg_requests/' + uid).get();
      const rVal = rSnap.val() || {};
      for (const fromUid of Object.keys(rVal)) {
        const r = rVal[fromUid] || {};
        // Re-read the name live — the stored `from` can go stale on rename.
        const u = await Backend.db.ref('pg_users/' + fromUid).get();
        const d = u.val() || {};
        requests.push({
          uid: fromUid,
          username: d.username || r.from || 'Player',
          code: d.code || r.code || ''
        });
      }
    } catch (e) {}
    return { friends, requests };
  },

  async accept(myUid: string, fromUid: string): Promise<void> {
    const m: Record<string, any> = {};
    m['pg_friends/' + myUid + '/' + fromUid] = true;
    m['pg_friends/' + fromUid + '/' + myUid] = true;
    m['pg_requests/' + myUid + '/' + fromUid] = null;
    try {
      await Backend.db.ref().update(m);
    } catch (e) {}
  },

  async decline(myUid: string, fromUid: string): Promise<void> {
    try {
      await Backend.db.ref('pg_requests/' + myUid + '/' + fromUid).remove();
    } catch (e) {}
  },

  watchRequests(uid: string, cb: () => void): () => void {
    const ref = Backend.db.ref('pg_requests/' + uid);
    const h = () => cb();
    ref.on('value', h);
    return () => {
      try {
        ref.off('value', h);
      } catch (e) {}
    };
  },

  watchFriends(uid: string, cb: () => void): () => void {
    const ref = Backend.db.ref('pg_friends/' + uid);
    const h = () => cb();
    ref.on('value', h);
    return () => {
      try {
        ref.off('value', h);
      } catch (e) {}
    };
  }
};

// ---------------------------------------------------------------------------
// Leaderboard — the shared Top 50 is a live query over pg_users, NOT the
// pg_leaderboard node (the original build never read or wrote that node;
// the rules entry for it is harmless dead weight).
// ---------------------------------------------------------------------------
export interface BoardRow {
  username: string;
  code: string;
  points: number;
  wins: number;
  me?: boolean;
}

export const OnlineBoard = {
  async top50(myUid: string | null): Promise<BoardRow[]> {
    try {
      const s = await Backend.db.ref('pg_users').orderByChild('points').limitToLast(50).get();
      const rows: BoardRow[] = [];
      s.forEach((c: any) => {
        const d = c.val() || {};
        const wins = d.wins || {};
        const totalWins = Object.values(wins).reduce(
          (a: number, g: any) => a + (g.w || 0),
          0
        );
        rows.push({
          username: d.username || 'Player',
          code: d.code || '',
          points: d.points || 0,
          wins: totalWins,
          me: !!myUid && c.key === myUid
        });
      });
      rows.sort((a, b) => b.points - a.points);
      return rows;
    } catch (e) {
      return [];
    }
  }
};

// ---------------------------------------------------------------------------
// Chat — pg_chats/<path>, live in a room, localStorage in demo mode.
// Chat lives ONLY inside a live game (Hush, 2026-10-20): there is no lobby
// chat, and the ChatView stub stays a stub.
// ---------------------------------------------------------------------------
export const OnlineChat = {
  send(path: string, who: string, uid: string, text: string): void {
    try {
      Backend.db.ref('pg_chats/' + path).push({ who, uid, text, at: Date.now() });
    } catch (e) {}
  },

  listen(
    path: string,
    cb: (msgs: Array<{ who: string; text: string; at: number }>) => void
  ): () => void {
    const ref = Backend.db.ref('pg_chats/' + path).limitToLast(30);
    let msgs: Array<{ who: string; text: string; at: number }> = [];
    const h = (snap: any) => {
      const v = snap.val() || {};
      msgs = [...msgs, { who: v.who || 'Player', text: v.text || '', at: v.at || 0 }].slice(-30);
      cb(msgs);
    };
    ref.on('child_added', h);
    return () => {
      try {
        ref.off('child_added', h);
      } catch (e) {}
    };
  }
};

// ---------------------------------------------------------------------------
// Voice — pure WebRTC mesh over the same Firebase database (hand/board
// recipe, ported verbatim in behavior from the Board hub): no LiveKit, no
// token server, no API keys. Signaling lives under the room:
//   pg_rooms/<code>/voice_presence/<uid>  { name, session, muted, isSpeaking, ts }
//   pg_rooms/<code>/voice_signals/<uidA_uidB>  { offer, answer, cands }
// Only the lower uid offers (no glare race). Remote audio goes through a
// shared AudioContext gain (2.5) onto the speaker path — NOT an <audio>
// element, which Android Chrome routes to the earpiece. Speaking bars are
// presence-driven, not proof of sound: each peer row also reports the real
// media state (peer/track/wiring/ICE).
// ---------------------------------------------------------------------------
export interface VoicePeerInfo {
  name: string;
  muted: boolean;
  isSpeaking: boolean;
  mediaState: string;
}

export const Voice = {
  active: false,
  connecting: false,
  micMuted: false,
  speakerOff: false,
  stream: null as any,
  session: '',
  code: '',
  myUid: '',
  myName: '',
  peers: {} as Record<string, any>,
  present: {} as Record<string, boolean>,
  presenceInfo: {} as Record<string, { name: string; muted: boolean; isSpeaking: boolean }>,
  ctx: null as any,
  remoteGain: null as any,
  localAnalyser: null as any,
  _localSrc: null as any,
  speakTimer: null as any,
  _speakHold: 0,
  _mySpeaking: false,
  voiceError: '',
  sigError: '',
  _off: [] as Array<() => void>,
  _listeners: new Set<() => void>(),

  subscribe(fn: () => void): () => void {
    this._listeners.add(fn);
    return () => {
      this._listeners.delete(fn);
    };
  },

  _notify() {
    this._listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {}
    });
  },

  configured(): boolean {
    return Backend.mode === 'firebase';
  },

  _pairId(a: string, b: string): string {
    return [a, b].sort().join('_');
  },

  _sigRef(pair: string): any {
    return Backend.db.ref('pg_rooms/' + this.code + '/voice_signals/' + pair);
  },

  _presRef(uid?: string): any {
    return Backend.db.ref('pg_rooms/' + this.code + '/voice_presence/' + (uid || this.myUid));
  },

  peersList(): Array<{ uid: string; info: VoicePeerInfo }> {
    return Object.keys(this.presenceInfo).map(uid => ({
      uid,
      info: {
        ...this.presenceInfo[uid],
        mediaState: uid === this.myUid ? 'you' : this._mediaState(uid)
      }
    }));
  },

  async join(code: string, uid: string, username: string): Promise<boolean> {
    if (this.active) return true;
    if (!this.configured()) {
      this.voiceError = 'Voice talk needs Firebase (Profile → Setup).';
      this._notify();
      return false;
    }
    if (!code || !uid) return false;
    this.connecting = true;
    this.voiceError = '';
    this.sigError = '';
    this.code = String(code);
    this.myUid = String(uid);
    this.myName = username || 'Player';
    this.session = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    this._notify();
    try {
      // Capture ONCE and share that one stream with every peer connection.
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      try {
        if ((navigator as any).audioSession) {
          (navigator as any).audioSession.type = 'play-and-record';
        }
      } catch (e) {}
      // AudioContext, created inside the tap gesture: it feeds the local
      // speaking analyser and plays remote audio on the speaker/media path.
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AC();
        if (this.ctx.resume) {
          const r = this.ctx.resume();
          if (r && r.catch) r.catch(() => {});
        }
        this._localSrc = this.ctx.createMediaStreamSource(this.stream);
        this.localAnalyser = this.ctx.createAnalyser();
        this.localAnalyser.fftSize = 256;
        this._localSrc.connect(this.localAnalyser);
        this.remoteGain = this.ctx.createGain();
        this.remoteGain.gain.value = 2.5;
        this.remoteGain.connect(this.ctx.destination);
        if (!(window as any)._voiceResumeHooked) {
          (window as any)._voiceResumeHooked = true;
          const res = () => {
            try {
              if (this.ctx && this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume();
            } catch (e) {}
          };
          window.addEventListener('touchstart', res, { passive: true });
          window.addEventListener('click', res, { passive: true });
        }
      } catch (e) {
        console.warn(e);
      }
      const pres = this._presRef();
      await pres.set({
        name: this.myName,
        session: this.session,
        muted: false,
        isSpeaking: false,
        ts: Date.now()
      });
      try {
        pres.onDisconnect().remove();
      } catch (e) {}
      const pr = Backend.db.ref('pg_rooms/' + this.code + '/voice_presence');
      const addH = (snap: any) => {
        const id = String(snap.key);
        const v = snap.val() || {};
        this.present[id] = true;
        this.presenceInfo[id] = {
          name: v.name || 'Player',
          muted: !!v.muted,
          isSpeaking: !!v.isSpeaking
        };
        if (id !== this.myUid) this._onPeerSeen(id, v.session);
        this._notify();
      };
      const chgH = (snap: any) => {
        const id = String(snap.key);
        const v = snap.val() || {};
        if (id === this.myUid) return;
        this.presenceInfo[id] = {
          name: v.name || 'Player',
          muted: !!v.muted,
          isSpeaking: !!v.isSpeaking
        };
        // Session changed = that player rejoined: drop the old peer, start clean.
        const old = this.peers[id];
        if (old && old.session !== v.session) this._dropPeer(id);
        this._onPeerSeen(id, v.session);
        this._notify();
      };
      const remH = (snap: any) => {
        const id = String(snap.key);
        delete this.present[id];
        delete this.presenceInfo[id];
        if (id !== this.myUid) this._dropPeer(id);
        this._notify();
      };
      pr.on('child_added', addH);
      pr.on('child_changed', chgH);
      pr.on('child_removed', remH);
      this._off.push(() => pr.off('child_added', addH));
      this._off.push(() => pr.off('child_changed', chgH));
      this._off.push(() => pr.off('child_removed', remH));
      this.active = true;
      this.connecting = false;
      this.micMuted = false;
      this.speakerOff = false;
      this._notify();
      this._startSpeakPoll();
      return true;
    } catch (e: any) {
      console.warn(e);
      // Raw error first, always. NotAllowedError gets one actionable line
      // after it: the browser blocked the mic, so the fix is in site settings.
      const raw = 'Voice error: ' + (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : e);
      const hint =
        e && e.name === 'NotAllowedError'
          ? ' — allow the microphone for this site in your browser settings, reload, then try again.'
          : '';
      let diag = '';
      try {
        const inFrame = window.self !== window.top ? 'iframe' : 'top';
        const secure = (window as any).isSecureContext ? 'secure' : 'not-secure';
        let pol = '?';
        try {
          const pp = (document as any).permissionsPolicy;
          if (pp && pp.allowsFeature) pol = pp.allowsFeature('microphone') ? 'allowed' : 'blocked';
        } catch (e2) {}
        let perm = '?';
        try {
          const q = await (navigator as any).permissions.query({ name: 'microphone' });
          perm = q.state;
        } catch (e2) {}
        diag = ' [frame:' + inFrame + ' ' + secure + ' mic-policy:' + pol + ' perm:' + perm + ']';
      } catch (e2) {}
      this._teardown();
      this.voiceError = raw + hint + diag;
      this._notify();
      return false;
    }
  },

  _onPeerSeen(uid: string, session: string) {
    if (!session) return; // presence without a session stamp is stale — wait for its change event
    const old = this.peers[uid];
    if (old) {
      if (old.session === session) return;
      this._dropPeer(uid);
    }
    this._createPeer(uid, session);
  },

  _createPeer(uid: string, session: string) {
    const pair = this._pairId(this.myUid, uid);
    // ICE: Google STUN first (direct phone-to-phone whenever possible),
    // plus a free public TURN relay as fallback. If this phone's browser
    // rejects the full server list (some WebViews do), fall back to
    // STUN-only rather than dying silently with no peer, no answer, and
    // no candidates while presence keeps working fine.
    let pc: any = null;
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
          { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
        ]
      });
    } catch (e1) {
      try {
        pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      } catch (e2: any) {
        this.sigError = 'peer connection failed: ' + (e2 && e2.message ? e2.message : e2);
        this._notify();
        return;
      }
    }
    const peer: any = { pc, session, pending: [] as any[] };
    this.peers[uid] = peer;
    try {
      this.stream.getAudioTracks().forEach((t: any) => {
        t.enabled = !this.micMuted;
        pc.addTrack(t, this.stream);
      });
      if (pc.getTransceivers) {
        pc.getTransceivers().forEach((tc: any) => {
          if (tc.direction && tc.direction !== 'sendrecv') {
            tc.direction = 'sendrecv';
          }
        });
      }
    } catch (e) {}
    pc.onicecandidate = (ev: any) => {
      if (ev.candidate) {
        try {
          const r: any = this._sigRef(pair)
            .child('cands')
            .push({ from: this.myUid, session: this.session, cand: ev.candidate.toJSON() });
          if (r && r.catch) {
            r.catch((e: any) => {
              this.sigError = 'signal write failed: ' + (e && e.message ? e.message : e);
              this._notify();
            });
          }
        } catch (e) {}
      }
    };
    // Remote audio goes through the shared remote gain (speaker path) so
    // the speaker/deafen button can silence it. No remote analyser: remote
    // Speaking comes from presence. Wired through _wireRemoteAudio,
    // re-wired on track.onunmute, with a playing HTML media bridge element
    // to activate Chromium's WebRTC audio sink.
    pc.ontrack = (ev: any) => {
      try {
        const track = ev.track;
        let rs = ev.streams && ev.streams[0] ? ev.streams[0] : null;
        if (!rs) {
          rs = new MediaStream([track]);
        } else if (track && !rs.getAudioTracks().some((t: any) => t.id === track.id)) {
          try {
            rs.addTrack(track);
          } catch (e) {}
        }
        peer.remoteStream = rs;
        peer.remoteTrack = track;
        if (track) {
          track.onunmute = () => {
            this._wireRemoteAudio(peer);
            this._notify();
          };
          track.onended = () => {
            this._notify();
          };
        }
        this._wireRemoteAudio(peer);
        this._notify();
      } catch (e) {
        console.warn(e);
      }
    };
    pc.oniceconnectionstatechange = () => {
      try {
        this._notify();
      } catch (e) {}
    };
    const sig = this._sigRef(pair);
    const valH = async (snap: any) => {
      const v = snap.val() || {};
      if (peer._sigBusy) return; // async handler: never overlap two runs
      try {
        if (
          v.offer &&
          v.offer.from !== this.myUid &&
          v.offer.session === peer.session &&
          pc.signalingState === 'stable' &&
          !peer.offerAnswered
        ) {
          peer._sigBusy = true;
          await pc.setRemoteDescription(new RTCSessionDescription({ type: v.offer.type, sdp: v.offer.sdp }));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          try {
            await sig.child('answer').set({ from: this.myUid, session: this.session, sdp: ans.sdp, type: ans.type });
            peer.offerAnswered = true;
          } catch (e: any) {
            this.sigError = 'answer write failed: ' + (e && e.message ? e.message : e);
            this._notify();
          }
          this._flushPending(peer);
        } else if (
          v.answer &&
          v.answer.from !== this.myUid &&
          v.answer.session === peer.session &&
          pc.signalingState === 'have-local-offer'
        ) {
          peer._sigBusy = true;
          await pc.setRemoteDescription(new RTCSessionDescription({ type: v.answer.type, sdp: v.answer.sdp }));
          this._flushPending(peer);
        }
      } catch (e: any) {
        this.sigError = 'voice negotiation failed: ' + (e && e.message ? e.message : e);
        this._notify();
        console.warn(e);
      } finally {
        peer._sigBusy = false;
      }
    };
    sig.on('value', valH);
    const candH = (snap: any) => {
      const c = snap.val() || {};
      if (c.from === this.myUid) return;
      if (c.session && c.session !== peer.session) return;
      if (!c.cand) return;
      if (pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(c.cand)).catch(() => {});
      else peer.pending.push(c.cand);
    };
    sig.child('cands').on('child_added', candH);
    peer._off = () => {
      try {
        sig.off('value', valH);
      } catch (e) {}
      try {
        sig.child('cands').off('child_added', candH);
      } catch (e) {}
    };
    // Only the lower uid offers — the other side answers. Deterministic,
    // so a race can never leave both sides in have-local-offer.
    if (this.myUid < uid) {
      (async () => {
        try {
          const off = await pc.createOffer({ offerToReceiveAudio: true });
          await pc.setLocalDescription(off);
          await sig.child('offer').set({ from: this.myUid, session: this.session, sdp: off.sdp, type: off.type });
        } catch (e: any) {
          this.sigError = 'offer write failed: ' + (e && e.message ? e.message : e);
          this._notify();
          console.warn(e);
        }
      })();
    }
    this._notify();
  },

  _wireRemoteAudio(peer: any) {
    if (!peer || !peer.remoteStream) return;
    if (!this.ctx || !this.remoteGain) return; // retried via ontrack once the context exists
    if (this.ctx.state === 'suspended' && this.ctx.resume) {
      const r = this.ctx.resume();
      if (r && r.catch) r.catch(() => {});
    }
    // Chromium WebRTC workaround: Chromium only starts decoding incoming
    // WebRTC RTP audio into createMediaStreamSource if an HTMLMediaElement
    // is attached and playing.
    const isChromium =
      !!((window as any).chrome) || /Chrome|Chromium|Android|CriOS/i.test(navigator.userAgent);
    if (isChromium) {
      if (!peer.audioBridge) {
        const el = document.createElement('audio');
        el.autoplay = true;
        (el as any).playsInline = true;
        el.setAttribute('playsinline', 'true');
        el.muted = true;
        el.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;';
        document.body.appendChild(el);
        peer.audioBridge = el;
      }
      try {
        if (peer.audioBridge.srcObject !== peer.remoteStream) {
          peer.audioBridge.srcObject = peer.remoteStream;
        }
        const p = peer.audioBridge.play();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    }
    try {
      if (peer.audioNodes && peer.audioNodes.src) peer.audioNodes.src.disconnect();
    } catch (e) {}
    try {
      const rsrc = this.ctx.createMediaStreamSource(peer.remoteStream);
      rsrc.connect(this.remoteGain);
      peer.audioNodes = { src: rsrc };
    } catch (e) {
      console.warn(e);
    }
  },

  // Truth signal for "is the mic hooked to the speakers": presence and
  // Speaking bars say nothing about the audio path, so each remote row
  // reports the actual media state — peer, track, wiring, ICE.
  _mediaState(uid: string): string {
    const peer = this.peers[uid];
    if (!peer) return 'no peer yet';
    const ice = (peer.pc && peer.pc.iceConnectionState) || '?';
    if (!peer.remoteStream) return 'waiting for audio · ice: ' + ice;
    if (!peer.audioNodes) return 'track arrived, NOT wired to speakers';
    let ts = '';
    try {
      const tr =
        peer.remoteStream.getAudioTracks && peer.remoteStream.getAudioTracks()[0]
          ? peer.remoteStream.getAudioTracks()[0]
          : null;
      if (tr) ts = ' · track: ' + (tr.enabled ? (tr.muted ? 'muted' : 'live') : 'disabled') + '/' + tr.readyState;
      else ts = ' · track: none';
    } catch (e) {}
    return 'audio wired to speakers · ice: ' + ice + ts;
  },

  _flushPending(peer: any) {
    const list = peer.pending || [];
    peer.pending = [];
    list.forEach((c: any) => {
      try {
        peer.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      } catch (e) {}
    });
  },

  _dropPeer(uid: string) {
    const peer = this.peers[uid];
    if (!peer) return;
    try {
      if (peer._off) peer._off();
    } catch (e) {}
    try {
      peer.pc.close();
    } catch (e) {}
    try {
      if (peer.audioNodes && peer.audioNodes.src) peer.audioNodes.src.disconnect();
    } catch (e) {}
    try {
      if (peer.audioBridge) {
        peer.audioBridge.pause();
        peer.audioBridge.srcObject = null;
        if (peer.audioBridge.parentNode) peer.audioBridge.parentNode.removeChild(peer.audioBridge);
      }
    } catch (e) {}
    delete this.peers[uid];
    this._notify();
  },

  toggleMic() {
    if (!this.active || !this.stream) return;
    this.micMuted = !this.micMuted;
    if (this.micMuted) this._mySpeaking = false;
    try {
      this.stream.getAudioTracks().forEach((t: any) => {
        t.enabled = !this.micMuted;
      });
    } catch (e) {}
    try {
      this._presRef().update({ muted: this.micMuted, isSpeaking: false });
    } catch (e) {}
    this._notify();
  },

  toggleDeafen() {
    if (!this.active) return;
    this.speakerOff = !this.speakerOff;
    try {
      if (this.remoteGain) this.remoteGain.gain.value = this.speakerOff ? 0 : 2.5;
    } catch (e) {}
    this._notify();
  },

  _startSpeakPoll() {
    try {
      if (this.speakTimer) clearInterval(this.speakTimer);
    } catch (e) {}
    if (!this.localAnalyser) return;
    const buf = new Uint8Array(this.localAnalyser.frequencyBinCount);
    this.speakTimer = setInterval(() => {
      if (!this.active || !this.localAnalyser) return;
      try {
        this.localAnalyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const avg = buf.length ? sum / buf.length : 0;
        const speaking = avg > 14;
        if (speaking) this._speakHold = 3;
        else if (this._speakHold > 0) this._speakHold--;
        const isSpeaking = speaking || this._speakHold > 0;
        if (isSpeaking !== this._mySpeaking) {
          this._mySpeaking = isSpeaking;
          try {
            this._presRef().update({ isSpeaking });
          } catch (e) {}
          this._notify();
        }
      } catch (e) {}
    }, 200);
  },

  leave() {
    this._teardown();
    this._notify();
  },

  _teardown() {
    try {
      if (this.speakTimer) clearInterval(this.speakTimer);
    } catch (e) {}
    this.speakTimer = null;
    this._off.forEach(fn => {
      try {
        fn();
      } catch (e) {}
    });
    this._off = [];
    // Remove the signal docs for every pair we took part in, then drop peers.
    const peerUids = Object.keys(this.peers);
    if (this.code && this.myUid) {
      peerUids.forEach(uid => {
        try {
          this._sigRef(this._pairId(this.myUid, uid)).remove().catch(() => {});
        } catch (e) {}
      });
    }
    peerUids.forEach(uid => this._dropPeer(uid));
    this.peers = {};
    this.present = {};
    this.presenceInfo = {};
    try {
      if (this.code && this.myUid) {
        this._presRef().remove().catch(() => {});
      }
    } catch (e) {}
    try {
      if (this.stream) this.stream.getTracks().forEach((t: any) => t.stop());
    } catch (e) {}
    this.stream = null;
    try {
      if (this.ctx && this.ctx.close) this.ctx.close().catch(() => {});
    } catch (e) {}
    this.ctx = null;
    this.remoteGain = null;
    this.localAnalyser = null;
    this._localSrc = null;
    this.active = false;
    this.connecting = false;
    this.micMuted = false;
    this.speakerOff = false;
    this._mySpeaking = false;
    this._speakHold = 0;
    this.code = '';
    this.myUid = '';
    this.myName = '';
    this.session = '';
  }
};
