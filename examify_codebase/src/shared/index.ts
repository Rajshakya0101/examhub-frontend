/**
 * This file re-exports all schema types from the schema.ts file
 * for use in other parts of the application. It makes it easier
 * to import types without having to remember where they're defined.
 */

export {
  userSchema,
  questionSchema,
  examSchema,
  attemptSchema,
  attemptItemSchema,
  leaderboardSchema,
  dailyQuizSchema,
  contentSchema,
} from './schema';

export type {
  User,
  Question,
  Exam,
  Attempt,
  AttemptItem,
  Leaderboard,
  DailyQuiz,
  Content,
} from './schema';