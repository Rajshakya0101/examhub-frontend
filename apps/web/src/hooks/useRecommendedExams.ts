import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useTheme } from '@mui/material';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/auth';
import { useUserStats } from './useUserStats';

interface FirestoreTestDoc {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  templateId?: string;
  difficulty?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  status?: string;
  createdAt?: any;
}

interface RecommendedExam {
  id: string;
  title: string;
  category: string;
  duration: string;
  questions: number;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  color: string;
  progress: number;
  reason: string;
}

const normalizeDifficulty = (difficulty?: string): 'Easy' | 'Moderate' | 'Advanced' => {
  const value = (difficulty || '').toLowerCase();
  if (value === 'easy') return 'Easy';
  if (value === 'hard' || value === 'advanced') return 'Advanced';
  return 'Moderate';
};

const getDifficultyWeight = (difficulty: 'Easy' | 'Moderate' | 'Advanced') => {
  if (difficulty === 'Easy') return 0;
  if (difficulty === 'Moderate') return 1;
  return 2;
};

const getCategory = (test: FirestoreTestDoc) => {
  if (test.category) return test.category;
  if (test.templateId) return test.templateId.replace(/[-_]/g, ' ').toUpperCase();
  return 'CUSTOM';
};

const getReason = (
  testsCompleted: number,
  accuracy: number,
  difficulty: 'Easy' | 'Moderate' | 'Advanced',
  progress: number
) => {
  if (progress > 0) {
    return `You last scored ${Math.round(progress)}% on this test`;
  }

  if (testsCompleted === 0) {
    return 'A live test from the current catalog to start your practice';
  }

  if (accuracy < 60) {
    return difficulty === 'Easy'
      ? 'Lower difficulty to help improve accuracy'
      : 'A current active test to keep building consistency';
  }

  if (accuracy >= 75) {
    return difficulty === 'Advanced'
      ? 'A stronger challenge based on your current performance'
      : 'A solid active test to keep your momentum';
  }

  return 'A current active test matched to your progress';
};

export function useRecommendedExams() {
  const user = useAuthState();
  const { stats } = useUserStats();
  const theme = useTheme();

  return useQuery({
    queryKey: ['recommendedExams', user?.uid, stats?.testsCompleted, stats?.accuracy],
    queryFn: async (): Promise<RecommendedExam[]> => {
      if (!user?.uid) return [];

      const testsRef = collection(db, 'tests');
      let availableTests: FirestoreTestDoc[] = [];

      try {
        const activeTestsQuery = query(
          testsRef,
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(activeTestsQuery);
        availableTests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreTestDoc[];
      } catch (error) {
        console.warn('Active tests query failed, using fallback fetch.', error);
        const fallbackQuery = query(testsRef, where('status', '==', 'active'), limit(20));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        availableTests = fallbackSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreTestDoc[];
      }

      if (availableTests.length === 0) {
        return [];
      }

      let attemptHistory: { examId: string; percentage: number; submittedAt: number }[] = [];
      try {
        const attemptsSnapshot = await getDocs(
          query(collection(db, 'attempts'), where('userId', '==', user.uid), limit(50))
        );
        attemptHistory = attemptsSnapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            return {
              examId: data.examId,
              percentage: Number(data.score?.percentage ?? 0),
              submittedAt: data.submittedAt?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? 0,
            };
          })
          .filter((attempt) => attempt.examId)
          .sort((a, b) => b.submittedAt - a.submittedAt);
      } catch (error) {
        console.warn('Recent attempts lookup failed, continuing without progress data.', error);
      }

      const latestAttemptByExam = new Map<string, number>();
      for (const attempt of attemptHistory) {
        if (!latestAttemptByExam.has(attempt.examId)) {
          latestAttemptByExam.set(attempt.examId, attempt.percentage);
        }
      }

      const rankedTests = [...availableTests].sort((a, b) => {
        const difficultyA = normalizeDifficulty(a.difficulty);
        const difficultyB = normalizeDifficulty(b.difficulty);
        const weightA = getDifficultyWeight(difficultyA);
        const weightB = getDifficultyWeight(difficultyB);
        const progressA = latestAttemptByExam.get(a.id) ?? 0;
        const progressB = latestAttemptByExam.get(b.id) ?? 0;
        const createdAtA = a.createdAt?.toMillis?.() ?? 0;
        const createdAtB = b.createdAt?.toMillis?.() ?? 0;

        if (!stats || stats.testsCompleted === 0) {
          return (a.durationMinutes || 0) - (b.durationMinutes || 0) || createdAtB - createdAtA;
        }

        if (stats.accuracy < 60) {
          return weightA - weightB || (a.durationMinutes || 0) - (b.durationMinutes || 0) || createdAtB - createdAtA;
        }

        if (stats.accuracy >= 75) {
          return weightB - weightA || createdAtB - createdAtA || progressB - progressA;
        }

        return createdAtB - createdAtA || progressB - progressA;
      });

      const selectedTests = rankedTests.slice(0, 3);

      return selectedTests.map((test) => {
        const difficulty = normalizeDifficulty(test.difficulty);
        const progress = latestAttemptByExam.get(test.id) ?? 0;

        return {
          id: test.id,
          title: test.title || 'Untitled Test',
          category: getCategory(test),
          duration: `${test.durationMinutes || 0} min`,
          questions: test.totalQuestions || 0,
          difficulty,
          color: theme.palette.primary.main,
          progress,
          reason: getReason(stats?.testsCompleted || 0, stats?.accuracy || 0, difficulty, progress),
        };
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
}
