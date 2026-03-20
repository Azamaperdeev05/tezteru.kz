import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Palette, Type, Gamepad2, Volume2, Bell, Shield, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'typing' | 'arcade' | 'account'>('appearance');
  const [font, setFont] = useState('Inter');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });
  const [autoSave, setAutoSave] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autoSave') !== 'false';
    }
    return true;
  });
  const [soundTheme, setSoundTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soundTheme') || 'mechanical';
    }
    return 'mechanical';
  });
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
    document.documentElement.style.setProperty('--font-sans', `"${font}", sans-serif`);
  }, [font]);

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

  const THEMES = [
    { id: 'light', name: 'Light', bg: '#eeebe2', main: '#080909', accent: '#d9736f' },
    { id: 'dark', name: 'Dark', bg: '#323437', main: '#d1d0c5', accent: '#e2b714' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36', main: '#f8f8f2', accent: '#ff79c6' },
    { id: 'matrix', name: 'Matrix', bg: '#000000', main: '#00ff41', accent: '#d1ffcd' },
    { id: 'nord', name: 'Nord', bg: '#2e3440', main: '#d8dee9', accent: '#88c0d0' },
    { id: 'serika-dark', name: 'Serika Dark', bg: '#323437', main: '#d1d0c5', accent: '#e2b714' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
          <SettingsIcon size={24} className="text-[var(--accent-color)]" />
          Баптаулар
        </h2>
        
        <button 
          onClick={() => setActiveTab('appearance')}
          className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left", activeTab === 'appearance' ? "bg-[var(--main-color)] text-[var(--bg-color)] font-medium" : "text-[var(--sub-color)] hover:bg-[var(--sub-color)]/10 hover:text-[var(--main-color)]")}
        >
          <Palette size={18} />
          Сыртқы түрі
        </button>
        <button 
          onClick={() => setActiveTab('typing')}
          className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left", activeTab === 'typing' ? "bg-[var(--main-color)] text-[var(--bg-color)] font-medium" : "text-[var(--sub-color)] hover:bg-[var(--sub-color)]/10 hover:text-[var(--main-color)]")}
        >
          <Type size={18} />
          Жазу баптаулары
        </button>
        <button 
          onClick={() => setActiveTab('arcade')}
          className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left", activeTab === 'arcade' ? "bg-[var(--main-color)] text-[var(--bg-color)] font-medium" : "text-[var(--sub-color)] hover:bg-[var(--sub-color)]/10 hover:text-[var(--main-color)]")}
        >
          <Gamepad2 size={18} />
          Аркада режимі
        </button>
        <button 
          onClick={() => setActiveTab('account')}
          className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left", activeTab === 'account' ? "bg-[var(--main-color)] text-[var(--bg-color)] font-medium" : "text-[var(--sub-color)] hover:bg-[var(--sub-color)]/10 hover:text-[var(--main-color)]")}
        >
          <Shield size={18} />
          Аккаунт
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[var(--bg-color)] p-8 rounded-2xl border border-[var(--sub-color)]/20">
        {activeTab === 'appearance' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Palette size={20} className="text-[var(--accent-color)]" />
                Тақырып (Тема)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                      theme === t.id ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20" : "border-[var(--sub-color)]/20 hover:border-[var(--sub-color)]/50"
                    )}
                  >
                    <div className="w-full h-12 rounded-lg flex items-center justify-center gap-2 shadow-sm" style={{ backgroundColor: t.bg }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.main }}></div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }}></div>
                    </div>
                    <span className={cn("text-sm font-medium", theme === t.id ? "text-[var(--main-color)]" : "text-[var(--sub-color)]")}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Type size={20} className="text-[var(--accent-color)]" />
                Қаріп (Шрифт)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Inter', 'Roboto', 'Montserrat', 'Open Sans', 'Nunito', 'Playfair Display'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFont(f)}
                    className={cn("px-4 py-3 rounded-xl border transition-all text-left", font === f ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]" : "border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/50")}
                    style={{ fontFamily: f }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Monitor size={20} className="text-[var(--accent-color)]" />
                Интерфейс
              </h3>
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Жұмсақ айналдыру (Smooth scroll)</div>
                    <div className="text-sm text-[var(--sub-color)]">Мәтін жазған кезде жолдардың жұмсақ ауысуы</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қателерді көрсету</div>
                    <div className="text-sm text-[var(--sub-color)]">Қате жазылған әріптерді қызылмен бояу</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'typing' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Volume2 size={20} className="text-[var(--accent-color)]" />
                Дыбыс эффектілері
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'mechanical', name: 'Механикалық' },
                  { id: 'typewriter', name: 'Жазу машинкасы' },
                  { id: 'soft', name: 'Жұмсақ' },
                  { id: 'game', name: 'Ойын' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSoundTheme(s.id)}
                    className={cn("px-4 py-3 rounded-xl border transition-all text-left", soundTheme === s.id ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]" : "border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/50")}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Type size={20} className="text-[var(--accent-color)]" />
                Мәтін көлемі
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'small', name: 'Кіші' },
                  { id: 'medium', name: 'Орташа' },
                  { id: 'large', name: 'Үлкен' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setTextSize(s.id)}
                    className={cn("px-4 py-3 rounded-xl border transition-all text-center", textSize === s.id ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]" : "border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/50")}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Monitor size={20} className="text-[var(--accent-color)]" />
                Курсор стилі
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'line', name: 'Сызық (|)' },
                  { id: 'block', name: 'Блок (█)' },
                  { id: 'underline', name: 'Асты сызылған (_)' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setCaretStyle(s.id)}
                    className={cn("px-4 py-3 rounded-xl border transition-all text-center", caretStyle === s.id ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--main-color)]" : "border-[var(--sub-color)]/20 text-[var(--sub-color)] hover:border-[var(--sub-color)]/50")}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Shield size={20} className="text-[var(--accent-color)]" />
                Қосымша
              </h3>
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Назар аудармау режимі (Zen Mode)</div>
                    <div className="text-sm text-[var(--sub-color)]">Тест кезінде уақыт пен жылдамдықты жасыру</div>
                  </div>
                  <input type="checkbox" checked={zenMode} onChange={(e) => setZenMode(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қатаң бос орын (Strict Space)</div>
                    <div className="text-sm text-[var(--sub-color)]">Бос орынды тек сөз дұрыс жазылғанда ғана басуға рұқсат ету</div>
                  </div>
                  <input type="checkbox" checked={strictSpace} onChange={(e) => setStrictSpace(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қатеде тоқтау (Stop on Error)</div>
                    <div className="text-sm text-[var(--sub-color)]">Қате жіберген сәтте курсор тоқтап қалады</div>
                  </div>
                  <input type="checkbox" checked={stopOnError} onChange={(e) => setStopOnError(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'arcade' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Gamepad2 size={20} className="text-[var(--accent-color)]" />
                Ойын баптаулары
              </h3>
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-[var(--main-color)]">Бастапқы жылдамдық</span>
                    <span className="text-[var(--sub-color)]">Орташа</span>
                  </div>
                  <input type="range" min="1" max="3" defaultValue="2" className="w-full accent-[var(--accent-color)]" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-[var(--main-color)]">Сөздердің ұзындығы</span>
                    <span className="text-[var(--sub-color)]">Аралас</span>
                  </div>
                  <input type="range" min="1" max="3" defaultValue="2" className="w-full accent-[var(--accent-color)]" />
                </div>
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Қатаң режим</div>
                    <div className="text-sm text-[var(--sub-color)]">Қате жазсаңыз сөз қайтадан басынан басталады</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-lg font-bold text-[var(--main-color)] mb-4 flex items-center gap-2">
                <Bell size={20} className="text-[var(--accent-color)]" />
                Хабарландырулар
              </h3>
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Нәтижелерді автоматты сақтау</div>
                    <div className="text-sm text-[var(--sub-color)]">Тест аяқталғанда нәтижені профильге сақтау</div>
                  </div>
                  <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Жаңа жетістіктер</div>
                    <div className="text-sm text-[var(--sub-color)]">Жаңа марапат алған кезде хабарлау</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-[var(--sub-color)]/20 cursor-pointer hover:bg-[var(--sub-color)]/5 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--main-color)]">Рейтингтегі өзгерістер</div>
                    <div className="text-sm text-[var(--sub-color)]">Кімдир біреу сізден озып кетсе хабарлау</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-[var(--accent-color)]" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
