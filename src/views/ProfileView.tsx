import React, { useState, useEffect } from 'react';
import { User, GameId, UserStats } from '../types';
import { AppStore, store, DAILY_BONUS } from '../utils/store';
import { Backend, NetAuth, OnlinePoints } from '../utils/net';
import { GAMES_METADATA, HEAD_TO_HEAD_GAMES } from '../data/games';
import { Modal } from '../components/Modal';
import { Sound } from '../utils/sound';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
  onPointsUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onLogout,
  onUserUpdated,
  onPointsUpdated
}) => {
  // Online points/wins live on pg_users — load them; demo stays local.
  // Guests have no Firebase user, so the online reads would come back
  // empty (0 points, no record) — they stay on the local store.
  const online = Backend.mode === 'firebase' && !AppStore.isGuest(user.uid);
  const isGuest = AppStore.isGuest(user.uid);
  const [fbProfile, setFbProfile] = useState<{
    points: number;
    wins: Record<string, UserStats>;
    lastDaily: number;
  } | null>(null);

  useEffect(() => {
    if (online) {
      OnlinePoints.profile(user.uid).then(setFbProfile).catch(() => {});
    }
  }, [online, user.uid]);

  const points = online ? fbProfile?.points ?? 0 : AppStore.getPoints(user.uid);
  const winsRecord = online ? fbProfile?.wins ?? {} : AppStore.getWins(user.uid);
  const totalWins = Object.values(winsRecord).reduce((s, g) => s + (g.w || 0), 0);
  const canClaim = online
    ? (fbProfile?.lastDaily ?? 0) !== Math.floor(Date.now() / 864e5)
    : AppStore.canClaimDaily(user.uid);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);

  const [fbConfigText, setFbConfigText] = useState(() =>
    JSON.stringify(store.get('fb_config', ''), null, 2)
  );
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleClaim = async () => {
    if (online) {
      if (await OnlinePoints.claimDaily(user.uid)) {
        Sound.win();
        OnlinePoints.profile(user.uid).then(setFbProfile).catch(() => {});
        onPointsUpdated();
      }
      return;
    }
    if (AppStore.claimDaily(user.uid)) {
      Sound.win();
      onPointsUpdated();
    }
  };

  const handleRename = async () => {
    const trimmed = newUsername.trim();
    if (trimmed.length < 2) return;
    if (online) {
      await NetAuth.updateUsername(trimmed);
      onUserUpdated({ ...user, username: trimmed });
    } else {
      AppStore.updateUsername(user.uid, trimmed);
      onUserUpdated({ ...user, username: trimmed });
    }
    setRenameModalOpen(false);
  };

  const handleErase = async () => {
    if (online) {
      await NetAuth.erase();
    } else {
      AppStore.eraseAccount(user.uid);
    }
    setEraseModalOpen(false);
    onLogout();
  };

  const handleSaveFirebase = () => {
    try {
      const parsed = JSON.parse(fbConfigText);
      store.set('fb_config', parsed);
      setSaveStatus('Firebase config saved! Reloading…');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setSaveStatus('Error: Invalid JSON format.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--ink2)]">👤 Profile</h2>

      <div className="card space-y-2">
        <h3 className="font-bold text-lg">{user.username}</h3>
        <div className="text-sm">
          Your player code: <span className="codechip ml-1">{user.code}</span>
        </div>
        <div className="text-[var(--muted)] text-xs pt-1">
          Points: <b className="text-[var(--cream)]">⭐ {points}</b> · Total
          wins: <b>{totalWins}</b> · Mode:{' '}
          <b>{online ? 'Online (Firebase)' : isGuest ? 'Guest (this device)' : 'Demo (this device)'}</b>
        </div>

        {canClaim && (
          <button onClick={handleClaim} className="btn">
            🎁 Claim daily bonus +{DAILY_BONUS} ⭐
          </button>
        )}

        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              Sound.click();
              setRenameModalOpen(true);
            }}
            className="btn secondary"
          >
            ✏️ Change username
          </button>
          <button onClick={onLogout} className="btn secondary">
            Log out
          </button>
          <button
            onClick={() => {
              Sound.click();
              setEraseModalOpen(true);
            }}
            className="btn danger"
          >
            🗑️ Erase account
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-base mb-2">📊 Your game record</h3>
        <div className="text-xs text-[var(--muted)] mb-2">
          🌐 = full online PvP · 👥 = party room (chat + voice, game on the
          host&apos;s phone)
        </div>
        <div className="overflow-x-auto">
          <table className="lb">
            <thead>
              <tr>
                <th>Game</th>
                <th>W</th>
                <th>L</th>
                <th>T</th>
                <th>Win %</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(GAMES_METADATA) as GameId[]).map(id => {
                const g = GAMES_METADATA[id];
                const s = winsRecord[id] || { w: 0, l: 0, t: 0 };
                const tot = s.w + s.l + s.t;
                const wr = tot ? Math.round((100 * s.w) / tot) : 0;
                return (
                  <tr key={id}>
                    <td>
                      {g.icon} {g.name}{' '}
                      {HEAD_TO_HEAD_GAMES.includes(id) ? '🌐' : '👥'}
                    </td>
                    <td>{s.w}</td>
                    <td>{s.l}</td>
                    <td>{s.t}</td>
                    <td>{tot ? `${wr}%` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {online ? (
        <div className="card">
          <div className="ok text-sm">✅ Firebase connected — online play is on.</div>
        </div>
      ) : isGuest ? (
        <div className="card space-y-2">
          <h3 className="font-bold text-base">🌐 Play online — free</h3>
          <div className="text-xs text-[var(--muted)] leading-relaxed">
            You&apos;re playing as a guest — your points and stats live only
            on this device. Log out and sign up free (email + username) to
            play online PvP, add friends, and keep your points on every phone.
          </div>
        </div>
      ) : (
        <div className="card space-y-2">
          <h3 className="font-bold text-base">⚙️ Setup — unlock online play</h3>
          <div className="text-xs text-[var(--muted)] leading-relaxed">
            Demo mode works fully offline. Paste your free Firebase web config
            JSON to unlock online PvP, friends, shared Top 50, and persistent
            storage.
          </div>

          {saveStatus && (
            <div className="msg text-xs font-semibold">{saveStatus}</div>
          )}

          <div>
            <label className="text-xs text-[var(--muted)]">
              Firebase config (JSON)
            </label>
            <textarea
              rows={4}
              value={fbConfigText}
              onChange={e => setFbConfigText(e.target.value)}
              placeholder='{"apiKey":"…","authDomain":"…","databaseURL":"…","projectId":"…","appId":"…"}'
              className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl p-2 text-xs font-mono text-[var(--text)]"
            />
            <button onClick={handleSaveFirebase} className="btn small">
              Save Firebase keys
            </button>
          </div>

          <div className="pt-2 text-xs text-[var(--muted)] leading-relaxed">
            🎤 Voice talk is built in — it runs phone-to-phone over the same
            Firebase connection, like the Hand and Board hubs. No worker URL or
            keys to paste; tap 🎤 Join Voice Talk inside a live game room.
          </div>
        </div>
      )}

      {/* Change username modal */}
      <Modal isOpen={renameModalOpen}>
        <h3 className="font-bold text-base mb-2">✏️ Change username</h3>
        <input
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          maxLength={20}
          className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)] mb-3"
        />
        <div className="flex gap-2">
          <button onClick={handleRename} className="btn flex-1">
            Save
          </button>
          <button
            onClick={() => setRenameModalOpen(false)}
            className="btn secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Erase account modal */}
      <Modal isOpen={eraseModalOpen}>
        <h3 className="font-bold text-base mb-2">🗑️ Erase account?</h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          This deletes your account, points, and stats. It cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={handleErase} className="btn danger flex-1">
            Erase everything
          </button>
          <button
            onClick={() => setEraseModalOpen(false)}
            className="btn secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};
