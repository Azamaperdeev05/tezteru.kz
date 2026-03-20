import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { DetailedStats } from './DetailedStats';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BarChart as BarChartIcon, History, Target, TrendingUp } from 'lucide-react';

interface Score {
  id: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  createdAt: any;
  errorMap?: Record<string, number>;
}

export function StatsPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'scores'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Score));
      setScores(data.reverse()); // Chart үшін хронологиялық рет
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold text-[var(--main-color)] mb-4">Статистиканы көру үшін жүйеге кіріңіз</h2>
        <p className="text-[var(--sub-color)] max-w-md">Сіздің барлық нәтижелеріңіз сақталып, осы жерде график түрінде көрсетіледі.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center p-12 text-[var(--sub-color)]">Деректер жүктелуде...</div>;

  const lastScore = scores[scores.length - 1];
  const avgWpm = scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.wpm, 0) / scores.length) : 0;
  const bestWpm = scores.length > 0 ? Math.max(...scores.map(s => s.wpm)) : 0;
  
  // Жиынтық қателер картасы (Global Error Map)
  const globalErrorMap: Record<string, number> = {};
  scores.forEach(s => {
    if (s.errorMap) {
      Object.entries(s.errorMap).forEach(([char, count]) => {
        globalErrorMap[char] = (globalErrorMap[char] || 0) + count;
      });
    }
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[var(--main-color)] flex items-center gap-3">
          <BarChartIcon className="text-[var(--accent-color)]" /> Статистика
        </h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-color)] p-6 rounded-2xl border border-[var(--sub-color)]/20 flex flex-col items-center">
          <TrendingUp className="text-[var(--accent-color)] mb-2" />
          <span className="text-[var(--sub-color)] text-sm uppercase">Ең үздік WPM</span>
          <span className="text-5xl font-bold text-[var(--main-color)]">{bestWpm}</span>
        </div>
        <div className="bg-[var(--bg-color)] p-6 rounded-2xl border border-[var(--sub-color)]/20 flex flex-col items-center">
          <Target className="text-[var(--accent-color)] mb-2" />
          <span className="text-[var(--sub-color)] text-sm uppercase">Орташа WPM</span>
          <span className="text-5xl font-bold text-[var(--main-color)]">{avgWpm}</span>
        </div>
        <div className="bg-[var(--bg-color)] p-6 rounded-2xl border border-[var(--sub-color)]/20 flex flex-col items-center">
          <History className="text-[var(--accent-color)] mb-2" />
          <span className="text-[var(--sub-color)] text-sm uppercase">Барлық тесттер</span>
          <span className="text-5xl font-bold text-[var(--main-color)]">{scores.length}</span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-[var(--bg-color)] p-6 rounded-2xl border border-[var(--sub-color)]/20 h-[400px]">
        <h3 className="text-lg font-bold text-[var(--main-color)] mb-6 flex items-center gap-2">
          Теру прогресі (WPM бойынша)
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={scores}>
            <defs>
              <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sub-color)" opacity={0.1} />
            <XAxis dataKey="createdAt" hide />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--sub-color)', fontSize: 12 }} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--sub-color)', borderRadius: '12px' }}
               itemStyle={{ color: 'var(--main-color)' }}
            />
            <Area type="monotone" dataKey="wpm" name="WPM" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Last Test Detailed Stats */}
      {lastScore && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-[var(--main-color)]">Соңғы тест мәліметтері</h3>
          <DetailedStats stats={{
            wpm: lastScore.wpm,
            rawWpm: lastScore.wpm, // Пример, если raw не сохраняется отдельно
            accuracy: lastScore.accuracy,
            consistency: lastScore.consistency || 0,
            errorMap: lastScore.errorMap || {}
          }} />
        </div>
      )}
    </div>
  );
}
