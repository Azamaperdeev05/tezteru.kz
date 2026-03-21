import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { RefreshCw, Save, Clock, Type, Hash, Quote, RotateCcw, Minus, Square, Underline } from 'lucide-react';
import { CSSProperties, Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { TestConfig, useTypingTest } from '../hooks/useTypingTest';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { ResultRouteState, getTypingResultAchievements } from '../lib/results';
import { cn } from '../lib/utils';

type CaretStyle = 'line' | 'block' | 'underline';

const TypingFinishedStats = lazy(() => import('./TypingFinishedStats').then((module) => ({ default: module.TypingFinishedStats })));

// Optimized Character component to prevent unnecessary re-renders
const Character = memo(({ char, isCorrect, isTyped, isCurrent }: { 
  char: string; 
  isCorrect: boolean | null; 
  isTyped: boolean;
  isCurrent: boolean;
}) => {
  // Use simple CSS variables instead of tailwind-merge for high-frequency rendering
  const style = {
    fontFamily: 'var(--font-typing)',
    fontSize: 'var(--text-size, 1.875rem)',
    color: !isTyped 
      ? 'var(--sub-color)' 
      : (isCorrect ? 'var(--main-color)' : 'var(--error-color)'),
    transition: 'color 75ms linear'
  };
  
  return (
    <span className="inline-block whitespace-pre font-normal tracking-[0.01em]" style={style}>
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
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const typingViewportRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const visibleStartLineRef = useRef(0);
  const handledHomeResetRef = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedScoreId, setSavedScoreId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [hasTypingFocus, setHasTypingFocus] = useState(() => document.hasFocus());
  const [isWindowFocused, setIsWindowFocused] = useState(() => document.hasFocus());
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => document.visibilityState === 'visible');
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
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        setHasTypingFocus(true);
      });
      setSaved(false);
      setSavedScoreId(null);
      visibleStartLineRef.current = 0;
      setScrollOffset(0);
    }
  }, [status]);

  useEffect(() => {
    charRefs.current = [];
    visibleStartLineRef.current = 0;
    setScrollOffset(0);
  }, [targetText]);

  useEffect(() => {
    const homeResetAt = (location.state as { homeResetAt?: number } | null)?.homeResetAt;

    if (typeof homeResetAt !== 'number' || handledHomeResetRef.current === homeResetAt) {
      return;
    }

    handledHomeResetRef.current = homeResetAt;
    reset();

    requestAnimationFrame(() => {
      typingViewportRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      inputRef.current?.focus();
      setHasTypingFocus(true);
    });
  }, [location.state, reset]);

  const focusTypingInput = useCallback(() => {
    if (status === 'finished') return;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      setHasTypingFocus(true);
      setIsWindowFocused(true);
      setIsDocumentVisible(document.visibilityState === 'visible');
    });
  }, [status]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'finished' && !hasTypingFocus && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        focusTypingInput();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reset, status, hasTypingFocus, focusTypingInput]);

  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      const target = event.target as Node | null;

      if (typingViewportRef.current?.contains(target)) {
        return;
      }

      setHasTypingFocus(false);
      inputRef.current?.blur();
    };

    const handleWindowBlur = () => {
      setIsWindowFocused(false);
      setHasTypingFocus(false);
    };

    const handleWindowFocus = () => {
      setIsWindowFocused(true);
    };

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsDocumentVisible(visible);

      if (!visible) {
        setHasTypingFocus(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Caret positioning
  const updateCaretPosition = useCallback(() => {
    if (status === 'finished' || !caretRef.current) return;
    
    // Use requestAnimationFrame to avoid synchronous layout thrashing
    requestAnimationFrame(() => {
      const activeIndex = userInput.length;
      const activeEl = charRefs.current[activeIndex];
      const measuredLineHeight = textContainerRef.current
        ? parseFloat(window.getComputedStyle(textContainerRef.current).lineHeight)
        : Number.NaN;
      const resolveLineHeight = (element: HTMLElement) => {
        if (Number.isFinite(measuredLineHeight)) {
          return measuredLineHeight;
        }

        const elementLineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
        if (Number.isFinite(elementLineHeight)) {
          return elementLineHeight;
        }

        return element.getBoundingClientRect().height;
      };
      const resolveScrollOffset = (top: number, lineHeight: number) => {
        const currentLineIndex = Math.max(0, Math.round(top / lineHeight));
        const currentVisibleStartLine = visibleStartLineRef.current;

        let nextVisibleStartLine = currentVisibleStartLine;

        if (currentLineIndex < currentVisibleStartLine) {
          nextVisibleStartLine = currentLineIndex;
        } else if (currentLineIndex > currentVisibleStartLine + 2) {
          nextVisibleStartLine = currentLineIndex - 2;
        }

        visibleStartLineRef.current = nextVisibleStartLine;

        return nextVisibleStartLine * lineHeight;
      };
      
      if (activeEl && caretRef.current) {
        const top = activeEl.offsetTop;
        const lineHeight = resolveLineHeight(activeEl);
        const nextOffset = resolveScrollOffset(top, lineHeight);
        if (Math.abs(scrollOffset - nextOffset) > 4) {
          setScrollOffset(nextOffset);
        }
        caretRef.current.style.transform = `translate(${activeEl.offsetLeft}px, ${activeEl.offsetTop}px)`;
      } else if (activeIndex === targetText.length && charRefs.current[activeIndex - 1] && caretRef.current) {
        const lastEl = charRefs.current[activeIndex - 1]!;
        const top = lastEl.offsetTop;
        const lineHeight = resolveLineHeight(lastEl);
        setScrollOffset(resolveScrollOffset(top, lineHeight));
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
    if (!hasTypingFocus || status === 'finished') {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      updateCaretPosition();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [hasTypingFocus, status, updateCaretPosition]);

  useEffect(() => {
    if (zenMode && status === 'typing') {
      document.body.classList.add('zen-mode-active');
    } else {
      document.body.classList.remove('zen-mode-active');
    }
    return () => document.body.classList.remove('zen-mode-active');
  }, [zenMode, status]);

  const handleSaveScore = useCallback(async () => {
    if (!auth.currentUser || status !== 'finished' || saved || stats.wpm === 0) return null;

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'scores'), {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Қонақ',
        photoURL: auth.currentUser.photoURL || null,
        wpm: stats.wpm,
        rawWpm: stats.rawWpm,
        accuracy: stats.accuracy,
        consistency: stats.consistency,
        correctChars: stats.correctChars,
        incorrectChars: stats.incorrectChars,
        extraChars: stats.extraChars,
        missedChars: stats.missedChars,
        time: stats.time,
        errorMap: stats.errorMap,
        history: stats.history,
        mode: config.mode,
        amount: config.amount,
        punctuation: config.punctuation,
        numbers: config.numbers,
        createdAt: serverTimestamp(),
      });
      setSaved(true);
      setSavedScoreId(docRef.id);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scores');
      return null;
    } finally {
      setSaving(false);
    }
  }, [status, saved, stats, config]);

  useEffect(() => {
    if (status === 'finished' && auth.currentUser && !saved) {
      const autoSave = localStorage.getItem('autoSave') !== 'false';
      if (autoSave) {
        void handleSaveScore();
      }
    }
  }, [status, auth.currentUser, saved, handleSaveScore]);

  useEffect(() => {
    if (status === 'finished') {
      setAchievements(getTypingResultAchievements(stats));
    }
  }, [status, stats]);

  useEffect(() => {
    if (!savedScoreId || status !== 'finished') {
      return;
    }

    const nextAchievements = achievements.length > 0 ? achievements : getTypingResultAchievements(stats);
    const resultState: ResultRouteState = {
      scoreId: savedScoreId,
      stats,
      config,
      achievements: nextAchievements,
    };

    navigate(`/result/${savedScoreId}`, {
      replace: true,
      state: resultState,
    });
  }, [savedScoreId, status, stats, config, achievements, navigate]);

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

  const amountOptions = config.mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100];
  const toolbarButtonClass =
    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3.5 sm:text-xs';
  const activeToolbarButtonClass = 'text-(--accent-color)';
  const inactiveToolbarButtonClass = 'text-(--sub-color) hover:text-(--main-color)';
  const typingViewportStyle = {
    fontSize: 'var(--text-size, 1.875rem)',
    fontFamily: 'var(--font-typing)',
    height: 'calc(var(--text-size, 1.875rem) * 1.45 * 3 + 0.25rem)'
  } as CSSProperties;
  const showFocusOverlay = status !== 'finished' && (!hasTypingFocus || !isWindowFocused || !isDocumentVisible);

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
    <div className="mx-auto flex w-full max-w-[1160px] flex-1 flex-col items-center gap-6 sm:gap-8 lg:gap-10">
      {!zenMode && status !== 'finished' && (
        <div className="-mt-2 w-full max-w-[900px] sm:-mt-3">
          <div className="mx-auto flex flex-wrap items-center justify-center gap-1.5 rounded-[1.45rem] border border-(--sub-color)/10 bg-(--main-color)/4 px-2.5 py-1.5 text-[11px] font-medium text-(--sub-color) sm:gap-2.5 sm:px-3 sm:py-2 sm:text-xs">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => onConfigChange({ ...config, punctuation: !config.punctuation, practiceWords: [] })}
                className={cn(
                  toolbarButtonClass,
                  'inline-flex items-center gap-1.5',
                  config.punctuation ? activeToolbarButtonClass : inactiveToolbarButtonClass
                )}
              >
                <Quote size={13} />
                <span>белгілер</span>
              </button>
              <button
                onClick={() => onConfigChange({ ...config, numbers: !config.numbers, practiceWords: [] })}
                className={cn(
                  toolbarButtonClass,
                  'inline-flex items-center gap-1.5',
                  config.numbers ? activeToolbarButtonClass : inactiveToolbarButtonClass
                )}
              >
                <Hash size={13} />
                <span>сандар</span>
              </button>
            </div>

            <span className="hidden h-6 w-px bg-(--sub-color)/15 sm:block" />

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => onConfigChange({ ...config, mode: 'time', amount: 30, practiceWords: [] })}
                className={cn(
                  toolbarButtonClass,
                  'inline-flex items-center gap-1.5',
                  config.mode === 'time' ? activeToolbarButtonClass : inactiveToolbarButtonClass
                )}
              >
                <Clock size={13} />
                <span>уақыт</span>
              </button>
              <button
                onClick={() => onConfigChange({ ...config, mode: 'words', amount: 25, practiceWords: [] })}
                className={cn(
                  toolbarButtonClass,
                  'inline-flex items-center gap-1.5',
                  config.mode === 'words' ? activeToolbarButtonClass : inactiveToolbarButtonClass
                )}
              >
                <Type size={13} />
                <span>сөздер</span>
              </button>
            </div>

            <span className="hidden h-6 w-px bg-(--sub-color)/15 sm:block" />

            <div className="flex items-center gap-0.5 sm:gap-1">
              {amountOptions.map((amt) => (
                <button
                  key={amt}
                  onClick={() => onConfigChange({ ...config, amount: amt, practiceWords: [] })}
                  className={cn(
                    toolbarButtonClass,
                    config.amount === amt ? activeToolbarButtonClass : inactiveToolbarButtonClass
                  )}
                >
                  {amt}
                </button>
              ))}
            </div>

            <span className="hidden h-6 w-px bg-(--sub-color)/15 sm:block" />

            <div className="flex items-center gap-0.5 rounded-full px-1 py-0.5 sm:gap-1.5">
              <button
                onClick={() => setCaretStyle('line')}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                  caretStyle === 'line' ? 'text-(--main-color)' : 'text-(--sub-color) hover:text-(--main-color)'
                )}
                title="Сызық курсор"
              >
                <Minus size={14} className="rotate-90" />
              </button>
              <button
                onClick={() => setCaretStyle('block')}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                  caretStyle === 'block' ? 'text-(--main-color)' : 'text-(--sub-color) hover:text-(--main-color)'
                )}
                title="Блок курсор"
              >
                <Square size={14} />
              </button>
              <button
                onClick={() => setCaretStyle('underline')}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                  caretStyle === 'underline' ? 'text-(--main-color)' : 'text-(--sub-color) hover:text-(--main-color)'
                )}
                title="Астын сызу курсор"
              >
                <Underline size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'finished' && (
        <Suspense fallback={<div className="p-8 text-center text-[var(--sub-color)]">Нәтижелер жүктелуде...</div>}>
          <TypingFinishedStats stats={stats} config={config} achievements={achievements} />
        </Suspense>
      )}

      {status !== 'finished' && (
        <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
          <div 
            ref={typingViewportRef}
            className="relative w-full cursor-text overflow-hidden"
            onClick={focusTypingInput}
            style={typingViewportStyle}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={targetText}
                ref={textContainerRef}
                initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: -scrollOffset }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
                transition={{
                  opacity: { duration: 0.25, ease: 'easeInOut' },
                  filter: { duration: 0.25, ease: 'easeInOut' },
                  y: { duration: 0.22, ease: 'easeOut' }
                }}
                className="absolute inset-x-0 top-0 z-10 mx-auto w-full max-w-[1040px] break-words text-left select-none will-change-[transform,filter,opacity] sm:px-4"
                style={{ lineHeight: 1.45 }}
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

            <AnimatePresence>
              {showFocusOverlay && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)', scale: 0.985 }}
                  animate={{ opacity: 1, backdropFilter: 'blur(10px)', scale: 1 }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)', scale: 0.985 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  onClick={focusTypingInput}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-(--bg-color)/28 text-center text-(--main-color)"
                >
                  <div className="rounded-3xl border border-(--sub-color)/12 bg-(--bg-color)/42 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                    <motion.div
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.06, duration: 0.2, ease: 'easeOut' }}
                      className="text-base font-medium sm:text-lg"
                    >
                      Теруді жалғастыру үшін осы жерді басыңыз
                    </motion.div>
                    <motion.div
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 0.8 }}
                      transition={{ delay: 0.1, duration: 0.2, ease: 'easeOut' }}
                      className="mt-1 text-xs text-(--sub-color) sm:text-sm"
                    >
                      Немесе кез келген пернені басып фокусқа оралыңыз
                    </motion.div>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none"
              value={userInput}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => setHasTypingFocus(true)}
              onBlur={() => setHasTypingFocus(false)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      )}

      {(!zenMode || status !== 'typing') && (
        <div className="mt-2 flex flex-col items-center justify-center gap-4 text-(--sub-color) sm:mt-4">
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-(--sub-color) transition-colors hover:text-(--main-color)"
              title="Қайта бастау"
            >
              <RefreshCw size={22} />
            </button>
            
            {status === 'finished' && stats.missedWords.length > 0 && (
              <button
                onClick={handlePracticeMissed}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-(--sub-color) transition-colors hover:text-(--accent-color)"
                title="Қате кеткен сөздермен жаттығу"
              >
                <RotateCcw size={22} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs opacity-75 sm:text-sm">
            <span>
              <kbd className="rounded-md bg-(--main-color)/8 px-2 py-1 font-mono text-[0.72rem] text-(--main-color)">tab</kbd>
              <span className="ml-2">қайта бастау</span>
            </span>
            <span>
              <kbd className="rounded-md bg-(--main-color)/8 px-2 py-1 font-mono text-[0.72rem] text-(--main-color)">шерту</kbd>
              <span className="ml-2">мәтінді белсендіру</span>
            </span>
          </div>

          {status === 'finished' && auth.currentUser && (
            <button
              onClick={async () => {
                await handleSaveScore();
              }}
              disabled={saving || saved || stats.wpm === 0}
              className={cn(
                "mt-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                saved 
                  ? "text-[var(--sub-color)] cursor-default"
                  : "border border-(--sub-color)/15 bg-(--main-color) text-(--bg-color) hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
