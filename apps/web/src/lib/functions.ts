import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';

// Firebase Functions has already been initialized in firebase.ts

// Function Types
export interface GenerateQuestionsRequest {
  topic: string;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  examType?: string;
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questionIds: string[];
  count: number;
  questions: Array<{
    id: string;
    question: string;
    topic: string;
    difficulty: string;
  }>;
}

export interface GenerateQuizParams {
  subject: string;
  numQuestions: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AnalyzePerformanceRequest {
  userId: string;
  examIds?: string[];
  timePeriod?: 'week' | 'month' | 'year' | 'all';
}

// Generic wrapper for Firebase Functions
const callFunction = <TData, TResult>(name: string) => {
  return httpsCallable<TData, TResult>(functions, name);
};

// Pre-configured function callers
export const generateQuestions = async (data: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> => {
  const func = callFunction<GenerateQuestionsRequest, GenerateQuestionsResponse>('generateQuestions');
  const result = await func(data);
  return result.data;
};

export const analyzePerformance = (data: AnalyzePerformanceRequest) => {
  return callFunction<AnalyzePerformanceRequest, any>('analyzePerformance')(data);
};

export const calculateLeaderboard = (data: { examType?: string }) => {
  return callFunction<{ examType?: string }, any>('calculateLeaderboard')(data);
};

export const generateQuiz = async (params: GenerateQuizParams): Promise<string> => {
  try {
    const generateQuizFunction = httpsCallable<GenerateQuizParams, string>(
      functions, 
      'generateGuestQuiz'
    );
    const result = await generateQuizFunction(params);
    return result.data;
  } catch (error) {
    console.error('Error calling generateGuestQuiz:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate quiz');
  }
};

// Hooks for React components
export const useGenerateQuestions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: GenerateQuestionsRequest) => {
      return await generateQuestions(data);
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      return data;
    }
  });
};

export const useAnalyzePerformance = (userId: string, options?: { examIds?: string[], timePeriod?: 'week' | 'month' | 'year' | 'all' }) => {
  return useQuery({
    queryKey: ['performance', userId, options?.examIds, options?.timePeriod],
    queryFn: async () => {
      const response = await analyzePerformance({
        userId,
        examIds: options?.examIds,
        timePeriod: options?.timePeriod || 'all'
      });
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useLeaderboard = (examType?: string) => {
  return useQuery({
    queryKey: ['leaderboard', examType],
    queryFn: async () => {
      const response = await calculateLeaderboard({ examType });
      return response.data;
    },
    // Cache leaderboard data for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenerateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: generateQuiz,
    onSuccess: () => {
      // Invalidate and refetch quizzes
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    }
  });
};

// Type-safe mutation hook factory
export function createMutation<TData, TResult, TError = unknown, TContext = unknown>(
  functionName: string,
  options?: Omit<UseMutationOptions<TResult, TError, TData, TContext>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: async (data: TData) => {
      const func = httpsCallable<TData, TResult>(functions, functionName);
      const result = await func(data);
      return result.data;
    },
    ...options
  });
}

// Usage Example:
// const submitExamMutation = createMutation<SubmitExamData, SubmitExamResult>('submitExam', {
//   onSuccess: (data) => {
//     queryClient.invalidateQueries(['attempts']);
//   }
// });