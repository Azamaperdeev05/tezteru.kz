import { memo } from 'react';
import { AlertCircle, Zap, Target, TrendingUp } from 'lucide-react';

interface DetailedStatsProps {
  stats: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
    errorMap: Record<string, number>;
  };
}

export const DetailedStats = memo(({ stats }: DetailedStatsProps) => {
  const topErrors = Object.entries(stats.errorMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Precision Metric */}
      <div className="bg-[var(--bg-color)] p-4 rounded-xl border border-[var(--sub-color)]/20">
        <div className="flex items-center gap-2 text-[var(--sub-color)] mb-1 text-sm">
          <Target size={14} />
          <span>Дәлдік (Accuracy)</span>
        </div>
        <div className="text-2xl font-bold text-[var(--main-color)]">{stats.accuracy}%</div>
        <div className="text-xs text-[var(--sub-color)] mt-1">
          {stats.accuracy > 95 ? '🎯 Керемет дәлдік!' : '📈 Тәжірибе керек.'}
        </div>
      </div>

      {/* Consistency Metric */}
      <div className="bg-[var(--bg-color)] p-4 rounded-xl border border-[var(--sub-color)]/20">
        <div className="flex items-center gap-2 text-[var(--sub-color)] mb-1 text-sm">
          <Zap size={14} />
          <span>Тұрақтылық (Consistency)</span>
        </div>
        <div className="text-2xl font-bold text-[var(--accent-color)]">{stats.consistency}%</div>
        <div className="text-xs text-[var(--sub-color)] mt-1">Теру қарқынының бірқалыптылығы.</div>
      </div>

      {/* Raw vs Net WPM */}
      <div className="bg-[var(--bg-color)] p-4 rounded-xl border border-[var(--sub-color)]/20">
        <div className="flex items-center gap-2 text-[var(--sub-color)] mb-1 text-sm">
          <TrendingUp size={14} />
          <span>Raw WPM</span>
        </div>
        <div className="text-2xl font-bold text-[var(--main-color)]">{stats.rawWpm}</div>
        <div className="text-xs text-[var(--sub-color)] mt-1">Қателерді есептемегендегі жылдамдық.</div>
      </div>

      {/* Top Errors Section */}
      <div className="bg-[var(--bg-color)] p-4 rounded-xl border border-[var(--sub-color)]/20">
        <div className="flex items-center gap-2 text-[var(--sub-color)] mb-1 text-sm">
          <AlertCircle size={14} />
          <span>Жиі қате кететін әріптер</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {topErrors.length > 0 ? (
            topErrors.map(([char, count]) => (
              <div key={char} className="flex flex-col items-center flex-1 bg-[var(--sub-color)]/5 rounded p-1">
                <span className="text-lg font-bold text-[var(--error-color)]">{char === ' ' ? '␣' : char}</span>
                <span className="text-[10px] text-[var(--sub-color)]">{count}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-[var(--sub-color)]">Қате жоқ! ✨</span>
          )}
        </div>
      </div>

    </div>
  );
});

DetailedStats.displayName = 'DetailedStats';
