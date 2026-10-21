import React, { useState } from 'react';
import { User, GameId } from '../types';
import { GAMES_METADATA } from '../data/games';
import { AppStore, START_POINTS, DAILY_BONUS } from '../utils/store';
import { PaperPanel } from '../components/PaperPanel';
import { Sound } from '../utils/sound';

interface HomeViewProps {
  user: User | null;
  onLogin: (user: User) => void;
  onSelectGame: (gameId: GameId) => void;
  onPointsUpdate: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  onLogin,
  onSelectGame,
  onPointsUpdate
}) => {
  const [liUser, setLiUser] = useState('');
  const [liPw, setLiPw] = useState('');
  const [liErr, setLiErr] = useState('');

  const [suUser, setSuUser] = useState('');
  const [suPw, setSuPw] = useState('');
  const [suErr, setSuErr] = useState('');

  const [bonusClaimedNotice, setBonusClaimedNotice] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = liUser.trim();
    if (!u) {
      setLiErr('Enter your username.');
      return;
    }
    const res = AppStore.demoLogin(u, liPw);
    if (res.error) {
      setLiErr(res.error);
    } else if (res.user) {
      Sound.win();
      onLogin(res.user);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const u = suUser.trim();
    if (u.length < 2) {
      setSuErr('Username needs 2+ characters.');
      return;
    }
    const res = AppStore.demoSignup(u, suPw);
    if (res.error) {
      setSuErr(res.error);
    } else if (res.user) {
      Sound.win();
      onLogin(res.user);
    }
  };

  const handleClaimBonus = () => {
    if (!user) return;
    if (AppStore.claimDaily(user.uid)) {
      Sound.win();
      setBonusClaimedNotice(true);
      onPointsUpdate();
    }
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-[var(--ink2)] mb-2">
          ✏️ Hush Music Paper Games
        </h2>

        <PaperPanel>
          <h3 className="font-bold text-lg mb-1">📓 Welcome to the notebook!</h3>
          <p className="text-sm leading-relaxed text-[#22304a]">
            15 classic pen &amp; paper games — Dots and Boxes, Hangman, Ghost,
            Word Search, Taboo, Sprouts and more — with <b>🤖 vs Computer</b>,{' '}
            <b>👥 Pass &amp; Play</b> and <b>🌐 Online PvP</b> rooms, friends,
            text chat, voice talk, points and a Top 50 leaderboard.
          </p>
        </PaperPanel>

        <div className="card">
          <h3 className="font-bold text-base mb-2">🔑 Log in</h3>
          <form onSubmit={handleLogin} className="space-y-2">
            <div>
              <label className="text-xs text-[var(--muted)]">Username</label>
              <input
                value={liUser}
                onChange={e => setLiUser(e.target.value)}
                placeholder="Username"
                className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Password</label>
              <input
                type="password"
                value={liPw}
                onChange={e => setLiPw(e.target.value)}
                placeholder="Password (optional for demo)"
                className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
            {liErr && <div className="err text-xs">{liErr}</div>}
            <button type="submit" className="btn">
              Log in
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="font-bold text-base mb-2">✨ Sign up</h3>
          <form onSubmit={handleSignup} className="space-y-2">
            <div>
              <label className="text-xs text-[var(--muted)]">Username</label>
              <input
                value={suUser}
                onChange={e => setSuUser(e.target.value)}
                placeholder="Choose username"
                maxLength={20}
                className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Password</label>
              <input
                type="password"
                value={suPw}
                onChange={e => setSuPw(e.target.value)}
                placeholder="Password"
                className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
            {suErr && <div className="err text-xs">{suErr}</div>}
            <button type="submit" className="btn secondary">
              Create account (+{START_POINTS} ⭐)
            </button>
            <div className="text-[var(--muted)] text-xs mt-2">
              Demo mode: accounts live on this device. Connect Firebase in Profile
              → Setup for real logins, friends &amp; online play.
            </div>
          </form>
        </div>
      </div>
    );
  }

  const canClaim = AppStore.canClaimDaily(user.uid);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-[var(--ink2)] mb-2">
        ✏️ Hush Music Paper Games
      </h2>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-bold text-base">{user.username}</span>
            <span className="text-[var(--muted)] text-xs ml-2">· code:</span>
          </div>
          <span className="codechip">{user.code}</span>
        </div>

        {canClaim && !bonusClaimedNotice ? (
          <button onClick={handleClaimBonus} className="btn">
            🎁 Claim daily bonus +{DAILY_BONUS} ⭐
          </button>
        ) : (
          <div className="ok text-sm my-2">
            Daily bonus claimed ✓ — come back tomorrow.
          </div>
        )}

        <div className="text-[var(--muted)] text-xs mt-2">
          Every game: 🤖 vs Computer · 👥 Pass &amp; Play · 🌐 Online PvP room.
          Win PvC games to earn points.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {(Object.keys(GAMES_METADATA) as GameId[]).map(id => {
          const g = GAMES_METADATA[id];
          return (
            <div
              key={id}
              onClick={() => {
                Sound.click();
                onSelectGame(id);
              }}
              className="gamecard"
            >
              <div className="e">{g.icon}</div>
              <div className="n">{g.name}</div>
              <div className="t">{g.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
