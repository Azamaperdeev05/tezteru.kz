import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchLeaderboardScores, StoredScore } from '../lib/scores';

export function Leaderboard() {
  const [scores, setScores] = useState<StoredScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'time' | 'words'>('time');
  const [amount, setAmount] = useState<number>(30);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let active = true;

    const loadScores = async () => {
      setLoading(true);
      const result = await fetchLeaderboardScores(mode, amount, 10);

      if (active) {
        setScores(result.scores);
        setUsedFallback(result.usedFallback);
        setLoading(false);
      }
    };

    loadScores();

    return () => {
      active = false;
    };
  }, [mode, amount]);

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-3 text-[var(--sub-color)]">
          <Trophy size={24} strokeWidth={1.5} />
          <h2 className="text-xl font-medium tracking-tight">Көшбасшылар тақтасы</h2>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2 bg-[var(--sub-color)]/10 p-1 rounded-full">
            {(['time', 'words'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setAmount(m === 'time' ? 30 : 25);
                }}
                className={`px-6 py-2 rounded-full font-bold transition-all text-sm ${
                  mode === m 
                    ? 'bg-[var(--accent-color)] text-[var(--bg-color)] shadow-md' 
                    : 'text-[var(--sub-color)] hover:text-[var(--main-color)]'
                }`}
              >
                {m === 'time' ? 'Уақыт' : 'Сөздер'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`px-4 py-1 rounded-full font-medium transition-all text-xs ${
                  amount === a 
                    ? 'text-[var(--accent-color)]' 
                    : 'text-[var(--sub-color)] hover:text-[var(--main-color)]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {usedFallback && (
        <div className="mb-4 rounded-lg border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/8 px-4 py-3 text-sm text-[var(--sub-color)]">
          Leaderboard fallback сұраныспен жүктелді. Индекс deploy болғанда бұл бет азырақ Firestore оқиды.
        </div>
      )}
      
      {loading ? (
        <div className="p-8 text-center text-[var(--sub-color)] text-sm">Нәтижелер жүктелуде...</div>
      ) : scores.length === 0 ? (
        <div className="p-8 text-center text-[var(--sub-color)] text-sm">Әзірге нәтижелер жоқ. Бірінші болыңыз!</div>
      ) : (
        <div className="flex flex-col gap-2">
          {scores.map((score, index) => (
            <div key={score.id} className="p-3 md:p-4 flex items-center justify-between rounded-lg hover:bg-[var(--main-color)]/5 transition-colors gap-2">
              <div className="flex items-center gap-3 md:gap-6 min-w-0">
                <div className="w-5 md:w-6 text-center font-mono text-[var(--sub-color)] text-base md:text-lg flex-shrink-0">
                  {index + 1}
                </div>
                {score.photoURL ? (
                  <img src={score.photoURL} alt={score.displayName} className="w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--sub-color)]/20 flex items-center justify-center text-[var(--main-color)] font-semibold text-base md:text-lg flex-shrink-0">
                    {score.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-[var(--main-color)] text-base md:text-lg truncate">{score.displayName}</div>
                  <div className="text-xs md:text-sm text-[var(--sub-color)] capitalize truncate">{score.mode === 'time' ? `${score.amount} сек` : `${score.amount} сөз`}</div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3 md:gap-8 flex-shrink-0">
                <div>
                  <div className="text-[10px] md:text-xs text-[var(--sub-color)] mb-1 hidden sm:block">жылдамдық</div>
                  <div className="text-[10px] md:text-xs text-[var(--sub-color)] mb-1 sm:hidden">WPM</div>
                  <div className="font-bold text-[var(--accent-color)] text-xl md:text-2xl leading-none">{score.wpm}</div>
                </div>
                <div>
                  <div className="text-[10px] md:text-xs text-[var(--sub-color)] mb-1 hidden sm:block">дәлдік</div>
                  <div className="text-[10px] md:text-xs text-[var(--sub-color)] mb-1 sm:hidden">%</div>
                  <div className="font-medium text-[var(--main-color)] text-lg md:text-xl leading-none">{score.accuracy}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
