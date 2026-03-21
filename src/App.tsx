import { onAuthStateChanged, User } from 'firebase/auth';
import { Keyboard, Trophy, Volume2, VolumeX, Gamepad2, Users, Settings as SettingsIcon, Download, BarChart3, Github, HeartHandshake, Mail, Code2 } from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Auth } from './components/Auth';
import { ErrorBoundary } from './components/ErrorBoundary';
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
      className={({ isActive }) => cn("hover:text-(--main-color) transition-colors p-1.5", isActive && "text-(--main-color)")}
      title={title}
    >
      <Icon size={20} />
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
        <header className="w-full max-w-[1000px] mx-auto px-4 h-16 sm:h-20 flex items-center justify-between mt-2 sm:mt-4">
          <Link 
            to="/"
            className="flex items-center gap-2 sm:gap-3 text-(--sub-color) hover:text-(--main-color) transition-colors cursor-pointer shrink-0"
          >
            <Keyboard size={24} strokeWidth={2.5} className="text-(--accent-color) sm:w-8 sm:h-8" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tighter lowercase font-sans">
              tezteru<span className="text-(--sub-color) font-normal text-xs sm:text-sm ml-1 sm:ml-2">kz</span>
            </h1>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-2 ml-4">
            <div className="flex items-center gap-2 sm:gap-4 text-(--sub-color)">
              <NavIconLink to="/arcade" title="Аркада" icon={Gamepad2} />
              <NavIconLink to="/multiplayer" title="Жарыс" icon={Users} />
              <NavIconLink to="/leaderboard" title="Көшбасшылар тақтасы" icon={Trophy} />
              <NavIconLink to="/stats" title="Статистика" icon={BarChart3} />
              <NavIconLink to="/settings" title="Баптаулар" icon={SettingsIcon} />
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="hover:text-(--main-color) transition-colors p-1.5"
                title={soundEnabled ? "Дыбысты өшіру" : "Дыбысты қосу"}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              {showInstallButton && (
                <button 
                  onClick={handleInstallClick}
                  className="hover:text-(--main-color) transition-colors text-(--accent-color) animate-bounce p-1.5"
                  title="Қосымшаны орнату"
                >
                  <Download size={20} />
                </button>
              )}
            </div>
            <div className="shrink-0 pl-2 border-l border-(--sub-color)/20">
              <Auth user={user} />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
          <AnimatedRoutes user={user} config={config} setConfig={setConfig} soundEnabled={soundEnabled} />
        </main>
        
        <footer className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 text-(--sub-color) text-sm border-t border-(--sub-color)/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <a href={SITE_LINKS.donate} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-(--sub-color)/15 bg-(--main-color)/4 px-4 py-3 hover:border-(--accent-color)/40 hover:text-(--main-color) transition-colors">
              <HeartHandshake size={18} className="text-(--accent-color)" />
              <span>Донат</span>
            </a>
            <a href={SITE_LINKS.githubProfile} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-(--sub-color)/15 bg-(--main-color)/4 px-4 py-3 hover:border-(--accent-color)/40 hover:text-(--main-color) transition-colors">
              <Github size={18} className="text-(--accent-color)" />
              <span>GitHub профилі</span>
            </a>
            <a href={SITE_LINKS.repository} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-(--sub-color)/15 bg-(--main-color)/4 px-4 py-3 hover:border-(--accent-color)/40 hover:text-(--main-color) transition-colors">
              <Code2 size={18} className="text-(--accent-color)" />
              <span>Жоба коды</span>
            </a>
            <a href={SITE_LINKS.emailHref} className="flex items-center gap-3 rounded-xl border border-(--sub-color)/15 bg-(--main-color)/4 px-4 py-3 hover:border-(--accent-color)/40 hover:text-(--main-color) transition-colors">
              <Mail size={18} className="text-(--accent-color)" />
              <span>{SITE_LINKS.email}</span>
            </a>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-4">
              <a href={SITE_LINKS.donate} target="_blank" rel="noreferrer" className="hover:text-(--main-color) transition-colors">Қолдау</a>
              <a href={SITE_LINKS.githubProfile} target="_blank" rel="noreferrer" className="hover:text-(--main-color) transition-colors">GitHub</a>
              <a href={SITE_LINKS.repository} target="_blank" rel="noreferrer" className="hover:text-(--main-color) transition-colors">Repository</a>
              <a href={SITE_LINKS.emailHref} className="hover:text-(--main-color) transition-colors">Байланыс</a>
            </div>
            <div className="text-[var(--sub-color)]/80">v2.0.0</div>
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
