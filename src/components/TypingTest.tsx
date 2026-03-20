import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { RefreshCw, Save, Clock, Type, Hash, Quote, RotateCcw, Minus, Square, Underline } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter } from 'recharts';
import { auth, db } from '../firebase';
import { TestConfig, useTypingTest } from '../hooks/useTypingTest';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { cn } from '../lib/utils';

type CaretStyle = 'line' | 'block' | 'underline';

// Optimized Character component to prevent unnecessary re-renders
const Character = memo(({ char, isCorrect, isTyped, isCurrent }: { 
  char: string; 
  isCorrect: boolean | null; 
  isTyped: boolean;
  isCurrent: boolean;
}) => {
  // Use simple CSS variables instead of tailwind-merge for high-frequency rendering
  const style = {
    color: !isTyped 
      ? 'var(--sub-color)' 
      : (isCorrect ? 'var(--main-color)' : 'var(--error-color)'),
    transition: 'color 75ms linear'
  };
  
  return (
    <span className="text-3xl font-mono inline-block whitespace-pre" style={style}>
      {char}
    </span>
  );
});

Character.displayName = 'Character';

interface TypingTestProps {
  config: TestConfig;
  onConfigChange: (config: TestConfig) => void;
  soundEnabled: boolean;
}

export function TypingTest({ config, onConfigChange, soundEnabled }: TypingTestProps) {
  const { targetText, userInput, status, stats, timeLeft, handleInput, reset } = useTypingTest(config, soundEnabled);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [caretStyle, setCaretStyle] = useState<CaretStyle>(() => {
    return (localStorage.getItem('caretStyle') as CaretStyle) || 'line';
  });
  const [zenMode, setZenMode] = useState(() => {
    return localStorage.getItem('zenMode') === 'true';
  });
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    const handleStorageChange = () => {
      setCaretStyle((localStorage.getItem('caretStyle') as CaretStyle) || 'line');
      setZenMode(localStorage.getItem('zenMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (status === 'idle') {
      inputRef.current?.focus();
      setSaved(false);
      setScrollOffset(0);
    }
  }, [status]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reset]);

  // Caret positioning
  const updateCaretPosition = useCallback(() => {
    if (status === 'finished' || !caretRef.current) return;
    
    // Use requestAnimationFrame to avoid synchronous layout thrashing
    requestAnimationFrame(() => {
      const activeIndex = userInput.length;
      const activeEl = charRefs.current[activeIndex];
      
      if (activeEl && caretRef.current) {
        const top = activeEl.offsetTop;
        if (Math.abs(scrollOffset - (top > 48 ? top - 48 : 0)) > 10) {
          setScrollOffset(top > 48 ? top - 48 : 0);
        }
        caretRef.current.style.transform = `translate(${activeEl.offsetLeft}px, ${activeEl.offsetTop}px)`;
      } else if (activeIndex === targetText.length && charRefs.current[activeIndex - 1] && caretRef.current) {
        const lastEl = charRefs.current[activeIndex - 1]!;
        const top = lastEl.offsetTop;
        if (top > 48) {
          setScrollOffset(top - 48);
        } else {
          setScrollOffset(0);
        }
        caretRef.current.style.transform = `translate(${lastEl.offsetLeft + lastEl.offsetWidth}px, ${lastEl.offsetTop}px)`;
      }
    });
  }, [userInput.length, targetText.length, status, scrollOffset]);

  useEffect(() => {
    updateCaretPosition();
    window.addEventListener('resize', updateCaretPosition);
    return () => window.removeEventListener('resize', updateCaretPosition);
  }, [updateCaretPosition]);

  useEffect(() => {
    if (zenMode && status === 'typing') {
      document.body.classList.add('zen-mode-active');
    } else {
      document.body.classList.remove('zen-mode-active');
    }
    return () => document.body.classList.remove('zen-mode-active');
  }, [zenMode, status]);

  const handleSaveScore = useCallback(async () => {
    if (!auth.currentUser || status !== 'finished' || saved) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'scores'), {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Anonymous',
        photoURL: auth.currentUser.photoURL || null,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        mode: config.mode,
        amount: config.amount,
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
    } finally {
      setSaving(false);
    }
  }, [auth.currentUser, status, saved, stats, config]);

  useEffect(() => {
    if (status === 'finished' && auth.currentUser && !saved) {
      const autoSave = localStorage.getItem('autoSave') !== 'false';
      if (autoSave) {
        handleSaveScore();
      }
    }
  }, [status, auth.currentUser, saved, handleSaveScore]);

  useEffect(() => {
    if (status === 'finished') {
      const newAchievements = [];
      if (stats.wpm >= 100) newAchievements.push('🏆 100 ЖСМ клубы');
      if (stats.accuracy === 100) newAchievements.push('🎯 Мерген');
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 4) newAchievements.push('🦉 Түнгі үкі');
      if (stats.wpm >= 50 && stats.wpm < 100) newAchievements.push('🚀 Жылдам жазушы');
      setAchievements(newAchievements);
    }
  }, [status, stats.wpm, stats.accuracy]);

  const handlePracticeMissed = () => {
    if (stats.missedWords.length > 0) {
      onConfigChange({
        ...config,
        practiceWords: stats.missedWords,
        mode: 'words',
        amount: Math.min(50, stats.missedWords.length * 2) // Practice them a few times
      });
    }
  };

  const renderText = () => {
    const currentIndex = userInput.length;
    const words = targetText.split(' ');
    let globalIdx = 0;

    return words.map((word, wordIdx) => {
      const wordChars = [];
      const currentGlobalIdx = globalIdx;

      for (let i = 0; i < word.length; i++) {
        const charIdx = currentGlobalIdx + i;
        const char = word[i];
        const isTyped = charIdx < currentIndex;
        const isCorrect = isTyped ? userInput[charIdx] === char : null;
        const isCurrent = charIdx === currentIndex;

        wordChars.push(
          <span 
            key={charIdx} 
            ref={el => { charRefs.current[charIdx] = el; }}
            className="inline-block"
          >
            <Character 
              char={char} 
              isTyped={isTyped} 
              isCorrect={isCorrect}
              isCurrent={isCurrent}
            />
          </span>
        );
      }

      globalIdx += word.length;
      
      const spaceIdx = globalIdx;
      const hasSpace = spaceIdx < targetText.length;
      let spaceComponent = null;

      if (hasSpace) {
        const isTyped = spaceIdx < currentIndex;
        const isCorrect = isTyped ? userInput[spaceIdx] === ' ' : null;
        const isCurrent = spaceIdx === currentIndex;

        spaceComponent = (
          <span 
            key={spaceIdx} 
            ref={el => { charRefs.current[spaceIdx] = el; }}
            className="inline-block"
          >
            <Character 
              char=" " 
              isTyped={isTyped} 
              isCorrect={isCorrect}
              isCurrent={isCurrent}
            />
          </span>
        );
        globalIdx += 1;
      }

      return (
        <span key={wordIdx} className="inline-block whitespace-nowrap">
          {wordChars}
          {spaceComponent}
        </span>
      );
    });
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {status === 'idle' && !zenMode && (
        <div className="flex justify-center">
          <div className="flex bg-[var(--bg-color)] rounded-lg p-1 gap-4 items-center text-sm font-medium text-[var(--sub-color)]">
            
            {/* Punctuation & Numbers */}
            <div className="flex items-center gap-1 border-r border-[var(--sub-color)]/20 pr-4">
              <button
                onClick={() => onConfigChange({ ...config, punctuation: !config.punctuation, practiceWords: [] })}
                className={cn("px-3 py-1.5 rounded-md transition-colors flex items-center gap-2", config.punctuation ? "text-[var(--accent-color)]" : "hover:text-[var(--main-color)]")}
              >
                <Quote size={14} /> белгілер
              </button>
              <button
                onClick={() => onConfigChange({ ...config, numbers: !config.numbers, practiceWords: [] })}
                className={cn("px-3 py-1.5 rounded-md transition-colors flex items-center gap-2", config.numbers ? "text-[var(--accent-color)]" : "hover:text-[var(--main-color)]")}
              >
                <Hash size={14} /> сандар
              </button>
            </div>

            {/* Mode Selection */}
            <div className="flex items-center gap-1 border-r border-[var(--sub-color)]/20 pr-4">
              <button
                onClick={() => onConfigChange({ ...config, mode: 'time', amount: 30, practiceWords: [] })}
                className={cn("px-3 py-1.5 rounded-md transition-colors flex items-center gap-2", config.mode === 'time' ? "text-[var(--accent-color)]" : "hover:text-[var(--main-color)]")}
              >
                <Clock size={14} /> уақыт
              </button>
              <button
                onClick={() => onConfigChange({ ...config, mode: 'words', amount: 25, practiceWords: [] })}
                className={cn("px-3 py-1.5 rounded-md transition-colors flex items-center gap-2", config.mode === 'words' ? "text-[var(--accent-color)]" : "hover:text-[var(--main-color)]")}
              >
                <Type size={14} /> сөздер
              </button>
            </div>

            {/* Amount Selection */}
            <div className="flex items-center gap-1 border-r border-[var(--sub-color)]/20 pr-4">
              {(config.mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map((amt) => (
                <button
                  key={amt}
                  onClick={() => onConfigChange({ ...config, amount: amt, practiceWords: [] })}
                  className={cn("px-3 py-1.5 rounded-md transition-colors", config.amount === amt ? "text-[var(--accent-color)]" : "hover:text-[var(--main-color)]")}
                >
                  {amt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 pl-4">
              <button
                onClick={() => setCaretStyle('line')}
                className={cn("transition-colors", caretStyle === 'line' ? "text-[var(--main-color)]" : "text-[var(--sub-color)] hover:text-[var(--main-color)]")}
                title="Сызық курсор"
              >
                <Minus size={16} className="rotate-90" />
              </button>
              <button
                onClick={() => setCaretStyle('block')}
                className={cn("transition-colors", caretStyle === 'block' ? "text-[var(--main-color)]" : "text-[var(--sub-color)] hover:text-[var(--main-color)]")}
                title="Блок курсор"
              >
                <Square size={16} />
              </button>
              <button
                onClick={() => setCaretStyle('underline')}
                className={cn("transition-colors", caretStyle === 'underline' ? "text-[var(--main-color)]" : "text-[var(--sub-color)] hover:text-[var(--main-color)]")}
                title="Астын сызу курсор"
              >
                <Underline size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'finished' && (
        <div className="w-full animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Left Stats */}
            <div className="flex flex-col justify-center min-w-[150px]">
              <div className="mb-4 group relative cursor-help">
                <div className="text-3xl text-[var(--sub-color)] mb-[-8px] border-b border-dashed border-[var(--sub-color)]/50 inline-block">жсм</div>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-[var(--sub-color)] text-[var(--bg-color)] text-xs rounded shadow-lg z-50">
                  Жылдамдық: минутына сөз саны (Words Per Minute)
                </div>
                <div className="text-7xl font-bold text-[var(--accent-color)] leading-none">{stats.wpm}</div>
              </div>
              <div className="group relative cursor-help">
                <div className="text-3xl text-[var(--sub-color)] mb-[-8px] border-b border-dashed border-[var(--sub-color)]/50 inline-block">дәлдік</div>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-[var(--sub-color)] text-[var(--bg-color)] text-xs rounded shadow-lg z-50">
                  Дұрыс жазылған әріптердің пайызы (Accuracy)
                </div>
                <div className="text-7xl font-bold text-[var(--accent-color)] leading-none">{stats.accuracy}%</div>
              </div>
              <div className="mt-6 text-[var(--sub-color)] text-sm">
                <div>тест түрі</div>
                <div className="text-[var(--main-color)]">
                  {config.mode} {config.amount}<br/>
                  қазақша
                  {config.punctuation && ' + белгілер'}
                  {config.numbers && ' + сандар'}
                  {config.practiceWords && config.practiceWords.length > 0 && ' (қатемен жұмыс)'}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sub-color)" opacity={0.2} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--sub-color)', fontSize: 12 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--sub-color)', fontSize: 12 }} domain={[0, 'auto']} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--sub-color)', fontSize: 12 }} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--sub-color)', borderRadius: '8px', color: 'var(--main-color)' }}
                    itemStyle={{ color: 'var(--main-color)' }}
                    labelStyle={{ color: 'var(--sub-color)' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="wpm" name="wpm" stroke="var(--accent-color)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="left" type="monotone" dataKey="rawWpm" name="raw" stroke="var(--sub-color)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Scatter yAxisId="right" dataKey="errors" name="errors" fill="var(--error-color)" shape="cross" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-8">
            <div className="group relative cursor-help">
              <div className="text-sm text-[var(--sub-color)] mb-1 border-b border-dashed border-[var(--sub-color)]/50 inline-block">таза жсм</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[var(--sub-color)] text-[var(--bg-color)] text-xs rounded shadow-lg z-50">
                Қателерді ескермегендегі таза жылдамдық (Raw WPM)
              </div>
              <div className="text-4xl font-medium text-[var(--main-color)]">{stats.rawWpm}</div>
            </div>
            <div className="group relative cursor-help">
              <div className="text-sm text-[var(--sub-color)] mb-1 border-b border-dashed border-[var(--sub-color)]/50 inline-block">әріптер</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[var(--sub-color)] text-[var(--bg-color)] text-xs rounded shadow-lg z-50">
                Дұрыс / Қате / Артық / Қалып қойған
              </div>
              <div className="text-4xl font-medium text-[var(--main-color)]">{stats.correctChars}/{stats.incorrectChars}/{stats.extraChars}/{stats.missedChars}</div>
            </div>
            <div className="group relative cursor-help">
              <div className="text-sm text-[var(--sub-color)] mb-1 border-b border-dashed border-[var(--sub-color)]/50 inline-block">тұрақтылық</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[var(--sub-color)] text-[var(--bg-color)] text-xs rounded shadow-lg z-50">
                Жазу жылдамдығының бірқалыптылығы (Consistency)
              </div>
              <div className="text-4xl font-medium text-[var(--main-color)]">{stats.consistency}%</div>
            </div>
            <div className="group relative cursor-help">
              <div className="text-sm text-[var(--sub-color)] mb-1 border-b border-dashed border-[var(--sub-color)]/50 inline-block">уақыт</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[var(--sub-color)] text-[var(--bg-color)] text-xs rounded shadow-lg z-50">
                Тестке жұмсалған жалпы уақыт
              </div>
              <div className="text-4xl font-medium text-[var(--main-color)]">{stats.time}с</div>
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <h3 className="text-[var(--sub-color)] text-sm uppercase tracking-widest">Жетістіктер</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {achievements.map((ach, i) => (
                  <div key={i} className="px-4 py-2 bg-[var(--accent-color)]/10 text-[var(--accent-color)] rounded-full text-sm font-bold border border-[var(--accent-color)]/20 shadow-sm animate-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    {ach}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatmap */}
          {stats.errorMap && Object.keys(stats.errorMap).length > 0 && (
            <div className="mt-12 flex flex-col items-center gap-2">
              <h3 className="text-[var(--sub-color)] text-sm uppercase tracking-widest mb-2">Қателер картасы</h3>
              <div className="flex flex-col gap-1">
                {[
                  ['ә', 'і', 'ң', 'ғ', 'ү', 'ұ', 'қ', 'ө', 'һ'],
                  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
                  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
                  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
                ].map((row, i) => (
                  <div key={i} className="flex justify-center gap-1">
                    {row.map(char => {
                      const errors = stats.errorMap[char] || 0;
                      const maxErrors = Math.max(...Object.values(stats.errorMap), 1);
                      const intensity = errors / maxErrors;
                      return (
                        <div 
                          key={char} 
                          className="w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center text-sm transition-colors"
                          style={{
                            backgroundColor: errors > 0 ? `rgba(255, 68, 68, ${intensity * 0.8 + 0.2})` : 'var(--bg-color)',
                            color: errors > 0 ? '#fff' : 'var(--sub-color)',
                            border: '1px solid var(--sub-color)',
                            opacity: errors > 0 ? 1 : 0.3
                          }}
                          title={`${char}: ${errors} қате`}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status !== 'finished' && (
        <div className="relative">
          {config.mode === 'time' && status === 'typing' && !zenMode && (
            <div className="absolute -top-12 left-0 text-2xl font-bold text-[var(--accent-color)]">
              {timeLeft}
            </div>
          )}
          {config.mode === 'words' && status === 'typing' && !zenMode && (
            <div className="absolute -top-12 left-0 text-2xl font-bold text-[var(--accent-color)]">
              {userInput.split(' ').filter(w => w.length > 0).length}/{config.amount}
            </div>
          )}
          <div 
            className="relative h-[144px] overflow-hidden flex items-start cursor-text mt-4"
            onClick={() => inputRef.current?.focus()}
            style={{ fontSize: 'var(--text-size, 1.875rem)' }}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={targetText}
                initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="relative z-10 leading-[1.6] break-words w-full text-left select-none will-change-[transform,filter,opacity]"
                style={{ transform: `translateY(-${scrollOffset}px)` }}
              >
                <motion.div 
                  ref={caretRef}
                  layoutId="caret"
                  className={cn(
                    "absolute bg-[var(--accent-color)] transition-all duration-100 ease-out",
                    status === 'idle' ? "animate-pulse" : "",
                    caretStyle === 'line' ? "w-[3px] h-[1.2em] rounded-full" : 
                    caretStyle === 'block' ? "w-[0.6em] h-[1.2em] opacity-50" : 
                    "w-[0.6em] h-[4px] top-[1em] rounded-full"
                  )}
                  style={{ left: 0, marginTop: '0.2em' }}
                />
                {renderText()}
              </motion.div>
            </AnimatePresence>

            <input
              ref={inputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none"
              value={userInput}
              onChange={(e) => handleInput(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      )}

      {(!zenMode || status !== 'typing') && (
        <div className="flex flex-col items-center justify-center gap-6 mt-4">
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="p-4 text-[var(--sub-color)] hover:text-[var(--main-color)] transition-colors rounded-full"
              title="Қайта бастау"
            >
              <RefreshCw size={24} />
            </button>
            
            {status === 'finished' && stats.missedWords.length > 0 && (
              <button
                onClick={handlePracticeMissed}
                className="p-4 text-[var(--sub-color)] hover:text-[var(--accent-color)] transition-colors rounded-full"
                title="Қате кеткен сөздермен жаттығу"
              >
                <RotateCcw size={24} />
              </button>
            )}
          </div>

          <div className="text-xs text-[var(--sub-color)] flex gap-4 opacity-70">
            <span><kbd className="bg-[var(--bg-color)] px-1.5 py-0.5 rounded border border-[var(--sub-color)]/30 font-mono">Tab</kbd> қайта бастау</span>
          </div>

          {status === 'finished' && auth.currentUser && (
            <button
              onClick={handleSaveScore}
              disabled={saving || saved || stats.wpm === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all",
                saved 
                  ? "text-[var(--sub-color)] cursor-default"
                  : "bg-[var(--sub-color)] hover:bg-[var(--main-color)] text-[var(--bg-color)] disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Save size={16} />
              {saving ? 'Сақталуда...' : saved ? 'Сақталды' : 'Нәтижені сақтау'}
            </button>
          )}
          
          {status === 'finished' && !auth.currentUser && (
            <div className="text-sm text-[var(--sub-color)]">
              Нәтижені сақтау үшін жүйеге кіріңіз
            </div>
          )}
        </div>
      )}
    </div>
  );
}
