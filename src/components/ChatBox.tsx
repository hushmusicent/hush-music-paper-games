import React, { useState, useEffect, useRef } from 'react';
import { AppStore } from '../utils/store';
import { ChatMessage, User } from '../types';
import { Sound } from '../utils/sound';

interface ChatBoxProps {
  chatPath: string;
  user: User | null;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ chatPath, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    AppStore.getChat(chatPath)
  );
  const [inputVal, setInputVal] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(AppStore.getChat(chatPath));
  }, [chatPath]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text || !user) return;
    Sound.click();
    const updated = AppStore.sendChat(chatPath, user.username, text);
    setMessages(updated);
    setInputVal('');
  };

  return (
    <div className="mt-2">
      <div
        ref={logRef}
        className="bg-[var(--bg2)] border border-[var(--line)] rounded-xl p-2 max-h-[180px] overflow-y-auto mb-2 space-y-1.5"
      >
        {messages.length === 0 ? (
          <div className="text-[var(--muted)] text-xs italic py-2 text-center">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className="bg-[var(--bg2)] border-l-2 border-[var(--ink)] pl-2 pr-2 py-1 rounded-r-lg text-sm text-[var(--text)]"
            >
              <span className="text-[var(--ink2)] font-bold text-xs mr-1.5">
                {m.who}
              </span>
              <span>{m.text}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 items-center">
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message…"
          maxLength={200}
          className="flex-1 bg-[var(--bg2)] border border-[var(--line)] text-[var(--text)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ink)]"
        />
        <button
          onClick={handleSend}
          className="btn small whitespace-nowrap !m-0"
        >
          Send
        </button>
      </div>
    </div>
  );
};
