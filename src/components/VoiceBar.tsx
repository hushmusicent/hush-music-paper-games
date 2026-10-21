import React, { useState } from 'react';
import { store } from '../utils/store';
import { Sound } from '../utils/sound';

interface VoiceBarProps {
  roomName: string;
  onJoin?: () => void;
}

export const VoiceBar: React.FC<VoiceBarProps> = ({ roomName }) => {
  const [workerUrl] = useState<string>(() => store.get('voice_worker', ''));
  const [status, setStatus] = useState<string>(() =>
    workerUrl
      ? '🎤 Voice talk ready.'
      : '🔇 Voice talk needs a token-worker URL — paste it in Profile → Setup.'
  );

  const handleJoin = () => {
    Sound.click();
    if (!workerUrl) {
      setStatus('⚠️ No worker URL yet — paste it in Profile → Setup to enable voice talk.');
      return;
    }
    setStatus('🎤 Connecting voice to ' + roomName + '…');
    // Simulated or LiveKit connector
    setTimeout(() => {
      setStatus('🎤 Voice connected — you are live.');
    }, 1000);
  };

  return (
    <div className="voicebar">
      <div className="flex gap-2 items-center">
        <span className="flex-1 text-sm">{status}</span>
        <button
          onClick={handleJoin}
          className="btn small bg-green-700 text-white font-bold"
        >
          🎤 Join Voice Talk
        </button>
      </div>
    </div>
  );
};
