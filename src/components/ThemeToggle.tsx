import { Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

const THEMES = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'nord', name: 'Nord' },
  { id: 'serika-dark', name: 'Serika Dark' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');

    if (theme === 'light' || theme === 'dark') {
      root.classList.add(theme);
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
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
          <div className="absolute right-0 mt-2 w-40 py-2 bg-[var(--bg-color)] border border-[var(--sub-color)]/20 rounded-lg shadow-xl z-20">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
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
