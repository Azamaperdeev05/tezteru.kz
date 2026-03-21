import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import type { TestConfig, TypingStats } from '../hooks/useTypingTest';

interface TypingFinishedStatsProps {
  stats: TypingStats;
  config: TestConfig;
  achievements: string[];
}

export function TypingFinishedStats({ stats, config, achievements }: TypingFinishedStatsProps) {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex flex-col justify-center min-w-[120px] sm:min-w-[150px] text-center md:text-left">
          <div className="mb-4 group relative cursor-help">
            <div className="text-2xl sm:text-3xl text-(--sub-color) mb-[-8px] border-b border-dashed border-(--sub-color)/50 inline-block">жсм</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 mb-2 hidden group-hover:block w-48 p-2 bg-(--sub-color) text-(--bg-color) text-xs rounded shadow-lg z-50">
              Жылдамдық: минутына сөз саны (Words Per Minute)
            </div>
            <div className="text-5xl sm:text-7xl font-bold text-(--accent-color) leading-none">{stats.wpm}</div>
          </div>
          <div className="group relative cursor-help">
            <div className="text-2xl sm:text-3xl text-(--sub-color) mb-[-8px] border-b border-dashed border-(--sub-color)/50 inline-block">дәлдік</div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 mb-2 hidden group-hover:block w-48 p-2 bg-(--sub-color) text-(--bg-color) text-xs rounded shadow-lg z-50">
              Дұрыс жазылған әріптердің пайызы (Accuracy)
            </div>
            <div className="text-5xl sm:text-7xl font-bold text-(--accent-color) leading-none">{stats.accuracy}%</div>
          </div>
          <div className="mt-6 text-(--sub-color) text-sm">
            <div>тест түрі</div>
            <div className="text-(--main-color)">
              {config.mode} {config.amount}<br />
              қазақша
              {config.punctuation && ' + белгілер'}
              {config.numbers && ' + сандар'}
              {config.practiceWords && config.practiceWords.length > 0 && ' (қатемен жұмыс)'}
            </div>
          </div>
        </div>

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

      {achievements.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <h3 className="text-[var(--sub-color)] text-sm uppercase tracking-widest">Жетістіктер</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {achievements.map((achievement, index) => (
              <div key={achievement} className="px-4 py-2 bg-[var(--accent-color)]/10 text-[var(--accent-color)] rounded-full text-sm font-bold border border-[var(--accent-color)]/20 shadow-sm animate-in zoom-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                {achievement}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.errorMap && Object.keys(stats.errorMap).length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-2">
          <h3 className="text-[var(--sub-color)] text-sm uppercase tracking-widest mb-2">Қателер картасы</h3>
          <div className="flex flex-col gap-1">
            {[
              ['ә', 'і', 'ң', 'ғ', 'ү', 'ұ', 'қ', 'ө', 'һ'],
              ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
              ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
              ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
            ].map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map((char) => {
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
  );
}
