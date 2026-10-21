import React from 'react';
import { User } from '../types';
import { VoiceBar } from '../components/VoiceBar';
import { ChatBox } from '../components/ChatBox';

interface ChatViewProps {
  user: User;
}

export const ChatView: React.FC<ChatViewProps> = ({ user }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-[var(--ink2)]">💬 Lobby chat</h2>

      <VoiceBar roomName="paper-lobby" />

      <div className="card">
        <h3 className="font-bold text-base mb-1">Everyone</h3>
        <ChatBox chatPath="lobby" user={user} />
        <div className="text-[var(--muted)] text-xs mt-3">
          Be kind. In demo mode, messages stay on this device. When Firebase is
          connected, messages are shared with everyone in the hub.
        </div>
      </div>
    </div>
  );
};
