import { useQuery } from '@tanstack/react-query';
import { useAuthState } from '@/lib/auth';
import { useUserStats } from './useUserStats';
import { useTheme } from '@mui/material';

interface RecommendedExam {
  id: string;
  title: string;
  category: string;
  duration: string;
  questions: number;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  color: string;
  progress: number;
  reason: string; // Why this exam is recommended
}

/**
 * Hook to get recommended exams based on user performance
 */
export function useRecommendedExams() {
  const user = useAuthState();
  const { stats } = useUserStats();
  const theme = useTheme();

  return useQuery({
    queryKey: ['recommendedExams', user?.uid, stats?.testsCompleted],
    queryFn: async (): Promise<RecommendedExam[]> => {
      // Base exam catalog
      const examCatalog: Omit<RecommendedExam, 'reason'>[] = [
        {
          id: 'ssc-cgl-2024',
          title: 'SSC CGL Tier 1 Mock Test',
          category: 'Government',
          duration: '60 min',
          questions: 100,
          difficulty: 'Moderate',
          color: theme.palette.primary.main,
          progress: 0,
        },
        {
          id: 'ssc-chsl-2024',
          title: 'SSC CHSL Mock Test',
          category: 'Government',
          duration: '60 min',
          questions: 100,
          difficulty: 'Moderate',
          color: theme.palette.secondary.main,
          progress: 0,
        },
        {
          id: 'ibps-po-prelims',
          title: 'IBPS PO Prelims Mock',
          category: 'Banking',
          duration: '60 min',
          questions: 100,
          difficulty: 'Advanced',
          color: theme.palette.info.main,
          progress: 0,
        },
        {
          id: 'reasoning-practice',
          title: 'Reasoning Ability Test',
          category: 'Sectional',
          duration: '20 min',
          questions: 25,
          difficulty: 'Moderate',
          color: theme.palette.success.main,
          progress: 0,
        },
        {
          id: 'quant-practice',
          title: 'Quantitative Aptitude Test',
          category: 'Sectional',
          duration: '25 min',
          questions: 25,
          difficulty: 'Advanced',
          color: theme.palette.warning.main,
          progress: 0,
        },
        {
          id: 'english-practice',
          title: 'English Language Test',
          category: 'Sectional',
          duration: '12 min',
          questions: 25,
          difficulty: 'Easy',
          color: theme.palette.error.main,
          progress: 0,
        },
      ];

      // Recommendation logic
      const recommendations: RecommendedExam[] = [];

      if (!stats || stats.testsCompleted === 0) {
        // New user - recommend beginner-friendly tests
        recommendations.push({
          ...examCatalog[3], // Reasoning
          reason: 'Great starting point for beginners',
        });
        recommendations.push({
          ...examCatalog[5], // English
          reason: 'Build your basics with this test',
        });
        recommendations.push({
          ...examCatalog[1], // SSC CHSL
          reason: 'Perfect for your first full mock test',
        });
      } else {
        // Experienced user - personalized recommendations
        
        // If accuracy is low, recommend easier tests
        if (stats.accuracy < 60) {
          recommendations.push({
            ...examCatalog[5], // English (Easy)
            reason: 'Improve accuracy with easier topics',
          });
          recommendations.push({
            ...examCatalog[3], // Reasoning (Moderate)
            reason: 'Build confidence with moderate difficulty',
          });
        }
        
        // If user has completed few tests, encourage full mocks
        if (stats.testsCompleted < 5) {
          recommendations.push({
            ...examCatalog[0], // SSC CGL
            reason: 'Challenge yourself with a full mock',
          });
        }
        
        // If accuracy is good, recommend advanced tests
        if (stats.accuracy >= 75) {
          recommendations.push({
            ...examCatalog[2], // IBPS PO
            reason: 'Ready for advanced challenges',
          });
          recommendations.push({
            ...examCatalog[4], // Quant (Advanced)
            reason: 'Sharpen your quantitative skills',
          });
        }
        
        // If user has high streak, encourage maintaining it
        if (stats.currentStreak >= 5) {
          recommendations.push({
            ...examCatalog[1], // SSC CHSL
            reason: `Keep your ${stats.currentStreak}-day streak going!`,
          });
        }
        
        // General recommendation based on tests completed
        if (stats.testsCompleted >= 10) {
          recommendations.push({
            ...examCatalog[2], // IBPS PO
            reason: 'Experienced user - try banking exams',
          });
        }
      }

      // If we have fewer than 3 recommendations, fill with popular exams
      if (recommendations.length < 3) {
        const remaining = examCatalog
          .filter(exam => !recommendations.find(r => r.id === exam.id))
          .slice(0, 3 - recommendations.length)
          .map(exam => ({
            ...exam,
            reason: 'Popular choice among students',
          }));
        
        recommendations.push(...remaining);
      }

      // Return top 3 recommendations
      return recommendations.slice(0, 3);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}
