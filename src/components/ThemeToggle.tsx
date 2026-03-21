import { AnimatePresence, motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyTheme,
  getStoredRecentThemeIds,
  getStoredThemeId,
  rememberRecentTheme,
  THEMES,
  THEME_CHANGE_EVENT,
  type ThemeOption,
} from '../lib/appearance';
import { cn } from '../lib/utils';

function ThemeSwatches({ theme }: { theme: ThemeOption }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: theme.bg }} />
      <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: theme.main }} />
      <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: theme.accent }} />
    </span>
  );
}

export function ThemeToggle() {
  const [themeId, setThemeId] = useState(getStoredThemeId);
  const [recentThemeIds, setRecentThemeIds] = useState<string[]>(() => getStoredRecentThemeIds());
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = useMemo(
    () => THEMES.find((theme) => theme.id === themeId) ?? THEMES[0],
    [themeId]
  );

  const recentThemes = useMemo(
    () =>
      recentThemeIds
        .map((recentId) => THEMES.find((theme) => theme.id === recentId))
        .filter((theme): theme is ThemeOption => Boolean(theme))
        .slice(0, 6),
    [recentThemeIds]
  );

  const orderedThemes = useMemo(() => {
    const recentIndex = new Map(recentThemeIds.map((recentId, index) => [recentId, index]));

    return [...THEMES].sort((leftTheme, rightTheme) => {
      const leftScore = (leftTheme.id === themeId ? 100 : 0) + (recentIndex.has(leftTheme.id) ? 30 - (recentIndex.get(leftTheme.id) ?? 0) : 0);
      const rightScore = (rightTheme.id === themeId ? 100 : 0) + (recentIndex.has(rightTheme.id) ? 30 - (recentIndex.get(rightTheme.id) ?? 0) : 0);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return leftTheme.name.localeCompare(rightTheme.name);
    });
  }, [recentThemeIds, themeId]);

  const syncThemeState = useCallback(() => {
    setThemeId(getStoredThemeId());
    setRecentThemeIds(getStoredRecentThemeIds());
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      syncThemeState();
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, [syncThemeState]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleThemeSelect = (nextThemeId: string) => {
    setThemeId(nextThemeId);
    setRecentThemeIds(rememberRecentTheme(nextThemeId));
    applyTheme(nextThemeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group inline-flex items-center gap-2 rounded-full border border-(--sub-color)/12 bg-(--main-color)/4 px-3 py-2 text-xs font-medium text-(--sub-color) transition-all hover:border-(--sub-color)/20 hover:text-(--main-color)"
        title="Тақырыпты жылдам ауыстыру"
      >
        <Palette size={13} className="text-(--accent-color)" />
        <span className="max-w-28 truncate text-left text-(--main-color)">{currentTheme.name}</span>
        <ThemeSwatches theme={currentTheme} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button
              type="button"
              aria-label="Тақырып терезесін жабу"
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.985 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute bottom-full right-0 z-40 mb-3 w-[min(22rem,calc(100vw-2rem))]"
            >
              <div className="overflow-hidden rounded-[1.6rem] border border-(--sub-color)/12 bg-(--bg-color)/96 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <div className="text-[0.62rem] font-medium uppercase tracking-[0.24em] text-(--sub-color)/70">
                      Тақырыптар
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-(--main-color)">
                      <span className="truncate">{currentTheme.name}</span>
                      <ThemeSwatches theme={currentTheme} />
                    </div>
                  </div>
                  <div className="rounded-full bg-(--main-color)/5 px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-(--sub-color)">
                    {THEMES.length} тақырып
                  </div>
                </div>

                {recentThemes.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-2 px-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-(--sub-color)/68">
                      Соңғылар
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentThemes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleThemeSelect(theme.id)}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[0.72rem] transition-colors',
                            theme.id === themeId
                              ? 'border-(--accent-color)/35 bg-(--main-color)/6 text-(--main-color)'
                              : 'border-(--sub-color)/10 text-(--sub-color) hover:border-(--sub-color)/18 hover:text-(--main-color)'
                          )}
                        >
                          <ThemeSwatches theme={theme} />
                          <span className="max-w-24 truncate">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {orderedThemes.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleThemeSelect(theme.id)}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all',
                          theme.id === themeId
                            ? 'border-(--accent-color)/35 bg-(--main-color)/6 text-(--main-color)'
                            : 'border-(--sub-color)/10 text-(--sub-color) hover:border-(--sub-color)/18 hover:bg-(--main-color)/4 hover:text-(--main-color)'
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{theme.name}</span>
                          <span className="mt-1 flex items-center gap-2">
                            <ThemeSwatches theme={theme} />
                          </span>
                        </span>
                        {theme.id === themeId && <Check size={14} className="shrink-0 text-(--accent-color)" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
