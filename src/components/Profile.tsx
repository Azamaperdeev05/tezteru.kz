import { User } from 'firebase/auth';
import { User as UserIcon, Activity, TrendingUp, Clock, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { fetchUserScores, StoredScore } from '../lib/scores';

interface ProfileProps {
  user: User;
}

export function Profile({ user }: ProfileProps) {
  const [scores, setScores] = useState<StoredScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let active = true;

    const loadScores = async () => {
      setLoading(true);
      const result = await fetchUserScores(user.uid, 50);

      if (active) {
        setScores([...result.scores].reverse());
        setUsedFallback(result.usedFallback);
        setLoading(false);
      }
    };

    loadScores();

    return () => {
      active = false;
    };
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
  const latestScores = [...scores].slice(-10).reverse();

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

      {usedFallback && (
        <div className="mb-6 rounded-lg border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/8 px-4 py-3 text-sm text-[var(--sub-color)]">
          Профиль деректері fallback режимде жүктелді. Firestore индексі deploy болғаннан кейін бұл ескерту жоғалады.
        </div>
      )}

      {scores.length > 0 ? (
        <div className="flex flex-col gap-6">
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

          <div className="rounded-3xl border border-[var(--sub-color)]/15 bg-[var(--main-color)]/4 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-[var(--main-color)]">
              <Clock size={18} className="text-[var(--accent-color)]" />
              <h3 className="text-base font-semibold">Соңғы 10 нәтиже</h3>
            </div>
            <div className="flex flex-col gap-2">
              {latestScores.map((score) => {
                const createdAt = score.createdAt?.toDate ? score.createdAt.toDate() : null;
                const resultLabel = score.mode === 'time' ? `${score.amount} сек` : `${score.amount} сөз`;

                return (
                  <Link
                    key={score.id}
                    to={`/result/${score.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--sub-color)]/12 bg-[var(--bg-color)]/65 px-4 py-3 transition-colors hover:border-[var(--accent-color)]/30 hover:bg-[var(--main-color)]/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--main-color)]">
                        <span>{resultLabel}</span>
                        <span className="text-[var(--sub-color)]/40">•</span>
                        <span className="text-[var(--sub-color)]">{createdAt ? createdAt.toLocaleString() : 'Жаңа нәтиже'}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--sub-color)]">
                        <span>Дәлдік: {score.accuracy}%</span>
                        <span>Тұрақтылық: {score.consistency ?? 0}%</span>
                        <span>{score.correctChars ?? 0}/{score.incorrectChars ?? 0}/{score.extraChars ?? 0}/{score.missedChars ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--sub-color)]">ЖСМ</div>
                        <div className="text-2xl font-bold text-[var(--accent-color)] leading-none">{score.wpm}</div>
                      </div>
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--sub-color)]/12 text-[var(--sub-color)]">
                        <Link2 size={15} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 text-[var(--sub-color)] bg-[var(--main-color)]/5 rounded-lg">
          Әзірге тест нәтижелері жоқ. Бірінші тестті бастаңыз!
        </div>
      )}
    </div>
  );
}
