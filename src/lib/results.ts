import type { TestConfig, TypingStats } from '../hooks/useTypingTest';

export interface ResultRouteState {
  scoreId: string;
  stats: TypingStats;
  config: TestConfig;
  achievements: string[];
}

export function getTypingResultAchievements(stats: TypingStats, createdAt?: Date | null) {
  const achievements: string[] = [];

  if (stats.wpm >= 100) {
    achievements.push('🏆 100 ЖСМ клубы');
  }

  if (stats.accuracy === 100) {
    achievements.push('🎯 Мерген');
  }

  if (stats.wpm >= 50 && stats.wpm < 100) {
    achievements.push('🚀 Жылдам жазушы');
  }

  const hour = (createdAt ?? new Date()).getHours();

  if (hour >= 22 || hour <= 4) {
    achievements.push('🦉 Түнгі үкі');
  }

  return achievements;
}
