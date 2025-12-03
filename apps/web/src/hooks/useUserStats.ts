import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  getUserStats, 
  updateUserStatsAfterTest, 
  initializeUserStats,
  UserStats,
  formatTimeSpent
} from '@/lib/firestore';
import { useAuthState } from '@/lib/auth';

/**
 * Hook to fetch user stats with real-time updates
 */
export function useUserStats() {
  const user = useAuthState();
  const [realtimeStats, setRealtimeStats] = useState<UserStats | null>(null);
  
  // Query for initial data and cache
  const { data: cachedStats, isLoading, error } = useQuery({
    queryKey: ['userStats', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      return await getUserStats(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Real-time listener for stats updates
  useEffect(() => {
    if (!user?.uid) {
      setRealtimeStats(null);
      return;
    }
    
    const statsRef = doc(db, 'userStats', user.uid);
    
    const unsubscribe = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRealtimeStats({ ...data, userId: snapshot.id } as UserStats);
      } else {
        // Initialize if doesn't exist
        initializeUserStats(user.uid).then(() => {
          // Will trigger another snapshot update
        });
      }
    }, (error) => {
      console.error('Error listening to user stats:', error);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);
  
  // Use real-time data if available, otherwise use cached data
  const stats = realtimeStats || cachedStats;
  
  // Computed values
  const formattedTimeSpent = stats ? formatTimeSpent(stats.totalTimeSpentSec) : '0m';
  const accuracyPercentage = stats ? Math.round(stats.accuracy) : 0;
  const improvement = stats && stats.recentScores.length >= 2
    ? Math.round(stats.recentScores[stats.recentScores.length - 1].score - stats.recentScores[0].score)
    : 0;
  
  return {
    stats,
    isLoading,
    error,
    formattedTimeSpent,
    accuracyPercentage,
    improvement,
  };
}

/**
 * Hook to update user stats after completing a test
 */
export function useUpdateUserStats() {
  const queryClient = useQueryClient();
  const user = useAuthState();
  
  return useMutation({
    mutationFn: async (testData: {
      testId: string;
      questionsAnswered: number;
      correctAnswers: number;
      incorrectAnswers: number;
      skippedQuestions: number;
      timeSpentSec: number;
      score: number;
    }) => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      return await updateUserStatsAfterTest(user.uid, testData);
    },
    onSuccess: (result) => {
      // Invalidate and refetch user stats
      if (user?.uid) {
        queryClient.invalidateQueries({ queryKey: ['userStats', user.uid] });
      }
      
      // Return achievements for display
      return result;
    },
    onError: (error) => {
      console.error('Error updating user stats:', error);
    }
  });
}

/**
 * Hook to get user stats summary for display
 */
export function useUserStatsSummary() {
  const { stats, isLoading, formattedTimeSpent, accuracyPercentage, improvement } = useUserStats();
  
  if (!stats) {
    return {
      isLoading,
      summary: {
        streak: 0,
        questionsAnswered: 0,
        accuracy: 0,
        timeSpent: '0m',
        testsCompleted: 0,
        improvement: 0,
        longestStreak: 0,
        recentScore: 0,
        fullMockScore: 0,
        fullMockAccuracy: 0,
        fullMockTests: 0,
        sectionalScore: 0,
        sectionalAccuracy: 0,
        sectionalTests: 0,
        topicWiseScore: 0,
        topicWiseAccuracy: 0,
        topicWiseTests: 0,
      }
    };
  }
  
  return {
    isLoading,
    summary: {
      streak: stats.currentStreak,
      questionsAnswered: stats.questionsAnswered,
      accuracy: accuracyPercentage,
      timeSpent: formattedTimeSpent,
      testsCompleted: stats.testsCompleted,
      improvement,
      longestStreak: stats.longestStreak,
      recentScore: stats.recentScores.length > 0 
        ? Math.round(stats.recentScores[stats.recentScores.length - 1].score)
        : 0,
      fullMockScore: stats.fullMockScore || 0,
      fullMockAccuracy: stats.fullMockAccuracy || 0,
      fullMockTests: stats.fullMockTests || 0,
      sectionalScore: stats.sectionalScore || 0,
      sectionalAccuracy: stats.sectionalAccuracy || 0,
      sectionalTests: stats.sectionalTests || 0,
      topicWiseScore: stats.topicWiseScore || 0,
      topicWiseAccuracy: stats.topicWiseAccuracy || 0,
      topicWiseTests: stats.topicWiseTests || 0,
    }
  };
}
