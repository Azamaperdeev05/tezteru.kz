import { useEffect, useMemo, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { Bell, Check, ChevronRight, Clock3, Gamepad2, LogOut, Monitor, Palette, Settings as SettingsIcon, Shield, Star, Type, Volume2, X } from 'lucide-react';
import {
  THEMES,
  TYPING_FONT_OPTIONS,
  UI_FONT_OPTIONS,
  applyInterfaceFont,
  applyTheme,
  applyTypingFont,
  getStoredFavoriteThemeIds,
  getStoredInterfaceFontId,
  getStoredRecentThemeIds,
  getStoredThemeId,
  getStoredTypingFontId,
  rememberRecentTheme,
  toggleFavoriteTheme,
} from '../lib/appearance';
import { auth } from '../firebase';
import { getStoredSoundTheme, SOUND_THEMES, soundEngine, type SoundThemeId } from '../lib/sounds';
import { cn } from '../lib/utils';

type SettingsTab = 'appearance' | 'typing' | 'arcade' | 'account';
type ThemeFilter = 'all' | 'dark' | 'light' | 'favorites' | 'recent';
type MobileSheet = 'themes' | 'interface-fonts' | 'typing-fonts' | null;

const TYPING_PREVIEW = 'кіші бейбітшілік дейін өмір достық жаман уақыт айналасында жанында бір университет сондықтан түн ай жұмыс жел үшін бірақ';

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Palette }> = [
  { id: 'appearance', label: 'Сыртқы түрі', icon: Palette },
  { id: 'typing', label: 'Жазу баптаулары', icon: Type },
  { id: 'arcade', label: 'Аркада режимі', icon: Gamepad2 },
  { id: 'account', label: 'Аккаунт', icon: Shield },
];

const TOGGLE_ROW_CLASS = 'flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors';

type SettingsProps = {
  user?: User | null;
};

