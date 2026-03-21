import { Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import { THEMES, applyTheme, getStoredThemeId, rememberRecentTheme } from '../lib/appearance';
import { cn } from '../lib/utils';

export function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredThemeId);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full text-[var(--sub-color)] hover:text-[var(--main-color)] transition-colors"
        title="Тақырыпты өзгерту"
      >
        <Palette size={18} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 max-h-80 overflow-y-auto py-2 bg-[var(--bg-color)] border border-[var(--sub-color)]/20 rounded-lg shadow-xl z-20">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  rememberRecentTheme(t.id);
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  theme === t.id 
                    ? "text-[var(--accent-color)] bg-[var(--main-color)]/5" 
                    : "text-[var(--sub-color)] hover:text-[var(--main-color)] hover:bg-[var(--main-color)]/5"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
