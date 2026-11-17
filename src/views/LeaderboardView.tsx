import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { AppStore } from '../utils/store';
import { Backend, OnlineBoard, type BoardRow } from '../utils/net';

interface LeaderboardViewProps {
  user: User | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ user }) => {
  const [fbRows, setFbRows] = useState<BoardRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Backend.mode !== 'firebase') return;
    let alive = true;
    setLoading(true);
    OnlineBoard.top50(user?.uid ?? null)
      .then(rows => {
        if (!alive) return;
        setFbRows(rows);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setFbRows([]);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  if (Backend.mode === 'firebase') {
    const rows = fbRows ?? [];
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-[var(--ink2)]">🏆 Top 50</h2>

        <div className="card">
          {loading ? (
            <div className="text-[var(--muted)] text-sm">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="lb">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Code</th>
                    <th>⭐</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r.me ? 'me' : ''}>
                      <td>{i + 1}</td>
                      <td>
                        {r.username} {r.me && ' (You)'}
                      </td>
                      <td className="font-mono text-xs">{r.code}</td>
                      <td className="font-bold text-[var(--cream)]">{r.points}</td>
                      <td>{r.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-[var(--muted)] text-xs mt-3">
              The shared board needs a connection — no players loaded yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  const rows = AppStore.getLeaderboard(user);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-[var(--ink2)]">🏆 Top 50</h2>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="lb">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Code</th>
                <th>⭐</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.me ? 'me' : ''}>
                  <td>{i + 1}</td>
                  <td>
                    {r.username} {r.me && ' (You)'}
                  </td>
                  <td className="font-mono text-xs">{r.code}</td>
                  <td className="font-bold text-[var(--cream)]">{r.points}</td>
                  <td>{r.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-[var(--muted)] text-xs mt-3">
          Demo board: seeded rivals + you. Connect Firebase for the shared Top
          50 (pg_leaderboard / pg_users).
        </div>
      </div>
    </div>
  );
};
