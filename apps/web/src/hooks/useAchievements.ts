import { useQuery } from '@tanstack/react-query';
import { useAuthState } from '@/lib/auth';
import { getUserAchievements, type Achievement } from '@/lib/firestore';

/**
 * Hook to fetch user's achievements
 */
export function useAchievements() {
  const user = useAuthState();

  const { data, isLoading, error } = useQuery({
    queryKey: ['achievements', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      return await getUserAchievements(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const achievements = data?.achievements || [];
  const totalPoints = data?.totalPoints || 0;
  
  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // Get latest achievements (last 5)
  const latestAchievements = [...achievements]
    .sort((a, b) => (b.earnedAt?.toMillis() || 0) - (a.earnedAt?.toMillis() || 0))
    .slice(0, 5);

  return {
    achievements,
    totalPoints,
    achievementsByCategory,
    latestAchievements,
    isLoading,
    error,
  };
}
