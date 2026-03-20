import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { User as UserIcon, Activity, TrendingUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileProps {
  user: User;
}

interface Score {
  id: string;
  wpm: number;
  accuracy: number;
  mode: string;
  amount: number;
  createdAt: any;
}

export function Profile({ user }: ProfileProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'scores'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newScores: Score[] = [];
        snapshot.forEach((doc) => {
          newScores.push({ id: doc.id, ...doc.data() } as Score);
        });
        setScores(newScores.reverse()); // Chronological for chart
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'scores');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  if (loading) {
    return <div className="p-8 text-center text-[var(--sub-color)]">Жүктелуде...</div>;
  }

  const pb = scores.length > 0 ? Math.max(...scores.map(s => s.wpm)) : 0;
  const avgWpm = scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.wpm, 0) / scores.length) : 0;
  const testsCompleted = scores.length;

  const chartData = scores.map((s, i) => ({
    index: i + 1,
    wpm: s.wpm,
    accuracy: s.accuracy,
    date: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : 'Жаңа'
  }));

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || ''} className="w-16 h-16 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--sub-color)]/20 flex items-center justify-center text-[var(--main-color)]">
            <UserIcon size={32} />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-[var(--main-color)]">{user.displayName || 'Қолданушы'}</h2>
          <p className="text-[var(--sub-color)]">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--main-color)]/5 p-6 rounded-lg">
          <div className="flex items-center gap-2 text-[var(--sub-color)] mb-2">
            <TrendingUp size={18} />
            <span>Ең жоғарғы WPM</span>
          </div>
          <div className="text-4xl font-bold text-[var(--accent-color)]">{pb}</div>
        </div>
        <div className="bg-[var(--main-color)]/5 p-6 rounded-lg">
          <div className="flex items-center gap-2 text-[var(--sub-color)] mb-2">
            <Activity size={18} />
            <span>Орташа WPM</span>
          </div>
          <div className="text-4xl font-bold text-[var(--main-color)]">{avgWpm}</div>
        </div>
        <div className="bg-[var(--main-color)]/5 p-6 rounded-lg">
          <div className="flex items-center gap-2 text-[var(--sub-color)] mb-2">
            <Clock size={18} />
            <span>Аяқталған тесттер</span>
          </div>
          <div className="text-4xl font-bold text-[var(--main-color)]">{testsCompleted}</div>
        </div>
      </div>

      {scores.length > 0 ? (
        <div className="h-[300px] w-full bg-[var(--main-color)]/5 p-4 rounded-lg">
          <h3 className="text-[var(--sub-color)] mb-4 font-medium">Прогресс тарихы</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sub-color)" opacity={0.2} />
              <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fill: 'var(--sub-color)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--sub-color)', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--sub-color)', borderRadius: '8px', color: 'var(--main-color)' }}
                itemStyle={{ color: 'var(--main-color)' }}
                labelStyle={{ color: 'var(--sub-color)' }}
                labelFormatter={(label, payload) => payload[0]?.payload?.date || label}
              />
              <Line type="monotone" dataKey="wpm" name="WPM" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-color)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center p-8 text-[var(--sub-color)] bg-[var(--main-color)]/5 rounded-lg">
          Әзірге тест нәтижелері жоқ. Бірінші тестті бастаңыз!
        </div>
      )}
    </div>
  );
}
