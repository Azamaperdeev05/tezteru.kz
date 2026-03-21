import { onAuthStateChanged, User } from 'firebase/auth';
import { Keyboard, Trophy, Volume2, VolumeX, Gamepad2, Users, Settings as SettingsIcon, Download, BarChart3, Github, HeartHandshake, Mail, Code2 } from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeToggle } from './components/ThemeToggle';
import { TypingTest } from './components/TypingTest';
import { auth } from './firebase';
import { TestConfig } from './hooks/useTypingTest';
import { SITE_LINKS } from './lib/site-links';
import { cn } from './lib/utils';

const Leaderboard = lazy(() => import('./components/Leaderboard').then((module) => ({ default: module.Leaderboard })));
const Profile = lazy(() => import('./components/Profile').then((module) => ({ default: module.Profile })));
const ArcadeMode = lazy(() => import('./components/ArcadeMode').then((module) => ({ default: module.ArcadeMode })));
const MultiplayerRace = lazy(() => import('./components/MultiplayerRace').then((module) => ({ default: module.MultiplayerRace })));
const Settings = lazy(() => import('./components/Settings').then((module) => ({ default: module.Settings })));
const StatsPage = lazy(() => import('./components/StatsPage').then((module) => ({ default: module.StatsPage })));

function RouteLoader() {
  return <div className="p-8 text-center text-[var(--sub-color)]">Бет жүктелуде...</div>;
}

function NavIconLink({ to, title, icon: Icon }: { to: string; title: string; icon: typeof Gamepad2 }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group inline-flex h-10 w-10 items-center justify-center rounded-full text-(--sub-color) transition-all hover:bg-(--main-color)/6 hover:text-(--main-color)',
          isActive && 'bg-(--main-color)/6 text-(--accent-color)'
        )
      }
      title={title}
    >
      <Icon size={18} className="transition-transform group-hover:scale-105" />
    </NavLink>
  );
}

function AnimatedRoutes({ user, config, setConfig, soundEnabled }: { user: User | null; config: TestConfig; setConfig: (config: TestConfig) => void; soundEnabled: boolean; }) {
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
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<TypingTest config={config} onConfigChange={setConfig} soundEnabled={soundEnabled} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/" />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/arcade" element={<ArcadeMode />} />
            <Route path="/multiplayer" element={<MultiplayerRace />} />
            <Route path="/settings" element={<Settings user={user} />} />
          </Routes>
        </Suspense>
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
        <header className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="group inline-flex items-center gap-3 text-(--sub-color) transition-colors hover:text-(--main-color)"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-(--accent-color)/20 bg-(--main-color)/4 transition-transform group-hover:scale-[1.02]">
                <Keyboard size={24} strokeWidth={2.4} className="text-(--accent-color)" />
              </div>
              <div className="leading-none">
                <div className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-(--sub-color)/80">
                  қазақша теру
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-[-0.08em] lowercase text-(--main-color)">
                  tezteru
                  <span className="ml-2 text-base font-medium tracking-[-0.03em] text-(--sub-color)">kz</span>
                </h1>
              </div>
            </Link>

            <div className="flex items-center justify-between gap-3 sm:gap-6">
              <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-(--sub-color)/10 bg-(--main-color)/3 px-2 py-1 text-(--sub-color)">
              <NavIconLink to="/arcade" title="Аркада" icon={Gamepad2} />
              <NavIconLink to="/multiplayer" title="Жарыс" icon={Users} />
              <NavIconLink to="/leaderboard" title="Көшбасшылар тақтасы" icon={Trophy} />
              <NavIconLink to="/stats" title="Статистика" icon={BarChart3} />
              <NavIconLink to="/settings" title="Баптаулар" icon={SettingsIcon} />
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-(--sub-color) transition-all hover:bg-(--main-color)/6 hover:text-(--main-color)"
                title={soundEnabled ? "Дыбысты өшіру" : "Дыбысты қосу"}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              {showInstallButton && (
                <button 
                  onClick={handleInstallClick}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-(--accent-color) transition-all hover:bg-(--main-color)/6 hover:text-(--main-color)"
                  title="Қосымшаны орнату"
                >
                  <Download size={18} />
                </button>
              )}
              </div>
              <div className="shrink-0 border-l border-(--sub-color)/12 pl-3 sm:pl-5">
                <Auth user={user} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 flex flex-col">
          <AnimatedRoutes user={user} config={config} setConfig={setConfig} soundEnabled={soundEnabled} />
        </main>
        
        <footer className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col gap-4 border-t border-(--sub-color)/10 pt-5 text-sm text-(--sub-color) sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href={SITE_LINKS.donate} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-(--main-color)">
                <HeartHandshake size={15} className="text-(--accent-color)" />
                <span>Донат</span>
              </a>
              <a href={SITE_LINKS.githubProfile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-(--main-color)">
                <Github size={15} className="text-(--accent-color)" />
                <span>GitHub</span>
              </a>
              <a href={SITE_LINKS.repository} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-(--main-color)">
                <Code2 size={15} className="text-(--accent-color)" />
                <span>Репозиторий</span>
              </a>
              <a href={SITE_LINKS.emailHref} className="inline-flex items-center gap-2 transition-colors hover:text-(--main-color)">
                <Mail size={15} className="text-(--accent-color)" />
                <span>{SITE_LINKS.email}</span>
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-(--sub-color)/75 sm:text-sm">
              <ThemeToggle />
              <span className="text-(--sub-color)/35">|</span>
              <span className="uppercase tracking-[0.22em]">v2.0.0</span>
            </div>
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
