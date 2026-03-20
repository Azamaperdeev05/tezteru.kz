import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

interface Score {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  wpm: number;
  accuracy: number;
  mode: string;
  amount: number;
  createdAt: any;
}

export function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'time' | 'words'>('time');
  const [amount, setAmount] = useState<number>(30);

  useEffect(() => {
    setLoading(true);
    // Fetch more scores to ensure we get enough unique users
    const q = query(
      collection(db, 'scores'),
      orderBy('wpm', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const uniqueScores: Score[] = [];
        const seenUids = new Set<string>();

        snapshot.forEach((doc) => {
          const data = doc.data() as Score;
          if (data.mode !== mode || data.amount !== amount) return;
          
          // Only keep the first (highest) score for each user in this category
          if (!seenUids.has(data.uid)) {
            seenUids.add(data.uid);
            uniqueScores.push({ id: doc.id, ...data });
          }
        });

        // Take only the top 10 unique users
        setScores(uniqueScores.slice(0, 10));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'scores');
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
      
      {loading ? (
        <div className="p-8 text-center text-[var(--sub-color)] text-sm">Нәтижелер жүктелуде...</div>
      ) : scores.length === 0 ? (
        <div className="p-8 text-center text-[var(--sub-color)] text-sm">Әзірге нәтижелер жоқ. Бірінші болыңыз!</div>
      ) : (
        <div className="flex flex-col gap-2">
          {scores.map((score, index) => (
            <div key={score.id} className="p-4 flex items-center justify-between rounded-lg hover:bg-[var(--main-color)]/5 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-6 text-center font-mono text-[var(--sub-color)] text-lg">
                  {index + 1}
                </div>
                {score.photoURL ? (
                  <img src={score.photoURL} alt={score.displayName} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--sub-color)]/20 flex items-center justify-center text-[var(--main-color)] font-semibold text-lg">
                    {score.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-[var(--main-color)] text-lg">{score.displayName}</div>
                  <div className="text-sm text-[var(--sub-color)] capitalize">{score.mode === 'time' ? `${score.amount} сек` : `${score.amount} сөз`}</div>
                </div>
              </div>
              <div className="text-right flex items-center gap-8">
                <div>
                  <div className="text-xs text-[var(--sub-color)] mb-1">жылдамдық</div>
                  <div className="font-bold text-[var(--accent-color)] text-2xl leading-none">{score.wpm}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--sub-color)] mb-1">дәлдік</div>
                  <div className="font-medium text-[var(--main-color)] text-xl leading-none">{score.accuracy}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
