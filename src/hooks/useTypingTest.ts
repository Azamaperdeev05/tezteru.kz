import { useCallback, useEffect, useState, useRef } from 'react';
import { generateWords } from '../lib/words';
import { soundEngine } from '../lib/sounds';

export type TestMode = 'time' | 'words';

export interface TestConfig {
  mode: TestMode;
  amount: number;
  punctuation: boolean;
  numbers: boolean;
  practiceWords?: string[];
}

export type TestStatus = 'idle' | 'typing' | 'finished';

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  time: number;
  consistency: number;
  history: { time: number; wpm: number; rawWpm: number; errors: number }[];
  missedWords: string[];
  errorMap: Record<string, number>;
}

export function useTypingTest(config: TestConfig, soundEnabled: boolean = true) {
  const [targetText, setTargetText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<TestStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(config.mode === 'time' ? config.amount : 0);
  
  const startTimeRef = useRef<number | null>(null);
  const historyRef = useRef<{ time: number; wpm: number; rawWpm: number; errors: number }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorsThisSecondRef = useRef<number>(0);
  const lastInputLengthRef = useRef<number>(0);
  const userInputRef = useRef<string>('');
  const errorMapRef = useRef<Record<string, number>>({});
  
  // Cache settings to avoid expensive localStorage reads in handleInput
  const settingsRef = useRef({
    stopOnError: false,
    strictSpace: false
  });

  useEffect(() => {
    const updateSettings = () => {
      settingsRef.current = {
        stopOnError: localStorage.getItem('stopOnError') === 'true',
        strictSpace: localStorage.getItem('strictSpace') === 'true'
      };
    };
    updateSettings();
    window.addEventListener('storage', updateSettings);
    return () => window.removeEventListener('storage', updateSettings);
  }, []);

  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    time: 0,
    consistency: 0,
    history: [],
    missedWords: [],
    errorMap: {}
  });

  const generateNewText = useCallback(() => {
    const wordCount = config.mode === 'time' ? 300 : config.amount;
    setTargetText(generateWords(wordCount, config.punctuation, config.numbers, config.practiceWords));
  }, [config]);

  const reset = useCallback(() => {
    generateNewText();
    setUserInput('');
    userInputRef.current = '';
    setStatus('idle');
    startTimeRef.current = null;
    historyRef.current = [];
    errorsThisSecondRef.current = 0;
    lastInputLengthRef.current = 0;
    errorMapRef.current = {};
    setTimeLeft(config.mode === 'time' ? config.amount : 0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setStats({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      time: 0,
      consistency: 0,
      history: [],
      missedWords: [],
      errorMap: {}
    });
  }, [config, generateNewText]);

  useEffect(() => {
    reset();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reset]);

  const calculateCurrentStats = useCallback((currentInput: string) => {
    if (!startTimeRef.current) return null;
    
    const now = Date.now();
    const timeElapsedMs = now - startTimeRef.current;
    const timeInMinutes = timeElapsedMs / 60000;
    const timeInSeconds = Math.round(timeElapsedMs / 1000);

    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let missed = 0;
    const missedWordsSet = new Set<string>();

    const targetWords = targetText.split(' ');
    
    for (let i = 0; i < currentInput.length; i++) {
      if (i >= targetText.length) {
        extra++;
      } else if (currentInput[i] === targetText[i]) {
        correct++;
      } else {
        incorrect++;
        let charCount = 0;
        for (let w = 0; w < targetWords.length; w++) {
          charCount += targetWords[w].length + 1;
          if (i < charCount) {
            missedWordsSet.add(targetWords[w].replace(/[.,?!]/g, ''));
            break;
          }
        }
      }
    }

    if (currentInput.length < targetText.length && config.mode === 'words') {
      missed = targetText.length - currentInput.length;
    }

    const currentWpm = timeInMinutes > 0 ? Math.round((correct / 5) / timeInMinutes) : 0;
    const currentRawWpm = timeInMinutes > 0 ? Math.round((currentInput.length / 5) / timeInMinutes) : 0;
    const accuracy = currentInput.length > 0 ? Math.round((correct / currentInput.length) * 100) : 100;

    return {
      wpm: Math.max(0, currentWpm),
      rawWpm: Math.max(0, currentRawWpm),
      accuracy,
      correctChars: correct,
      incorrectChars: incorrect,
      extraChars: extra,
      missedChars: missed,
      time: timeInSeconds,
      missedWords: Array.from(missedWordsSet).filter(Boolean)
    };
  }, [targetText, config.mode]);

  const finishTest = useCallback(() => {
    setStatus('finished');
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const finalStats = calculateCurrentStats(userInputRef.current);
    if (finalStats) {
      let consistency = 0;
      if (historyRef.current.length > 0) {
        const wpms = historyRef.current.map(h => h.wpm);
        const avgWpm = wpms.reduce((a, b) => a + b, 0) / wpms.length;
        if (avgWpm > 0) {
          const variance = wpms.reduce((a, b) => a + Math.pow(b - avgWpm, 2), 0) / wpms.length;
          const stdDev = Math.sqrt(variance);
          const cv = stdDev / avgWpm;
          consistency = Math.max(0, Math.round(100 - (cv * 100)));
        }
      }

      setStats({
        ...finalStats,
        consistency,
        history: historyRef.current,
        errorMap: errorMapRef.current
      });
    }
  }, [calculateCurrentStats]);

  useEffect(() => {
    if (status === 'typing') {
      intervalRef.current = setInterval(() => {
        if (config.mode === 'time') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              finishTest();
              return 0;
            }
            return prev - 1;
          });
        }

        const currentStats = calculateCurrentStats(userInputRef.current);
        if (currentStats && startTimeRef.current) {
          const timeElapsedMs = Date.now() - startTimeRef.current;
          const timeInSeconds = Math.round(timeElapsedMs / 1000);
          
          historyRef.current.push({
            time: timeInSeconds,
            wpm: currentStats.wpm,
            rawWpm: currentStats.rawWpm,
            errors: errorsThisSecondRef.current
          });
          
          errorsThisSecondRef.current = 0;
          
          setStats(prev => ({
            ...prev,
            ...currentStats,
            history: [...historyRef.current]
          }));
        }
      }, 1000);
    } else if (status === 'finished' || status === 'idle') {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, config.mode, finishTest, calculateCurrentStats]);

  const handleInput = useCallback((value: string) => {
    if (status === 'finished') return;

    if (status === 'idle' && value.length > 0) {
      setStatus('typing');
      startTimeRef.current = Date.now();
    }

    if (value.length > lastInputLengthRef.current) {
      const { stopOnError, strictSpace } = settingsRef.current;
      const lastChar = value[value.length - 1];

      if (stopOnError) {
        const previousInput = userInputRef.current;
        const previousTarget = targetText.substring(0, previousInput.length);
        if (previousInput !== previousTarget) {
          if (soundEnabled) soundEngine.playError();
          return;
        }
      }

      if (strictSpace && lastChar === ' ') {
        const lastSpaceIndex = userInputRef.current.lastIndexOf(' ');
        const wordStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
        const currentWordInput = userInputRef.current.substring(wordStart);
        const currentWordTarget = targetText.substring(wordStart, value.length - 1);
        
        if (currentWordInput !== currentWordTarget) {
          if (soundEnabled) soundEngine.playError();
          return;
        }
      }
    }

    if (soundEnabled && value.length > lastInputLengthRef.current) {
      const lastChar = value[value.length - 1];
      const expectedChar = targetText[value.length - 1];
      if (lastChar === expectedChar) {
        soundEngine.playClick();
      } else {
        soundEngine.playError();
      }
    }

    if (value.length > lastInputLengthRef.current) {
      const lastCharIndex = value.length - 1;
      const expectedChar = targetText[lastCharIndex];
      if (value[lastCharIndex] !== expectedChar) {
        errorsThisSecondRef.current += 1;
        if (expectedChar) {
          const charKey = expectedChar.toLowerCase();
          errorMapRef.current[charKey] = (errorMapRef.current[charKey] || 0) + 1;
        }
      }
    }

    lastInputLengthRef.current = value.length;
    userInputRef.current = value;
    setUserInput(value);

    if (config.mode === 'words' && value.length === targetText.length) {
      finishTest();
    }
  }, [status, targetText, config.mode, finishTest, soundEnabled]);

  return {
    targetText,
    userInput,
    status,
    stats,
    timeLeft,
    handleInput,
    reset
  };
}
