import { User } from 'firebase/auth';
import { Timestamp, DocumentReference } from 'firebase/firestore';

// Base user profile data
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  location?: string;
  education?: string;
  profileComplete?: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email: boolean;
      push: boolean;
    };
  };
  stats?: {
    testsCompleted: number;
    questionsAnswered: number;
    correctAnswers: number;
    streak: number;
    lastActivity?: Timestamp;
  };
}

// Extended user with activity and scores
export interface ExtendedUserProfile extends UserProfile {
  recentActivity?: ActivityItem[];
  badges?: Badge[];
  rank?: number;
  percentile?: number;
}

// User's activity item
export interface ActivityItem {
  id: string;
  type: 'exam' | 'practice' | 'daily_quiz';
  timestamp: Timestamp;
  details: {
    name?: string;
    score?: number;
    maxScore?: number;
    percentile?: number;
    questionsAnswered?: number;
  };
}

// Badge definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  earnedAt: Timestamp;
  category: 'achievement' | 'milestone' | 'special';
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// Question model for all question types
export interface Question {
  id: string;
  stem: string; // The question text
  options: string[]; // Multiple choice options
  correctIndex: number; // Index of correct answer (0-based)
  explanation?: string; // Explanation of the answer
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[]; // For categorization
  category: string; // Main category
  subcategory?: string; // Subcategory
  createdBy: 'human' | 'ai'; // Source of the question
  createdAt: Timestamp;
  aiGenerationPrompt?: string; // If AI-generated, the prompt used
  stats?: {
    timesShown: number;
    timesAnswered: number;
    timesAnsweredCorrectly: number;
    avgTimeSpentSec: number;
  };
}

// Exam definition
export interface Exam {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore?: number;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // User ID or 'system'
  category: string; // e.g., 'SSC', 'Banking'
  subcategory?: string; // e.g., 'CGL', 'CHSL'
  difficulty: 'easy' | 'medium' | 'hard';
  sections: ExamSection[];
  questionRefs?: DocumentReference[]; // References to questions
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  featuredOrder?: number; // For featured exams sorting
}

// Exam section
export interface ExamSection {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  category: string; // e.g., 'Reasoning', 'English'
  questions?: string[]; // Question IDs
  negativeMarking?: number; // Negative marking factor, e.g., 0.25 for 1/4th
}

// User's exam attempt
export interface Attempt {
  id: string;
  userId: string;
  examId: string;
  status: 'started' | 'paused' | 'submitted' | 'timed_out';
  startedAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  timeLeftSec: number; // Time left in seconds when paused
  currentSection?: string; // Current section ID
  currentQuestionIndex?: number;
  score?: {
    raw: number; // Raw score
    percentage: number; // Percentage score
    percentile?: number; // Percentile among other test takers
    passFail?: 'pass' | 'fail'; // Pass/fail status
  };
  questionStats?: {
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
  };
  sectionScores?: Record<string, {
    raw: number;
    total: number;
    attempted: number;
  }>;
}

// Question attempt by user
export interface QuestionAttempt {
  id: string; // Usually the question ID
  attemptId: string; // Reference to parent attempt
  userId: string;
  selectedIdx: number | null; // Selected answer index, null if skipped
  timeSpentMs: number; // Time spent on this question
  visited: boolean; // Whether the user visited this question
  markedForReview: boolean; // Whether marked for review
  correctBool?: boolean; // Whether answer was correct
}

// Leaderboard entry
export interface LeaderboardEntry {
  id: string; // User ID
  displayName: string;
  photoURL?: string;
  rank: number;
  score: number;
  testsCompleted: number;
  accuracy: number;
  streak: number;
  badges?: {
    id: string;
    name: string;
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
  }[];
  lastActive: Timestamp;
}

// Performance analytics
export interface PerformanceAnalytics {
  userId: string;
  overallScore: number;
  accuracy: number;
  totalAttempts: number;
  totalTimeSec: number;
  avgTimePerQuestionSec: number;
  byCategory: Record<string, CategoryPerformance>;
  byDifficulty: Record<'easy' | 'medium' | 'hard', DifficultyPerformance>;
  recentScores: {
    date: Timestamp;
    examId: string;
    score: number;
  }[];
  strengths: string[]; // Categories/topics the user is strong in
  weaknesses: string[]; // Categories/topics the user is weak in
  recommendations: {
    category: string;
    topic: string;
    reason: string;
  }[];
}

// Category performance
interface CategoryPerformance {
  score: number;
  accuracy: number;
  attempts: number;
  avgTimeSec: number;
}

// Performance by difficulty level
interface DifficultyPerformance {
  score: number;
  accuracy: number;
  attempts: number;
  avgTimeSec: number;
}

// Daily quiz
export interface DailyQuiz {
  id: string;
  date: string; // YYYY-MM-DD
  examId: string; // Reference to the exam
  featured: boolean;
  attemptCount: number; // How many users attempted
  avgScore?: number;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Timestamp;
  read: boolean;
  readAt?: Timestamp;
  link?: string; // Optional link to navigate to
  data?: Record<string, any>; // Additional data
}

// Helper function to convert Firebase user to UserProfile
export function userToProfile(user: User, additionalData: Partial<UserProfile> = {}): UserProfile {
  const now = new Timestamp(Math.floor(Date.now() / 1000), 0);
  
  return {
    uid: user.uid,
    displayName: user.displayName || 'User',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
    createdAt: additionalData.createdAt || now,
    lastLoginAt: now,
    preferences: additionalData.preferences || {
      theme: 'system',
      notifications: {
        email: true,
        push: true,
      },
    },
    stats: additionalData.stats || {
      testsCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      streak: 0,
    },
    ...additionalData,
  };
}