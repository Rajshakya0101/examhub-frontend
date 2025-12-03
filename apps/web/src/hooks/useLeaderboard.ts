import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getLeaderboardEntries,
  getUserRank,
  updateLeaderboardEntry,
  LeaderboardEntry,
} from '@/lib/firestore';
import { useAuthState } from '@/lib/auth';
import { useUserStats } from './useUserStats';

/**
 * Hook to fetch leaderboard data with real-time updates
 */
export function useLeaderboard(
  type: 'global' | 'weekly' | 'monthly' = 'global',
  limitCount: number = 100
) {
  const [realtimeEntries, setRealtimeEntries] = useState<LeaderboardEntry[]>([]);

  // Query for initial data and cache
  const { data: cachedEntries, isLoading, error } = useQuery({
    queryKey: ['leaderboard', type, limitCount],
    queryFn: () => getLeaderboardEntries(type, limitCount),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  // Real-time listener for leaderboard updates
  useEffect(() => {
    const collectionName =
      type === 'global'
        ? 'leaderboard_global'
        : type === 'weekly'
        ? 'leaderboard_weekly'
        : 'leaderboard_monthly';

    const q = query(
      collection(db, collectionName),
      orderBy('totalScore', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
          ...(doc.data() as Omit<LeaderboardEntry, 'rank'>),
          rank: index + 1,
        }));
        setRealtimeEntries(entries);
      },
      (error) => {
        console.error('Error listening to leaderboard:', error);
      }
    );

    return () => unsubscribe();
  }, [type, limitCount]);

  // Use real-time data if available, otherwise use cached data
  const entries = realtimeEntries.length > 0 ? realtimeEntries : cachedEntries || [];

  return {
    entries,
    isLoading,
    error,
    totalEntries: entries.length,
  };
}

/**
 * Hook to get current user's rank
 */
export function useUserRank(type: 'global' | 'weekly' | 'monthly' = 'global') {
  const user = useAuthState();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userRank', user?.uid, type],
    queryFn: async () => {
      if (!user?.uid) return null;
      return await getUserRank(user.uid, type);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    rank: data?.rank && data.rank > 0 ? data.rank : 1,
    totalUsers: data?.totalUsers ?? 0,
    entry: data?.entry ?? null,
    isLoading,
    error,
  };
}

/**
 * Hook to update leaderboard after test completion
 */
export function useUpdateLeaderboard() {
  const queryClient = useQueryClient();
  const user = useAuthState();
  const { stats } = useUserStats();

  return useMutation({
    mutationFn: async () => {
      if (!user?.uid || !stats) {
        throw new Error('User not authenticated or stats not available');
      }

      const userProfile = {
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || undefined,
      };

      await updateLeaderboardEntry(user.uid, userProfile, stats);
    },
    onSuccess: () => {
      // Invalidate all leaderboard queries
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
    },
    onError: (error) => {
      console.error('Error updating leaderboard:', error);
    },
  });
}

/**
 * Hook to get leaderboard with filters
 */
export function useFilteredLeaderboard(
  type: 'global' | 'weekly' | 'monthly' = 'global',
  filters?: {
    searchTerm?: string;
    minScore?: number;
    maxScore?: number;
  }
) {
  const { entries, isLoading, error } = useLeaderboard(type);

  const filteredEntries = entries.filter((entry) => {
    // Search filter
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      if (!entry.displayName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Score range filter
    if (filters?.minScore !== undefined && entry.totalScore < filters.minScore) {
      return false;
    }
    if (filters?.maxScore !== undefined && entry.totalScore > filters.maxScore) {
      return false;
    }

    return true;
  });

  return {
    entries: filteredEntries,
    isLoading,
    error,
    totalEntries: filteredEntries.length,
  };
}

/**
 * Hook to get top performers (top 3)
 */
export function useTopPerformers(type: 'global' | 'weekly' | 'monthly' = 'global') {
  const { entries, isLoading } = useLeaderboard(type, 3);

  return {
    topThree: entries.slice(0, 3),
    isLoading,
  };
}
