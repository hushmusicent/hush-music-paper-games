import React, { useState, useEffect } from 'react';
import { GameId, GameMode, User } from './types';
import { AppStore } from './utils/store';
import { Sound } from './utils/sound';

import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { Modal } from './components/Modal';

import { HomeView } from './views/HomeView';
import { GameModeView } from './views/GameModeView';
import { GameActiveView } from './views/GameActiveView';
import { RoomsView } from './views/RoomsView';
import { LobbyView } from './views/LobbyView';
import { LeaderboardView } from './views/LeaderboardView';
import { FriendsView } from './views/FriendsView';
import { ProfileView } from './views/ProfileView';

type AppView =
  | 'home'
  | 'game_mode'
  | 'game_active'
  | 'rooms'
  | 'lobby'
  | 'leaderboard'
  | 'friends'
  | 'profile';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => AppStore.getCurrentUser());
  const [points, setPoints] = useState<number>(() =>
    user ? AppStore.getPoints(user.uid) : 0
  );
  const [muted, setMuted] = useState<boolean>(() => Sound.muted);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvc');
  const [dotsLevel, setDotsLevel] = useState<number>(1);
  const [hangLevel, setHangLevel] = useState<number>(1);
  const [sproutsDots, setSproutsDots] = useState<number>(3);
  const [roomCode, setRoomCode] = useState<string | undefined>();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Quit modal confirmation when clicking bottom nav while in game
  const [pendingNavTab, setPendingNavTab] = useState<NavTab | null>(null);

  useEffect(() => {
    if (user) {
      setPoints(AppStore.getPoints(user.uid));
    }
  }, [user]);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const refreshPoints = () => {
    if (user) {
      setPoints(AppStore.getPoints(user.uid));
    }
  };

  const handleToggleSound = () => {
    const isMuted = Sound.toggle();
    setMuted(isMuted);
  };

  const handleNavClick = (tab: NavTab) => {
    if (currentView === 'game_active') {
      setPendingNavTab(tab);
      return;
    }
    setCurrentView(tab);
    window.scrollTo(0, 0);
  };

  const handleConfirmQuitToTab = () => {
    if (pendingNavTab) {
      setCurrentView(pendingNavTab);
      setPendingNavTab(null);
      setSelectedGame(null);
      setRoomCode(undefined);
    }
  };

  const handleSelectGame = (gameId: GameId) => {
    setSelectedGame(gameId);
    setCurrentView('game_mode');
    window.scrollTo(0, 0);
  };

  const handleStartGame = (mode: GameMode, rCode?: string) => {
    setGameMode(mode);
    setRoomCode(rCode);
    setCurrentView('game_active');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <Header
        points={points}
        muted={muted}
        onToggleSound={handleToggleSound}
      />

      <main className="max-w-[640px] mx-auto p-3">
        {toastMsg && (
          <div className="msg sticky top-14 z-40 animate-in fade-in duration-200">
            {toastMsg}
          </div>
        )}

        {currentView === 'home' && (
          <HomeView
            user={user}
            onLogin={newUser => {
              setUser(newUser);
              setPoints(AppStore.getPoints(newUser.uid));
              showToast(`Welcome back, ${newUser.username}!`);
            }}
            onSelectGame={handleSelectGame}
            onPointsUpdate={refreshPoints}
          />
        )}

        {currentView === 'game_mode' && selectedGame && (
          <GameModeView
            gameId={selectedGame}
            onBack={() => setCurrentView('home')}
            onSelectMode={mode => handleStartGame(mode)}
            onBrowseRooms={() => setCurrentView('rooms')}
            onOnlineLobby={() => setCurrentView('lobby')}
            onDotsLevel={setDotsLevel}
            onHangLevel={setHangLevel}
            onSproutsDots={setSproutsDots}
          />
        )}

        {currentView === 'game_active' && selectedGame && user && (
          <GameActiveView
            gameId={selectedGame}
            mode={gameMode}
            user={user}
            roomCode={roomCode}
            dotsLevel={dotsLevel}
            hangLevel={hangLevel}
            sproutsDots={sproutsDots}
            onQuit={() => {
              setCurrentView('game_mode');
              setRoomCode(undefined);
            }}
            onPointsUpdated={refreshPoints}
          />
        )}

        {currentView === 'rooms' && selectedGame && (
          <RoomsView
            gameId={selectedGame}
            onBack={() => setCurrentView('game_mode')}
            onJoinRoom={code => {
              showToast(`Joined demo room ${code}!`);
              handleStartGame('hotseat', code);
            }}
          />
        )}

        {currentView === 'lobby' && selectedGame && user && (
          <LobbyView
            gameId={selectedGame}
            user={user}
            onBack={() => setCurrentView('game_mode')}
            onStartRoomGame={code => {
              showToast(`Demo room ${code} ready`);
              handleStartGame('hotseat', code);
            }}
          />
        )}

        {currentView === 'leaderboard' && <LeaderboardView user={user} />}

        {currentView === 'friends' && user && <FriendsView user={user} />}

        {currentView === 'profile' && user && (
          <ProfileView
            user={user}
            onLogout={() => {
              AppStore.logout();
              setUser(null);
              setPoints(0);
              setCurrentView('home');
              showToast('Logged out.');
            }}
            onUserUpdated={u => setUser(u)}
            onPointsUpdated={refreshPoints}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav
        currentTab={
          currentView === 'home' ||
          currentView === 'game_mode' ||
          currentView === 'game_active' ||
          currentView === 'rooms' ||
          currentView === 'lobby'
            ? 'home'
            : (currentView as NavTab)
        }
        onSelectTab={handleNavClick}
      />

      {/* Quit confirmation modal if navigating via bottom bar */}
      <Modal isOpen={!!pendingNavTab}>
        <h3 className="font-bold text-base mb-1">✏️ Quit game?</h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Are you sure you want to quit? Your progress in this game will be lost.
        </p>
        <div className="flex gap-2">
          <button onClick={handleConfirmQuitToTab} className="btn danger flex-1">
            Yes, quit
          </button>
          <button
            onClick={() => setPendingNavTab(null)}
            className="btn secondary flex-1"
          >
            Keep playing
          </button>
        </div>
      </Modal>
    </div>
  );
};
export default App;
