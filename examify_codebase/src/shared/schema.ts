import { z } from 'zod';

// User schema
export const userSchema = z.object({
  displayName: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable().optional(),
  photoURL: z.string().url().nullable(),
  targetExam: z.string().optional(),
  prefs: z.object({
    theme: z.enum(['system', 'light', 'dark']),
    language: z.enum(['en', 'hi']),
    fontScale: z.number()
  }),
  streak: z.number(),
  badges: z.array(z.string()),
  createdAt: z.any() // Firestore Timestamp
});

export type User = z.infer<typeof userSchema>;

// Question schema
export const questionSchema = z.object({
  examId: z.string(),
  section: z.string(),
  topic: z.string(),
  type: z.literal('mcq'),
  stem: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'live', 'archived']),
  metrics: z.object({
    pValue: z.number().min(0).max(1).optional(),
    disc: z.number().min(-1).max(1).optional(),
  }),
  sourceRefs: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url().optional(),
        month: z.string().optional()
      })
    )
    .optional()
});

export type Question = z.infer<typeof questionSchema>;

// Exam schema
export const examSchema = z.object({
  name: z.string(),
  code: z.string(),
  durationSec: z.number().positive(),
  negativeMarking: z.number().min(0).max(1),
  uiTheme: z.enum(['ssc', 'banking']),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      questionCount: z.number().positive(),
      order: z.number().nonnegative(),
      hasSectionTimer: z.boolean()
    })
  ),
  rules: z.object({
    backNav: z.boolean(),
    optionShuffle: z.boolean()
  })
});

export type Exam = z.infer<typeof examSchema>;

// Attempt schema
export const attemptSchema = z.object({
  userId: z.string(),
  examId: z.string(),
  status: z.enum(['started', 'submitted']),
  startedAt: z.any(), // Firestore Timestamp
  submittedAt: z.any().optional(), // Firestore Timestamp
  timeLeftSec: z.number().nonnegative(),
  score: z
    .object({
      raw: z.number().optional(),
      percentile: z.number().optional()
    })
    .optional()
});

export type Attempt = z.infer<typeof attemptSchema>;

// Attempt Item schema
export const attemptItemSchema = z.object({
  selectedIdx: z.number().min(0).max(3).nullable(),
  timeSpentMs: z.number().nonnegative(),
  correctBool: z.boolean().optional()
});

export type AttemptItem = z.infer<typeof attemptItemSchema>;

// Leaderboard schema
export const leaderboardSchema = z.object({
  examId: z.string(),
  type: z.enum(['global', 'friends']),
  window: z.enum(['weekly', 'monthly']),
  entries: z.array(
    z.object({
      rank: z.number().positive(),
      userId: z.string(),
      displayName: z.string(),
      score: z.number()
    })
  ),
  updatedAt: z.any() // Firestore Timestamp
});

export type Leaderboard = z.infer<typeof leaderboardSchema>;

// Daily Quiz schema
export const dailyQuizSchema = z.object({
  examId: z.string(),
  questions: z.array(z.string()),
  publishedAt: z.any() // Firestore Timestamp
});

export type DailyQuiz = z.infer<typeof dailyQuizSchema>;

// Content schema
export const contentSchema = z.object({
  title: z.string(),
  examId: z.string(),
  subject: z.string(),
  topic: z.string(),
  storagePath: z.string(),
  visibility: z.enum(['free', 'pro']),
  createdBySystem: z.boolean()
});

export type Content = z.infer<typeof contentSchema>;