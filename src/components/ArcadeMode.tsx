import { useState, useEffect, useRef, useCallback } from 'react';
import { generateWords } from '../lib/words';
import { Heart, Trophy } from 'lucide-react';
import { soundEngine } from '../lib/sounds';

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
}

export function ArcadeMode() {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const requestRef = useRef<number>(0);
  const lastWordTime = useRef<number>(0);
  const wordIdCounter = useRef(0);

  const getDifficultyMultiplier = () => {
    switch (difficulty) {
      case 'easy': return 0.5;
      case 'hard': return 1.5;
      default: return 1;
    }
  };

  const spawnWord = useCallback(() => {
    const text = generateWords(1, false, false).trim();
    const multiplier = getDifficultyMultiplier();
    const newWord: FallingWord = {
      id: wordIdCounter.current++,
      text,
      x: Math.random() * 80 + 10, // 10% to 90% width
      y: -10,
      speed: (Math.random() * 0.05 + 0.05 + (score * 0.002)) * multiplier, // Speed increases with score and difficulty
    };
    setWords(prev => [...prev, newWord]);
  }, [score, difficulty]);

  const update = useCallback((time: number) => {
    if (!isPlaying || gameOver) return;

    const multiplier = getDifficultyMultiplier();
    const spawnInterval = Math.max(800, 2000 - score * 20) / multiplier;

    if (time - lastWordTime.current > spawnInterval) {
      spawnWord();
      lastWordTime.current = time;
    }

    setWords(prev => {
      const next = prev.map(w => ({ ...w, y: w.y + w.speed }));
      const missed = next.filter(w => w.y > 100);
      
      if (missed.length > 0) {
        setLives(l => {
          const newLives = l - missed.length;
          if (newLives <= 0) {
            setGameOver(true);
            setIsPlaying(false);
          }
          return newLives;
        });
        soundEngine.playError();
      }

      return next.filter(w => w.y <= 100);
    });

    requestRef.current = requestAnimationFrame(update);
  }, [isPlaying, gameOver, score, spawnWord]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, update]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const matchedIndex = words.findIndex(w => w.text === val.trim());
    if (matchedIndex !== -1) {
      soundEngine.playClick();
      setScore(s => s + words[matchedIndex].text.length * 10);
      setWords(prev => prev.filter((_, i) => i !== matchedIndex));
      setInput('');
    }
  };

  const startGame = () => {
    setWords([]);
    setScore(0);
    setLives(3);
    setInput('');
    setGameOver(false);
    setIsPlaying(true);
    lastWordTime.current = performance.now();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-center mb-4 text-[var(--sub-color)]">
        <div className="flex items-center gap-2 text-2xl font-bold text-[var(--accent-color)]">
          <Trophy /> {score}
        </div>
        <div className="flex items-center gap-2 text-[var(--error-color)]">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <Heart key={i} fill="currentColor" />
          ))}
        </div>
      </div>

      <div className="relative w-full h-[60vh] bg-[var(--bg-color)] border-2 border-[var(--sub-color)]/20 rounded-xl overflow-hidden mb-8">
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--bg-color)]/80 backdrop-blur-sm z-10">
            <h2 className="text-4xl font-bold text-[var(--main-color)]">Аркада режимі</h2>
            <p className="text-[var(--sub-color)] text-center max-w-md text-lg">
              Төмен түсіп келе жатқан сөздерді жерге жеткізбей жазып үлгеріңіз!
            </p>
            
            <div className="flex flex-col items-center gap-3 mt-4">
              <span className="text-[var(--sub-color)] font-bold uppercase tracking-wider text-sm">Қиындық деңгейі</span>
              <div className="flex gap-2 bg-[var(--sub-color)]/10 p-1 rounded-full">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${
                      difficulty === level 
                        ? 'bg-[var(--accent-color)] text-[var(--bg-color)] shadow-md' 
                        : 'text-[var(--sub-color)] hover:text-[var(--main-color)]'
                    }`}
                  >
                    {level === 'easy' ? 'Оңай' : level === 'medium' ? 'Орташа' : 'Қиын'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startGame} className="px-10 py-4 bg-[var(--main-color)] text-[var(--bg-color)] rounded-full text-xl font-bold hover:opacity-90 transition-opacity mt-4 shadow-lg hover:scale-105 active:scale-95">
              Бастау
            </button>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-color)]/90 z-10">
            <h2 className="text-4xl font-bold text-[var(--error-color)] mb-4">Ойын аяқталды!</h2>
            <p className="text-2xl text-[var(--main-color)] mb-8">Ұпай: {score}</p>
            <button onClick={startGame} className="px-8 py-4 bg-[var(--main-color)] text-[var(--bg-color)] rounded-full text-xl font-bold hover:opacity-90 transition-opacity">
              Қайта ойнау
            </button>
          </div>
        )}

        {words.map(word => (
          <div 
            key={word.id}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${word.x}%`, top: `${word.y}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-2xl" style={{ transform: 'rotate(90deg)' }}>🏎️</span>
            <span className="text-xl font-bold text-[var(--main-color)] bg-[var(--bg-color)]/80 px-2 rounded-md backdrop-blur-sm typing-font">{word.text}</span>
          </div>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={handleInput}
        disabled={!isPlaying}
        placeholder={isPlaying ? "Сөзді жазыңыз..." : ""}
        className="w-full max-w-md px-6 py-4 text-2xl typing-font bg-transparent border-2 border-[var(--sub-color)] rounded-xl text-center text-[var(--main-color)] focus:border-[var(--accent-color)] outline-none transition-colors"
        autoFocus
      />
    </div>
  );
}
