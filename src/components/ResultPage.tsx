import { Copy, Link2, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { TestConfig, TypingStats } from '../hooks/useTypingTest';
import { ResultRouteState, getTypingResultAchievements } from '../lib/results';
import { fetchScoreById } from '../lib/scores';
import { TypingFinishedStats } from './TypingFinishedStats';

function toTypingStats(score: Awaited<ReturnType<typeof fetchScoreById>>): TypingStats | null {
  if (!score) {
    return null;
  }

  return {
    wpm: score.wpm,
    rawWpm: score.rawWpm ?? score.wpm,
    accuracy: score.accuracy,
    correctChars: score.correctChars ?? 0,
    incorrectChars: score.incorrectChars ?? 0,
    extraChars: score.extraChars ?? 0,
    missedChars: score.missedChars ?? 0,
    time: score.time ?? 0,
    consistency: score.consistency ?? 0,
    history: Array.isArray(score.history) ? score.history : [],
    missedWords: [],
    errorMap: score.errorMap ?? {},
  };
}

function toTestConfig(score: Awaited<ReturnType<typeof fetchScoreById>>): TestConfig | null {
  if (!score) {
    return null;
  }

  return {
    mode: score.mode === 'words' ? 'words' : 'time',
    amount: score.amount,
    punctuation: score.punctuation ?? false,
    numbers: score.numbers ?? false,
  };
}

export function ResultPage() {
  const { scoreId = '' } = useParams();
  const location = useLocation();
  const routeState = location.state as ResultRouteState | null;
  const [stats, setStats] = useState<TypingStats | null>(routeState?.scoreId === scoreId ? routeState.stats : null);
  const [config, setConfig] = useState<TestConfig | null>(routeState?.scoreId === scoreId ? routeState.config : null);
  const [achievements, setAchievements] = useState<string[]>(
    routeState?.scoreId === scoreId ? routeState.achievements : []
  );
  const [loading, setLoading] = useState(!stats || !config);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    if (routeState?.scoreId === scoreId && routeState.stats && routeState.config) {
      setStats(routeState.stats);
      setConfig(routeState.config);
      setAchievements(routeState.achievements);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const loadResult = async () => {
      setLoading(true);
      const score = await fetchScoreById(scoreId);

      if (!active) {
        return;
      }

      const nextStats = toTypingStats(score);
      const nextConfig = toTestConfig(score);
      const createdAt = score?.createdAt?.toDate ? score.createdAt.toDate() : null;

      setStats(nextStats);
      setConfig(nextConfig);
      setAchievements(nextStats ? getTypingResultAchievements(nextStats, createdAt) : []);
      setLoading(false);
    };

    if (scoreId) {
      loadResult();
    } else {
      setStats(null);
      setConfig(null);
      setAchievements([]);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [routeState, scoreId]);

  const resultUrl = useMemo(() => {
    if (typeof window === 'undefined' || !scoreId) {
      return '';
    }

    return `${window.location.origin}/result/${scoreId}`;
  }, [scoreId]);

  const handleCopyLink = async () => {
    if (!resultUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--sub-color)]">Нәтиже жүктелуде...</div>;
  }

  if (!stats || !config) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-5 rounded-3xl border border-(--sub-color)/12 bg-(--main-color)/4 px-6 py-10 text-center">
        <div className="text-2xl font-semibold text-(--main-color)">Нәтиже табылмады</div>
        <div className="max-w-md text-sm text-(--sub-color)">
          Бұл сілтемедегі нәтиже жоқ немесе жойылған.
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-(--sub-color)/15 bg-(--main-color)/6 px-5 py-2.5 text-sm font-medium text-(--main-color) transition-colors hover:bg-(--main-color)/10"
        >
          <RotateCcw size={16} />
          Басты бетке оралу
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-(--sub-color)/10 bg-(--main-color)/4 px-4 py-3 text-sm text-(--sub-color)">
        <div className="inline-flex items-center gap-2">
          <Link2 size={15} className="text-(--accent-color)" />
          <span className="truncate">Нәтиже сілтемесі дайын</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-full border border-(--sub-color)/15 px-4 py-2 text-sm font-medium text-(--main-color) transition-colors hover:bg-(--main-color)/6"
          >
            <Copy size={14} />
            {copied ? 'Көшірілді' : 'Сілтемені көшіру'}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-(--accent-color) px-4 py-2 text-sm font-medium text-(--bg-color) transition-opacity hover:opacity-90"
          >
            <RotateCcw size={14} />
            Жаңа тест
          </Link>
        </div>
      </div>

      <TypingFinishedStats stats={stats} config={config} achievements={achievements} />
    </div>
  );
}
