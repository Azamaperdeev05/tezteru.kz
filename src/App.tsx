import { onAuthStateChanged, User } from 'firebase/auth';
import { Keyboard, Trophy, User as UserIcon, Volume2, VolumeX, Gamepad2, Users, Settings as SettingsIcon, Download, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { TypingTest } from './components/TypingTest';
import { ArcadeMode } from './components/ArcadeMode';
import { MultiplayerRace } from './components/MultiplayerRace';
import { Settings } from './components/Settings';
import { StatsPage } from './components/StatsPage';
import { auth } from './firebase';
import { TestConfig } from './hooks/useTypingTest';
import { cn } from './lib/utils';

function AnimatedRoutes({ user, config, setConfig, soundEnabled }: any) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="w-full flex-1 flex flex-col justify-center"
      >
        <Routes location={location}>
          <Route path="/" element={<TypingTest config={config} onConfigChange={setConfig} soundEnabled={soundEnabled} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/" />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/arcade" element={<ArcadeMode />} />
          <Route path="/multiplayer" element={<MultiplayerRace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<TestConfig>({
    mode: 'time',
    amount: 30,
    punctuation: false,
    numbers: false,
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-(--accent-color) font-medium tracking-tight">Жүктелуде...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <header className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between mt-4">
          <Link 
            to="/"
            className="flex items-center gap-3 text-(--sub-color) hover:text-(--main-color) transition-colors cursor-pointer"
          >
            <Keyboard size={32} strokeWidth={2} className="text-(--accent-color)" />
            <h1 className="text-2xl font-bold tracking-tighter lowercase font-sans">tezteru<span className="text-(--sub-color) font-normal text-sm ml-2">kz</span></h1>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-(--sub-color)">
              <Link 
                to="/arcade"
                className={cn("hover:text-(--main-color) transition-colors", window.location.pathname === '/arcade' && "text-(--main-color)")}
                title="Аркада"
              >
                <Gamepad2 size={20} />
              </Link>
              <Link 
                to="/multiplayer"
                className={cn("hover:text-(--main-color) transition-colors", window.location.pathname === '/multiplayer' && "text-(--main-color)")}
                title="Жарыс"
              >
                <Users size={20} />
              </Link>
              <Link 
                to="/leaderboard"
                className={cn("hover:text-(--main-color) transition-colors", window.location.pathname === '/leaderboard' && "text-(--main-color)")}
                title="Көшбасшылар тақтасы"
              >
                <Trophy size={20} />
              </Link>
              <Link 
                to="/stats"
                className={cn("hover:text-(--main-color) transition-colors", window.location.pathname === '/stats' && "text-(--main-color)")}
                title="Статистика"
              >
                <BarChart3 size={20} />
              </Link>
              <Link 
                to="/settings"
                className={cn("hover:text-(--main-color) transition-colors", window.location.pathname === '/settings' && "text-(--main-color)")}
                title="Баптаулар"
              >
                <SettingsIcon size={20} />
              </Link>
              {user && (
                <Link 
                  to="/profile"
                  className={cn("hover:text-(--main-color) transition-colors", window.location.pathname === '/profile' && "text-(--main-color)")}
                  title="Профиль"
                >
                  <UserIcon size={20} />
                </Link>
              )}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="hover:text-(--main-color) transition-colors"
                title={soundEnabled ? "Дыбысты өшіру" : "Дыбысты қосу"}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              {showInstallButton && (
                <button 
                  onClick={handleInstallClick}
                  className="hover:text-(--main-color) transition-colors text-(--accent-color) animate-bounce"
                  title="Қосымшаны орнату"
                >
                  <Download size={20} />
                </button>
              )}
            </div>
            <Auth user={user} />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
          <AnimatedRoutes user={user} config={config} setConfig={setConfig} soundEnabled={soundEnabled} />
        </main>
        
        <footer className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center text-(--sub-color) text-sm">
          <div className="flex gap-4">
            <span className="hover:text-(--main-color) cursor-pointer transition-colors">✉ байланыс</span>
            <span className="hover:text-(--main-color) cursor-pointer transition-colors">⛑ қолдау</span>
            <span className="hover:text-(--main-color) cursor-pointer transition-colors">{"</>"} github</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-(--main-color) cursor-pointer transition-colors">v2.0.0</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
