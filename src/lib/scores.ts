import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType, handleFirestoreError, isMissingIndexError } from './firebase-errors';

export interface StoredScore {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string | null;
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  mode: string;
  amount: number;
  createdAt: any;
  errorMap?: Record<string, number>;
  correctChars?: number;
  incorrectChars?: number;
  extraChars?: number;
  missedChars?: number;
  time?: number;
}

function toStoredScore(doc: any): StoredScore {
  return { id: doc.id, ...doc.data() } as StoredScore;
}

function getScoreTime(score: StoredScore) {
  if (score.createdAt?.toMillis) {
    return score.createdAt.toMillis();
  }

  if (typeof score.createdAt?.seconds === 'number') {
    return score.createdAt.seconds * 1000;
  }

  return 0;
}

function sortScoresByDateDesc(scores: StoredScore[]) {
  return [...scores].sort((left, right) => getScoreTime(right) - getScoreTime(left));
}

function sortScoresByWpmDesc(scores: StoredScore[]) {
  return [...scores].sort((left, right) => {
    if (right.wpm !== left.wpm) {
      return right.wpm - left.wpm;
    }

    return getScoreTime(right) - getScoreTime(left);
  });
}

export async function fetchUserScores(uid: string, limitCount: number) {
  try {
    const indexedSnapshot = await getDocs(
      query(
        collection(db, 'scores'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    );

    return {
      scores: indexedSnapshot.docs.map(toStoredScore),
      usedFallback: false,
    };
  } catch (error) {
    if (!isMissingIndexError(error)) {
      handleFirestoreError(error, OperationType.GET, 'scores');
      return { scores: [], usedFallback: false };
    }

    console.warn('Missing Firestore index for user scores. Falling back to client-side sorting.');

    try {
      const fallbackSnapshot = await getDocs(
        query(collection(db, 'scores'), where('uid', '==', uid))
      );

      return {
        scores: sortScoresByDateDesc(fallbackSnapshot.docs.map(toStoredScore)).slice(0, limitCount),
        usedFallback: true,
      };
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.GET, 'scores');
      return { scores: [], usedFallback: true };
    }
  }
}

export async function fetchLeaderboardScores(mode: 'time' | 'words', amount: number, limitCount: number) {
  const collectUniqueScores = (scores: StoredScore[]) => {
    const uniqueScores: StoredScore[] = [];
    const seenUids = new Set<string>();

    for (const score of scores) {
      if (score.mode !== mode || score.amount !== amount) {
        continue;
      }

      if (!seenUids.has(score.uid)) {
        seenUids.add(score.uid);
        uniqueScores.push(score);
      }

      if (uniqueScores.length >= limitCount) {
        break;
      }
    }

    return uniqueScores;
  };

  try {
    const indexedSnapshot = await getDocs(
      query(
        collection(db, 'scores'),
        where('mode', '==', mode),
        where('amount', '==', amount),
        orderBy('wpm', 'desc'),
        limit(Math.max(limitCount * 5, 50))
      )
    );

    return {
      scores: collectUniqueScores(indexedSnapshot.docs.map(toStoredScore)),
      usedFallback: false,
    };
  } catch (error) {
    if (!isMissingIndexError(error)) {
      handleFirestoreError(error, OperationType.GET, 'scores');
      return { scores: [], usedFallback: false };
    }

    console.warn('Missing Firestore index for leaderboard. Falling back to amount-filtered client-side sorting.');

    try {
      const fallbackSnapshot = await getDocs(
        query(collection(db, 'scores'), where('amount', '==', amount))
      );
      const filteredScores = fallbackSnapshot.docs
        .map(toStoredScore)
        .filter((score) => score.mode === mode);

      return {
        scores: collectUniqueScores(sortScoresByWpmDesc(filteredScores)),
        usedFallback: true,
      };
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.GET, 'scores');
      return { scores: [], usedFallback: true };
    }
  }
}
