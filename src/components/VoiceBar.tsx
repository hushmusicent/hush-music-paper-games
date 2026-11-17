import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Backend, Voice } from '../utils/net';
import { Sound } from '../utils/sound';

interface VoiceBarProps {
  roomCode?: string;
  user?: User | null;
  // Back-compat: older call sites passed a roomName string. The mesh keys
  // off the room CODE, so roomName is accepted and ignored.
  roomName?: string;
}

// Real voice talk: the pure-WebRTC mesh from the hand/board recipe — no
// LiveKit, no token worker, nothing to paste. Voice lives ONLY inside a
// live game room, like chat. (The old bar only pretended to connect after
// a 1-second timer; this one actually opens the mic.)
export const VoiceBar: React.FC<VoiceBarProps> = ({ roomCode, user }) => {
  const [, forceRender] = useState(0);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const off = Voice.subscribe(() => forceRender(n => n + 1));
    return off;
  }, []);

  // Leaving the game drops voice with it.
  useEffect(() => {
    return () => {
      if (Voice.active) Voice.leave();
    };
  }, [roomCode]);

  if (Backend.mode !== 'firebase') {
    return (
      <div className="voicebar">
        <div className="flex gap-2 items-center">
          <span className="flex-1 text-sm">
            🔇 Voice talk unlocks with online play — connect Firebase in Profile → Setup.
          </span>
        </div>
      </div>
    );
  }

  if (!roomCode) {
    return (
      <div className="voicebar">
        <div className="flex gap-2 items-center">
          <span className="flex-1 text-sm">🎤 Voice talk joins with a room.</span>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    if (!user) return;
    Sound.click();
    setJoining(true);
    await Voice.join(roomCode, user.uid, user.username);
    setJoining(false);
  };

  const handleLeave = () => {
    Sound.click();
    Voice.leave();
  };

  const peers = Voice.peersList();

  return (
    <div className="voicebar">
      {!Voice.active ? (
        <div className="flex gap-2 items-center">
          <span className="flex-1 text-sm">
            {Voice.voiceError
              ? '⚠️ ' + Voice.voiceError
              : '🎤 Voice talk ready — talk to your opponent in this room.'}
          </span>
          <button
            onClick={handleJoin}
            className="btn small bg-green-700 text-white font-bold"
            disabled={joining || Voice.connecting}
          >
            {joining || Voice.connecting ? 'Connecting…' : '🎤 Join Voice Talk'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <span className="flex-1 text-sm font-bold">
              📻 Voice Connected · {peers.length} in call
            </span>
            <button
              onClick={() => {
                Sound.click();
                Voice.toggleMic();
              }}
              className="btn small"
            >
              {Voice.micMuted ? '🔇 Mic muted' : '🎤 Mic on'}
            </button>
            <button
              onClick={() => {
                Sound.click();
                Voice.toggleDeafen();
              }}
              className="btn small secondary"
            >
              {Voice.speakerOff ? '🔇 Speakers off' : '🔊 Speakers on'}
            </button>
            <button onClick={handleLeave} className="btn small secondary">
              Leave
            </button>
          </div>
          {peers.map(p => (
            <div key={p.uid} className="text-xs flex items-center gap-2">
              <span
                className={
                  p.info.isSpeaking
                    ? 'inline-block w-2.5 h-2.5 rounded-full bg-green-500'
                    : 'inline-block w-2.5 h-2.5 rounded-full bg-gray-400'
                }
              />
              <b>{p.info.name}</b>
              {p.uid === user?.uid ? ' (you)' : ''}
              {p.info.muted ? ' · 🔇 muted' : ''}
              {p.info.isSpeaking ? ' · speaking…' : ''}
              <span className="text-[var(--muted)]">· {p.info.mediaState}</span>
            </div>
          ))}
          {Voice.sigError && (
            <div className="text-xs err">⚠️ {Voice.sigError}</div>
          )}
          {Voice.voiceError && (
            <div className="text-xs err">⚠️ {Voice.voiceError}</div>
          )}
        </div>
      )}
    </div>
  );
};