export function Settings({ user = null }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>('all');
  const [interfaceFont, setInterfaceFont] = useState(getStoredInterfaceFontId);
  const [typingFont, setTypingFont] = useState(getStoredTypingFontId);
  const [theme, setTheme] = useState(getStoredThemeId);
  const [favoriteThemeIds, setFavoriteThemeIds] = useState(getStoredFavoriteThemeIds);
  const [recentThemeIds, setRecentThemeIds] = useState(getStoredRecentThemeIds);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [autoSave, setAutoSave] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autoSave') !== 'false';
    }
    return true;
  });
  const [soundTheme, setSoundTheme] = useState<SoundThemeId>(getStoredSoundTheme);
  const [textSize, setTextSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('textSize') || 'medium';
    }
    return 'medium';
  });
  const [zenMode, setZenMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zenMode') === 'true';
    }
    return false;
  });
  const [caretStyle, setCaretStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caretStyle') || 'line';
    }
    return 'line';
  });
  const [strictSpace, setStrictSpace] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('strictSpace') === 'true';
    }
    return false;
  });
  const [stopOnError, setStopOnError] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stopOnError') === 'true';
    }
    return false;
  });

  const favoriteThemes = useMemo(
    () => favoriteThemeIds.map((themeId) => THEMES.find((item) => item.id === themeId)).filter((item): item is (typeof THEMES)[number] => Boolean(item)),
    [favoriteThemeIds]
  );
  const recentThemes = useMemo(
    () => recentThemeIds.map((themeId) => THEMES.find((item) => item.id === themeId)).filter((item): item is (typeof THEMES)[number] => Boolean(item)),
    [recentThemeIds]
  );
  const favoriteThemeSet = useMemo(() => new Set(favoriteThemeIds), [favoriteThemeIds]);
  const currentTheme = useMemo(() => THEMES.find((item) => item.id === theme) ?? THEMES[0], [theme]);

  const filteredThemes = useMemo(() => {
    if (themeFilter === 'favorites') {
      return favoriteThemes;
    }

    if (themeFilter === 'recent') {
      return recentThemes;
    }

    const scopedThemes = THEMES.filter((item) => themeFilter === 'all' || item.mode === themeFilter);

    return [...scopedThemes].sort((leftTheme, rightTheme) => {
      const leftRecentIndex = recentThemeIds.indexOf(leftTheme.id);
      const rightRecentIndex = recentThemeIds.indexOf(rightTheme.id);
      const leftScore = (leftTheme.id === theme ? 40 : 0) + (favoriteThemeSet.has(leftTheme.id) ? 20 : 0) + (leftRecentIndex >= 0 ? 10 - leftRecentIndex : 0);
      const rightScore = (rightTheme.id === theme ? 40 : 0) + (favoriteThemeSet.has(rightTheme.id) ? 20 : 0) + (rightRecentIndex >= 0 ? 10 - rightRecentIndex : 0);

      return rightScore - leftScore || leftTheme.name.localeCompare(rightTheme.name);
    });
  }, [favoriteThemeSet, favoriteThemes, recentThemeIds, recentThemes, theme, themeFilter]);

  const currentInterfaceFont = useMemo(
    () => UI_FONT_OPTIONS.find((font) => font.id === interfaceFont) ?? UI_FONT_OPTIONS[0],
    [interfaceFont]
  );
  const currentTypingFont = useMemo(
    () => TYPING_FONT_OPTIONS.find((font) => font.id === typingFont) ?? TYPING_FONT_OPTIONS[0],
    [typingFont]
  );

  useEffect(() => {
    localStorage.setItem('autoSave', autoSave.toString());
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem('soundTheme', soundTheme);
  }, [soundTheme]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize);
    document.documentElement.style.setProperty('--text-size', textSize === 'small' ? '1.5rem' : textSize === 'large' ? '2.5rem' : '1.875rem');
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('zenMode', zenMode.toString());
    window.dispatchEvent(new Event('storage'));
  }, [zenMode]);

  useEffect(() => {
    localStorage.setItem('strictSpace', strictSpace.toString());
    window.dispatchEvent(new Event('storage'));
  }, [strictSpace]);

  useEffect(() => {
    localStorage.setItem('stopOnError', stopOnError.toString());
    window.dispatchEvent(new Event('storage'));
  }, [stopOnError]);

  useEffect(() => {
    localStorage.setItem('caretStyle', caretStyle);
    window.dispatchEvent(new Event('storage'));
  }, [caretStyle]);

  useEffect(() => {
    applyInterfaceFont(interfaceFont);
  }, [interfaceFont]);

  useEffect(() => {
    applyTypingFont(typingFont);
  }, [typingFont]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileSheet ? 'hidden' : previousOverflow;

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSheet]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setMobileSheet(null);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setRecentThemeIds(rememberRecentTheme(themeId));
    setMobileSheet(null);
  };

  const handleFavoriteToggle = (themeId: string) => {
    setFavoriteThemeIds(toggleFavoriteTheme(themeId));
  };

  const handleInterfaceFontSelect = (fontId: string) => {
    setInterfaceFont(fontId);
    setMobileSheet(null);
  };

  const handleTypingFontSelect = (fontId: string) => {
    setTypingFont(fontId);
    setMobileSheet(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const handleSoundThemeSelect = (themeId: SoundThemeId) => {
    setSoundTheme(themeId);
    soundEngine.previewTheme(themeId);
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-5 md:gap-8 animate-in fade-in duration-500">
      <div className="w-full md:w-64 md:shrink-0">
        <h2 className="text-2xl font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
          <SettingsIcon size={24} className="text-[var(--accent-color)]" />
          Баптаулар
        </h2>

        <div className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'shrink-0 min-w-[165px] md:min-w-0 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-2xl transition-colors text-left',
                activeTab === id
                  ? 'bg-[var(--main-color)] text-[var(--bg-color)] font-medium shadow-sm'
                  : 'text-[var(--sub-color)] hover:bg-[var(--sub-color)]/10 hover:text-[var(--main-color)]'
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 bg-[var(--bg-color)] p-4 sm:p-6 md:p-8 rounded-[28px] border border-[var(--sub-color)]/20 shadow-sm">
        {activeTab === 'appearance' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <section className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                    <Palette size={20} className="text-[var(--accent-color)]" />
                    Тақырыптар
                  </h3>
                  <p className="text-sm text-[var(--sub-color)]">Contrast теңестірілді, ал таңдаулар `favorite/recent` арқылы сақталады.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: `Барлығы ${THEMES.length}` },
                    { id: 'favorites', label: `Таңдаулы ${favoriteThemes.length}` },
                    { id: 'recent', label: `Соңғы ${recentThemes.length}` },
                    { id: 'dark', label: `Қараңғы ${THEMES.filter((item) => item.mode === 'dark').length}` },
                    { id: 'light', label: `Жарық ${THEMES.filter((item) => item.mode === 'light').length}` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setThemeFilter(filter.id as ThemeFilter)}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        themeFilter === filter.id
                          ? 'bg-[var(--accent-color)] text-[var(--bg-color)]'
                          : 'bg-[var(--main-color)]/6 text-[var(--sub-color)] hover:text-[var(--main-color)]'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileSheet('themes')}
                className="sm:hidden flex items-center justify-between gap-4 rounded-[24px] border border-[var(--sub-color)]/20 bg-[var(--main-color)]/5 p-4 text-left transition-colors hover:border-[var(--accent-color)]/35"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--main-color)] lowercase">{currentTheme.name}</span>
                    <span className="rounded-full bg-[var(--main-color)]/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--sub-color)]">
                      {favoriteThemes.length} favorite
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--sub-color)]">Телефонда theme picker bottom-sheet форматында ашылады.</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="block size-3 rounded-full" style={{ backgroundColor: currentTheme.main }} />
                    <span className="block size-3 rounded-full" style={{ backgroundColor: currentTheme.accent }} />
                    <span className="block size-3 rounded-full" style={{ backgroundColor: currentTheme.sub }} />
                    <span className="ml-1 text-[10px] uppercase tracking-[0.18em] text-[var(--sub-color)]">{currentTheme.mode}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-[var(--sub-color)]" />
              </button>

              <div className="hidden sm:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredThemes.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-[var(--sub-color)]/20 bg-[var(--main-color)]/4 px-4 py-6 text-sm text-[var(--sub-color)]">
                    Бұл бөлім әзірге бос. Бірнеше theme-ді таңдаулыға қосып немесе theme ауыстырып көріңіз.
                  </div>
                )}

                {filteredThemes.map((item) => {
                  const isSelected = theme === item.id;
                  const isFavorite = favoriteThemeSet.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border p-2.5"
                      style={{
                        backgroundColor: item.bg,
                        color: item.main,
                        borderColor: isSelected ? item.accent : item.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)',
                        boxShadow: isSelected ? `0 0 0 2px ${item.accent}33` : 'none',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleThemeSelect(item.id)}
                          className="flex-1 min-w-0 px-1 py-0.5 text-left transition-transform hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-sm sm:text-[15px] font-medium leading-tight lowercase break-words">{item.name}</div>
                            {isSelected && <Check size={14} color={item.accent} className="shrink-0" />}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.main }} />
                              <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                              <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.sub }} />
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: item.sub }}>
                              {item.mode}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFavoriteToggle(item.id)}
                          className="rounded-full p-1.5 transition-colors hover:bg-black/5"
                          title={isFavorite ? 'Таңдаулыдан шығару' : 'Таңдаулыға қосу'}
                        >
                          <Star size={15} color={isFavorite ? item.accent : item.sub} fill={isFavorite ? item.accent : 'none'} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                    <Type size={20} className="text-[var(--accent-color)]" />
                    Интерфейс шрифті
                  </h3>
                  <p className="text-sm text-[var(--sub-color)]">Интерфейс үшін тек ең қолайлы 6 нұсқа қалдырылды.</p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--main-color)]/6 text-[var(--sub-color)]">6 font</span>
              </div>

              <div className="rounded-2xl border border-[var(--sub-color)]/20 bg-[var(--main-color)]/5 p-4 sm:p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--sub-color)] mb-2">Preview</div>
                <div style={{ fontFamily: currentInterfaceFont.cssValue }}>
                  <div className="text-2xl sm:text-3xl font-semibold text-[var(--main-color)] tracking-tight">tezteru.kz</div>
                  <div className="mt-2 text-sm sm:text-base text-[var(--sub-color)]">Баптаулар, статистика және навигация осы қаріппен көрінеді.</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileSheet('interface-fonts')}
                className="sm:hidden flex items-center justify-between gap-4 rounded-[24px] border border-[var(--sub-color)]/20 bg-[var(--main-color)]/5 p-4 text-left transition-colors hover:border-[var(--accent-color)]/35"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--main-color)]">{currentInterfaceFont.name}</span>
                    <span className="rounded-full bg-[var(--main-color)]/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--sub-color)]">UI</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--sub-color)]">Интерфейс қаріптері енді mobile bottom-sheet арқылы ашылады.</div>
                  <div className="mt-3 truncate text-base text-[var(--main-color)]" style={{ fontFamily: currentInterfaceFont.cssValue }}>
                    Aa Әә 123 tezteru.kz
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-[var(--sub-color)]" />
              </button>

              <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {UI_FONT_OPTIONS.map((fontOption) => (
                  <button
                    key={fontOption.id}
                    onClick={() => handleInterfaceFontSelect(fontOption.id)}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition-all min-h-[88px]',
                      interfaceFont === fontOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                    style={{ fontFamily: fontOption.cssValue }}
                  >
                    <div className="text-sm font-medium">{fontOption.name}</div>
                    <div className="mt-2 text-lg sm:text-xl leading-none">Aa Әә</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                <Monitor size={20} className="text-[var(--accent-color)]" />
                Интерфейс
              </h3>
              <div className="flex flex-col gap-4">
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Жұмсақ айналдыру</div>
                    <div className="text-sm text-[var(--sub-color)]">Ұзын мәтіндер арасында қозғалысты жұмсартады.</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қателерді көрсету</div>
                    <div className="text-sm text-[var(--sub-color)]">Қате жазылған әріптер бірден қызылмен белгіленеді.</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'typing' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                    <Type size={20} className="text-[var(--accent-color)]" />
                    Мәтін шрифті
                  </h3>
                  <p className="text-sm text-[var(--sub-color)]">Typing мәтіні, input және жарыс мәтіндері осы қаріппен көрінеді.</p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--main-color)]/6 text-[var(--sub-color)]">{TYPING_FONT_OPTIONS.length} font</span>
              </div>

              <div className="rounded-[28px] border border-[var(--sub-color)]/20 bg-[var(--main-color)]/5 p-4 sm:p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--sub-color)] mb-3">Preview</div>
                <div className="text-xl sm:text-3xl leading-relaxed text-[var(--main-color)] typing-font" style={{ fontFamily: currentTypingFont.cssValue }}>
                  {TYPING_PREVIEW}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileSheet('typing-fonts')}
                className="sm:hidden flex items-center justify-between gap-4 rounded-[24px] border border-[var(--sub-color)]/20 bg-[var(--main-color)]/5 p-4 text-left transition-colors hover:border-[var(--accent-color)]/35"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--main-color)]">{currentTypingFont.name}</span>
                    <span className="rounded-full bg-[var(--main-color)]/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--sub-color)]">Typing</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--sub-color)]">Мәтін шрифттері mobile bottom-sheet ішінен ашылады.</div>
                  <div className="mt-3 truncate text-base text-[var(--main-color)]" style={{ fontFamily: currentTypingFont.cssValue }}>
                    кіші бейбітшілік дейін өмір достық
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-[var(--sub-color)]" />
              </button>

              <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {TYPING_FONT_OPTIONS.map((fontOption) => (
                  <button
                    key={fontOption.id}
                    onClick={() => handleTypingFontSelect(fontOption.id)}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition-all min-h-[92px]',
                      typingFont === fontOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                    style={{ fontFamily: fontOption.cssValue }}
                  >
                    <div className="text-sm font-medium leading-tight">{fontOption.name}</div>
                    <div className="mt-2 text-lg leading-none">Әә 123</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                    <Volume2 size={20} className="text-[var(--accent-color)]" />
                    Дыбыс эффектілері
                  </h3>
                  <p className="text-sm text-[var(--sub-color)]">Карточканы басқанда сол theme-нің keypress preview-і бірден ойнайды.</p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--main-color)]/6 text-[var(--sub-color)]">{SOUND_THEMES.length} sound</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {SOUND_THEMES.map((soundOption) => (
                  <button
                    key={soundOption.id}
                    onClick={() => handleSoundThemeSelect(soundOption.id)}
                    className={cn(
                      'px-4 py-3 rounded-2xl border transition-all text-left',
                      soundTheme === soundOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{soundOption.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--sub-color)]">{soundOption.badge}</div>
                        <div className="mt-2 text-sm text-[var(--sub-color)] leading-relaxed">{soundOption.description}</div>
                      </div>
                      {soundTheme === soundOption.id && <Check size={16} className="shrink-0 text-[var(--accent-color)]" />}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                <Type size={20} className="text-[var(--accent-color)]" />
                Мәтін көлемі
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'small', name: 'Кіші' },
                  { id: 'medium', name: 'Орташа' },
                  { id: 'large', name: 'Үлкен' },
                ].map((sizeOption) => (
                  <button
                    key={sizeOption.id}
                    onClick={() => setTextSize(sizeOption.id)}
                    className={cn(
                      'px-4 py-3 rounded-2xl border transition-all text-center',
                      textSize === sizeOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                  >
                    {sizeOption.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                <Monitor size={20} className="text-[var(--accent-color)]" />
                Курсор стилі
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'line', name: 'Сызық' },
                  { id: 'block', name: 'Блок' },
                  { id: 'underline', name: 'Асты сызылған' },
                ].map((caretOption) => (
                  <button
                    key={caretOption.id}
                    onClick={() => setCaretStyle(caretOption.id)}
                    className={cn(
                      'px-3 py-3 rounded-2xl border transition-all text-center text-sm sm:text-base',
                      caretStyle === caretOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                  >
                    {caretOption.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                <Shield size={20} className="text-[var(--accent-color)]" />
                Қосымша
              </h3>
              <div className="flex flex-col gap-4">
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Назар аудармау режимі</div>
                    <div className="text-sm text-[var(--sub-color)]">Тест кезінде артық элементтерді жасырады.</div>
                  </div>
                  <input type="checkbox" checked={zenMode} onChange={(event) => setZenMode(event.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қатаң бос орын</div>
                    <div className="text-sm text-[var(--sub-color)]">Сөз дұрыс болмаса бос орынды өткізбейді.</div>
                  </div>
                  <input type="checkbox" checked={strictSpace} onChange={(event) => setStrictSpace(event.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қатеде тоқтау</div>
                    <div className="text-sm text-[var(--sub-color)]">Қате енгізген сәтте курсор кідіреді.</div>
                  </div>
                  <input type="checkbox" checked={stopOnError} onChange={(event) => setStopOnError(event.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'arcade' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <section className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                <Gamepad2 size={20} className="text-[var(--accent-color)]" />
                Ойын баптаулары
              </h3>
              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-[var(--sub-color)]/20 p-4 sm:p-5">
                  <div className="flex justify-between mb-2 text-sm sm:text-base">
                    <span className="font-medium text-[var(--main-color)]">Бастапқы жылдамдық</span>
                    <span className="text-[var(--sub-color)]">Орташа</span>
                  </div>
                  <input type="range" min="1" max="3" defaultValue="2" className="w-full accent-[var(--accent-color)]" />
                </div>
                <div className="rounded-2xl border border-[var(--sub-color)]/20 p-4 sm:p-5">
                  <div className="flex justify-between mb-2 text-sm sm:text-base">
                    <span className="font-medium text-[var(--main-color)]">Сөздердің ұзындығы</span>
                    <span className="text-[var(--sub-color)]">Аралас</span>
                  </div>
                  <input type="range" min="1" max="3" defaultValue="2" className="w-full accent-[var(--accent-color)]" />
                </div>
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қатаң режим</div>
                    <div className="text-sm text-[var(--sub-color)]">Қате жазсаңыз, сол сөзді қайтадан басынан тересіз.</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                <Bell size={20} className="text-[var(--accent-color)]" />
                Хабарландырулар
              </h3>
              <div className="flex flex-col gap-4">
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Нәтижелерді автоматты сақтау</div>
                    <div className="text-sm text-[var(--sub-color)]">Тест аяқталған бойда профильге сақтайды.</div>
                  </div>
                  <input type="checkbox" checked={autoSave} onChange={(event) => setAutoSave(event.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Жаңа жетістіктер</div>
                    <div className="text-sm text-[var(--sub-color)]">Жаңа марапат алғанда ескерту көрсетеді.</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className={TOGGLE_ROW_CLASS}>
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Рейтингтегі өзгерістер</div>
                    <div className="text-sm text-[var(--sub-color)]">Басқа ойыншы сізден асып кетсе хабарлайды.</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </section>

            {user && (
              <section className="flex flex-col gap-4 border-t border-[var(--sub-color)]/15 pt-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--main-color)] flex items-center gap-2">
                    <Shield size={20} className="text-[var(--accent-color)]" />
                    Аккаунт
                  </h3>
                  <p className="text-sm text-[var(--sub-color)]">Профильге кіру header-дегі avatar арқылы жасалады. Шығу батырмасы осында әдейі төменге жылжытылды.</p>
                </div>

                <div className="rounded-2xl border border-[var(--sub-color)]/20 bg-[var(--main-color)]/4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="h-12 w-12 rounded-full border border-[var(--sub-color)]/20"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--sub-color)]/20 bg-[var(--main-color)]/8 text-lg font-semibold text-[var(--main-color)]">
                        {(user.displayName || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--main-color)] truncate">{user.displayName || 'Пайдаланушы'}</div>
                      <div className="text-sm text-[var(--sub-color)] truncate">{user.email}</div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-2 flex items-center justify-center gap-2 self-start rounded-full border border-[var(--error-color)]/25 px-5 py-2.5 text-sm font-medium text-[var(--error-color)] transition-colors hover:bg-[var(--error-color)]/8"
                >
                  <LogOut size={16} />
                  <span>Шығу</span>
                </button>
              </section>
            )}
          </div>
        )}
      </div>
    </div>

      {mobileSheet === 'themes' && (
        <>
          <div className="sm:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" onClick={() => setMobileSheet(null)} />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-hidden rounded-t-[30px] border border-[var(--sub-color)]/20 bg-[var(--bg-color)] shadow-[0_-18px_48px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--sub-color)]/15 px-4 pb-4 pt-3">
              <div>
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--sub-color)]/25" />
                <h4 className="text-base font-semibold text-[var(--main-color)]">Тақырып таңдау</h4>
                <p className="mt-1 text-xs leading-relaxed text-[var(--sub-color)]">Favorite белгісі сақталады, ал таңдалған theme-дер recent тізіміне автоматты түседі.</p>
              </div>
              <button type="button" onClick={() => setMobileSheet(null)} className="rounded-full p-2 text-[var(--sub-color)] transition-colors hover:bg-[var(--main-color)]/8 hover:text-[var(--main-color)]">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(82vh-92px)] overflow-y-auto px-4 pb-6 pt-4">
              <div className="flex flex-col gap-4">
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: `Барлығы ${THEMES.length}` },
                    { id: 'favorites', label: `Таңдаулы ${favoriteThemes.length}` },
                    { id: 'recent', label: `Соңғы ${recentThemes.length}` },
                    { id: 'dark', label: `Қараңғы ${THEMES.filter((item) => item.mode === 'dark').length}` },
                    { id: 'light', label: `Жарық ${THEMES.filter((item) => item.mode === 'light').length}` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setThemeFilter(filter.id as ThemeFilter)}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        themeFilter === filter.id
                          ? 'bg-[var(--accent-color)] text-[var(--bg-color)]'
                          : 'bg-[var(--main-color)]/6 text-[var(--sub-color)] hover:text-[var(--main-color)]'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {favoriteThemes.length > 0 && themeFilter === 'all' && (
                  <div className="rounded-2xl bg-[var(--main-color)]/4 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--sub-color)]">
                      <Star size={12} />
                      Таңдаулы
                    </div>
                    <div className="grid gap-2.5">
                      {favoriteThemes.slice(0, 4).map((item) => {
                        const isSelected = theme === item.id;
                        const isFavorite = favoriteThemeSet.has(item.id);

                        return (
                          <div
                            key={`favorite-${item.id}`}
                            className="rounded-2xl border p-2.5"
                            style={{
                              backgroundColor: item.bg,
                              color: item.main,
                              borderColor: isSelected ? item.accent : item.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)',
                              boxShadow: isSelected ? `0 0 0 2px ${item.accent}33` : 'none',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <button type="button" onClick={() => handleThemeSelect(item.id)} className="flex-1 min-w-0 px-1 py-0.5 text-left">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium lowercase leading-tight break-words">{item.name}</div>
                                  {isSelected && <Check size={14} color={item.accent} className="shrink-0" />}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.main }} />
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.sub }} />
                                  </div>
                                  <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: item.sub }}>
                                    {item.mode}
                                  </div>
                                </div>
                              </button>
                              <button type="button" onClick={() => handleFavoriteToggle(item.id)} className="rounded-full p-1.5 transition-colors hover:bg-black/5">
                                <Star size={15} color={isFavorite ? item.accent : item.sub} fill={isFavorite ? item.accent : 'none'} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {recentThemes.length > 0 && themeFilter === 'all' && (
                  <div className="rounded-2xl bg-[var(--main-color)]/4 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--sub-color)]">
                      <Clock3 size={12} />
                      Соңғы
                    </div>
                    <div className="grid gap-2.5">
                      {recentThemes.slice(0, 4).map((item) => {
                        const isSelected = theme === item.id;
                        const isFavorite = favoriteThemeSet.has(item.id);

                        return (
                          <div
                            key={`recent-${item.id}`}
                            className="rounded-2xl border p-2.5"
                            style={{
                              backgroundColor: item.bg,
                              color: item.main,
                              borderColor: isSelected ? item.accent : item.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)',
                              boxShadow: isSelected ? `0 0 0 2px ${item.accent}33` : 'none',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <button type="button" onClick={() => handleThemeSelect(item.id)} className="flex-1 min-w-0 px-1 py-0.5 text-left">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium lowercase leading-tight break-words">{item.name}</div>
                                  {isSelected && <Check size={14} color={item.accent} className="shrink-0" />}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.main }} />
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.sub }} />
                                  </div>
                                  <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: item.sub }}>
                                    {item.mode}
                                  </div>
                                </div>
                              </button>
                              <button type="button" onClick={() => handleFavoriteToggle(item.id)} className="rounded-full p-1.5 transition-colors hover:bg-black/5">
                                <Star size={15} color={isFavorite ? item.accent : item.sub} fill={isFavorite ? item.accent : 'none'} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-2.5">
                  {filteredThemes.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[var(--sub-color)]/20 bg-[var(--main-color)]/4 px-4 py-6 text-sm text-[var(--sub-color)]">
                      Бұл бөлім әзірге бос. Бірнеше theme-ді таңдаулыға қосып немесе theme ауыстырып көріңіз.
                    </div>
                  )}

                  {filteredThemes.map((item) => {
                    const isSelected = theme === item.id;
                    const isFavorite = favoriteThemeSet.has(item.id);

                    return (
                      <div
                        key={`sheet-${item.id}`}
                        className="rounded-2xl border p-2.5"
                        style={{
                          backgroundColor: item.bg,
                          color: item.main,
                          borderColor: isSelected ? item.accent : item.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)',
                          boxShadow: isSelected ? `0 0 0 2px ${item.accent}33` : 'none',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <button type="button" onClick={() => handleThemeSelect(item.id)} className="flex-1 min-w-0 px-1 py-0.5 text-left">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium lowercase leading-tight break-words">{item.name}</div>
                              {isSelected && <Check size={14} color={item.accent} className="shrink-0" />}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.main }} />
                                <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                                <span className="block size-2.5 rounded-full" style={{ backgroundColor: item.sub }} />
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: item.sub }}>
                                {item.mode}
                              </div>
                            </div>
                          </button>
                          <button type="button" onClick={() => handleFavoriteToggle(item.id)} className="rounded-full p-1.5 transition-colors hover:bg-black/5">
                            <Star size={15} color={isFavorite ? item.accent : item.sub} fill={isFavorite ? item.accent : 'none'} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {mobileSheet === 'interface-fonts' && (
        <>
          <div className="sm:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" onClick={() => setMobileSheet(null)} />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-hidden rounded-t-[30px] border border-[var(--sub-color)]/20 bg-[var(--bg-color)] shadow-[0_-18px_48px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--sub-color)]/15 px-4 pb-4 pt-3">
              <div>
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--sub-color)]/25" />
                <h4 className="text-base font-semibold text-[var(--main-color)]">Интерфейс шрифті</h4>
                <p className="mt-1 text-xs leading-relaxed text-[var(--sub-color)]">Бұл таңдаулар header, settings, статистика және басқа UI элементтеріне қолданылады.</p>
              </div>
              <button type="button" onClick={() => setMobileSheet(null)} className="rounded-full p-2 text-[var(--sub-color)] transition-colors hover:bg-[var(--main-color)]/8 hover:text-[var(--main-color)]">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(82vh-92px)] overflow-y-auto px-4 pb-6 pt-4">
              <div className="grid gap-2.5">
                {UI_FONT_OPTIONS.map((fontOption) => (
                  <button
                    key={`mobile-ui-${fontOption.id}`}
                    onClick={() => handleInterfaceFontSelect(fontOption.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left transition-all',
                      interfaceFont === fontOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                    style={{ fontFamily: fontOption.cssValue }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{fontOption.name}</div>
                        <div className="mt-2 text-xl leading-none">Aa Әә</div>
                      </div>
                      {interfaceFont === fontOption.id && <Check size={16} className="text-[var(--accent-color)]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {mobileSheet === 'typing-fonts' && (
        <>
          <div className="sm:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" onClick={() => setMobileSheet(null)} />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-hidden rounded-t-[30px] border border-[var(--sub-color)]/20 bg-[var(--bg-color)] shadow-[0_-18px_48px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--sub-color)]/15 px-4 pb-4 pt-3">
              <div>
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--sub-color)]/25" />
                <h4 className="text-base font-semibold text-[var(--main-color)]">Мәтін шрифті</h4>
                <p className="mt-1 text-xs leading-relaxed text-[var(--sub-color)]">Бұл қаріп typing мәтініне, input-қа және жарыс режиміндегі сөйлемдерге қолданылады.</p>
              </div>
              <button type="button" onClick={() => setMobileSheet(null)} className="rounded-full p-2 text-[var(--sub-color)] transition-colors hover:bg-[var(--main-color)]/8 hover:text-[var(--main-color)]">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(82vh-92px)] overflow-y-auto px-4 pb-6 pt-4">
              <div className="mb-4 rounded-2xl border border-[var(--sub-color)]/20 bg-[var(--main-color)]/5 p-4 text-base leading-relaxed text-[var(--main-color)] typing-font" style={{ fontFamily: currentTypingFont.cssValue }}>
                {TYPING_PREVIEW}
              </div>
              <div className="grid gap-2.5">
                {TYPING_FONT_OPTIONS.map((fontOption) => (
                  <button
                    key={`mobile-typing-${fontOption.id}`}
                    onClick={() => handleTypingFontSelect(fontOption.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left transition-all',
                      typingFont === fontOption.id
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]'
                        : 'border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/45'
                    )}
                    style={{ fontFamily: fontOption.cssValue }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{fontOption.name}</div>
                        <div className="mt-2 text-base leading-none">Әә 123 кіші</div>
                      </div>
                      {typingFont === fontOption.id && <Check size={16} className="text-[var(--accent-color)]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
