import React from 'react';
import { User } from '../types';

/**
 * Lobby chat was removed by design (Hush, 2026-10-20): text chat and voice
 * talk exist ONLY inside a live game — see the VoiceBar + "💬 Game chat"
 * ChatBox in GameActiveView. This stub stays so the old import path can
 * never quietly resurrect a lobby chat screen.
 */
interface ChatViewProps {
  user: User;
}

export const ChatView: React.FC<ChatViewProps> = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-[var(--ink2)]">💬 Chat</h2>
      <div className="card">
        <p className="text-sm">
          Chat and voice talk live inside the game — open any game and you'll
          find the game chat and 🎤 Join Voice Talk right on the game screen.
        </p>
      </div>
    </div>
  );
};
