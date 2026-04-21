import { z } from 'zod';

// Basic user information validation schema
export const userSchema = z.object({
  displayName: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  photoURL: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .nullable(),
});

// User preferences schema
export const preferencesSchema = z.object({
  theme: z
    .enum(['light', 'dark', 'system'])
    .default('system'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
  }),
});

// Question creation schema
export const questionSchema = z.object({
  stem: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be less than 1000 characters'),
  options: z
    .array(z.string().min(1))
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed'),
  correctIndex: z
    .number()
    .min(0, 'Please select a correct answer'),
  explanation: z
    .string()
    .optional(),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium'),
  tags: z
    .array(z.string())
    .optional(),
  category: z
    .string()
    .min(1, 'Category is required'),
  subcategory: z
    .string()
    .optional(),
});

// Exam creation schema
export const examSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  instructions: z
    .string()
    .max(1000, 'Instructions must be less than 1000 characters')
    .optional(),
  durationMinutes: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(180, 'Duration must be less than 180 minutes'),
  totalQuestions: z
    .number()
    .min(1, 'Exam must have at least 1 question')
    .max(200, 'Exam must have less than 200 questions'),
  passingScore: z
    .number()
    .min(0, 'Passing score must be at least 0%')
    .max(100, 'Passing score must be less than 100%')
    .optional(),
  isPublic: z
    .boolean()
    .default(false),
  category: z
    .string()
    .min(1, 'Category is required'),
  subcategory: z
    .string()
    .optional(),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium'),
  sections: z
    .array(
      z.object({
        title: z
          .string()
          .min(1, 'Section title is required'),
        description: z
          .string()
          .optional(),
        questionCount: z
          .number()
          .min(1, 'Section must have at least 1 question'),
        category: z
          .string()
          .min(1, 'Category is required'),
        negativeMarking: z
          .number()
          .min(0, 'Negative marking must be at least 0')
          .max(1, 'Negative marking must be less than 1')
          .optional(),
      })
    )
    .min(1, 'Exam must have at least 1 section'),
});

// AI question generation request schema
export const aiGenerationSchema = z.object({
  topic: z
    .string()
    .min(3, 'Topic must be at least 3 characters')
    .max(100, 'Topic must be less than 100 characters'),
  count: z
    .number()
    .min(1, 'Must generate at least 1 question')
    .max(20, 'Cannot generate more than 20 questions at once'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
    .optional(),
  examType: z
    .string()
    .optional(),
});

// Search filters schema
export const searchFiltersSchema = z.object({
  query: z
    .string()
    .optional(),
  categories: z
    .array(z.string())
    .optional(),
  difficulties: z
    .array(z.enum(['easy', 'medium', 'hard']))
    .optional(),
  page: z
    .number()
    .min(1)
    .default(1),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(20),
  sortBy: z
    .enum(['createdAt', 'title', 'difficulty', 'popularity'])
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

// Type inference helpers
export type UserFormData = z.infer<typeof userSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type ExamFormData = z.infer<typeof examSchema>;
export type AIGenerationFormData = z.infer<typeof aiGenerationSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;