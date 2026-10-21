import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AppStore } from '../utils/store';
import { Sound } from '../utils/sound';

interface FriendsViewProps {
  user: User;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ user }) => {
  const [friends, setFriends] = useState(() => AppStore.getFriends(user.uid));
  const [requests, setRequests] = useState(() => AppStore.getFriendRequests(user.uid));
  const [sent, setSent] = useState(() => AppStore.getSentRequests(user.uid));
  const [addCode, setAddCode] = useState('');
  const [msg, setMsg] = useState<{ text: string; isErr: boolean } | null>(null);

  useEffect(() => {
    AppStore.seedFriendRequests(user.uid);
    setRequests(AppStore.getFriendRequests(user.uid));
  }, [user.uid]);

  const refresh = () => {
    setFriends(AppStore.getFriends(user.uid));
    setRequests(AppStore.getFriendRequests(user.uid));
    setSent(AppStore.getSentRequests(user.uid));
  };

  const handleAccept = (code: string) => {
    Sound.win();
    AppStore.acceptFriendRequest(user.uid, code);
    refresh();
  };

  const handleDecline = (code: string) => {
    Sound.click();
    AppStore.declineFriendRequest(user.uid, code);
    refresh();
  };

  const handleAdd = () => {
    const c = addCode.trim().toUpperCase();
    if (!c) {
      setMsg({ text: 'Enter a player code.', isErr: true });
      return;
    }
    Sound.click();
    const res = AppStore.addFriendByCode(user, c, botName => {
      Sound.win();
      setMsg({
        text: `${botName} accepted your friend request! 🎉`,
        isErr: false
      });
      refresh();
    });

    if (res.startsWith('Friend request')) {
      setMsg({ text: res, isErr: false });
    } else {
      setMsg({ text: res, isErr: true });
    }
    setAddCode('');
    refresh();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-[var(--ink2)]">👥 Friends</h2>

      <div className="card space-y-2">
        <h3 className="font-bold text-base">📨 Friend requests</h3>
        {requests.length > 0 ? (
          requests.map(r => (
            <div
              key={r.code}
              className="flex items-center justify-between border-b border-[var(--line)] pb-2 text-sm"
            >
              <div>
                <b>{r.username}</b>{' '}
                <span className="text-[var(--muted)] text-xs">({r.code})</span>{' '}
                wants to be friends
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleAccept(r.code)}
                  className="btn small !m-0"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(r.code)}
                  className="btn secondary small !m-0"
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-[var(--muted)] text-xs">No waiting requests.</div>
        )}

        {sent.length > 0 && (
          <div className="text-[var(--muted)] text-xs pt-2">
            Sent, waiting: {sent.map(s => s.username).join(', ')}
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <h3 className="font-bold text-base">
          👥 Your friends ({friends.length})
        </h3>
        {friends.length > 0 ? (
          friends.map(f => (
            <div
              key={f.code}
              className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 text-sm"
            >
              <div>
                <b>{f.username}</b>{' '}
                <span className="text-[var(--muted)] text-xs">({f.code})</span>
              </div>
              <span className="ok text-xs">● friend</span>
            </div>
          ))
        ) : (
          <div className="text-[var(--muted)] text-xs">
            No friends yet — add one by player code below.
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <h3 className="font-bold text-base">➕ Add by player code</h3>
        <div className="text-[var(--muted)] text-xs leading-relaxed">
          Your code: <span className="codechip ml-1">{user.code}</span>
          <br />
          Demo mode: friends on this device get requests in their inbox. The
          seeded Top-50 rivals also accept requests (find codes on the Top 50
          board).
        </div>

        <input
          value={addCode}
          onChange={e => setAddCode(e.target.value.toUpperCase())}
          placeholder="Player code (e.g. BOT1074)"
          maxLength={8}
          className="w-full bg-[var(--bg2)] border border-[var(--line)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono font-bold"
        />

        {msg && (
          <div className={`text-xs ${msg.isErr ? 'err' : 'ok'}`}>{msg.text}</div>
        )}

        <button onClick={handleAdd} className="btn">
          Send friend request
        </button>
      </div>
    </div>
  );
};
