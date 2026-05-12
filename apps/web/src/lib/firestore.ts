import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  DocumentReference,
  CollectionReference,
  Timestamp,
  increment,
  serverTimestamp,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './models';

// Generic document typed helper
export function typedDoc<T>(collectionName: string, id: string) {
  return doc(db, collectionName, id) as DocumentReference<T>;
}

// Generic collection typed helper
export function typedCollection<T>(collectionName: string) {
  return collection(db, collectionName) as CollectionReference<T>;
}

// Get document with type
export async function getTypedDoc<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = typedDoc<T>(collectionName, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }
  return { ...snapshot.data(), id: snapshot.id } as T & { id: string };
}

// Update user profile with theme preference
export async function updateUserPrefs(userId: string, prefs: { theme?: string, language?: string, fontScale?: number }) {
  const userRef = doc(db, 'users', userId);
  return updateDoc(userRef, { prefs });
}

// Create or update user profile on login
export async function upsertUserProfile(userId: string, userData: { 
  displayName: string | null, 
  email: string | null,
  photoURL: string | null
}) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    // New user
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
      streak: 0,
      badges: [],
      prefs: { theme: 'system', language: 'en', fontScale: 1 },
    });
  } else {
    // Existing user, update info
    await updateDoc(userRef, {
      ...userData,
    });
  }
}

// Start a new attempt
export async function createAttempt(userId: string, examId: string) {
  const attemptsRef = collection(db, 'attempts');
  const attemptRef = doc(attemptsRef);
  
  await setDoc(attemptRef, {
    userId,
    examId,
    status: 'started',
    startedAt: Timestamp.now(),
    timeLeftSec: 3600, // Default 1 hour, will be updated with exam duration
  });
  
  return attemptRef.id;
}

// Save answer for a question
export async function saveAnswer(attemptId: string, questionId: string, answer: {
  selectedIdx: number | null,
  timeSpentMs: number,
  questionId: string,
}) {
  const attemptRef = doc(db, 'attempts', attemptId);
  const attemptDoc = await getDoc(attemptRef);
  
  if (!attemptDoc.exists()) {
    throw new Error('Attempt not found');
  }
  
  const currentAnswers = attemptDoc.data()?.answers || {};
  
  // Update the answers map
  await updateDoc(attemptRef, {
    [`answers.${questionId}`]: {
      selectedIdx: answer.selectedIdx,
      timeSpentMs: answer.timeSpentMs,
      answeredAt: Timestamp.now()
    }
  });
}

// Submit an attempt
export async function submitAttempt(attemptId: string, timeLeftSec: number, questions: any[]) {
  const attemptRef = doc(db, 'attempts', attemptId);
  
  // Calculate score
  let correctCount = 0;
  let attemptedCount = 0;
  
  questions.forEach(q => {
    if (q.selectedIdx !== null) {
      attemptedCount++;
      if (q.selectedIdx === q.correctIndex) {
        correctCount++;
      }
    }
  });
  
  const percentage = (correctCount / questions.length) * 100;
  const rawMarks = correctCount * 2; // 2 marks per correct answer

  await updateDoc(attemptRef, {
    status: 'completed',
    completedAt: Timestamp.now(),
    timeLeftSec,
    score: {
      raw: rawMarks,
      percentage: Math.round(percentage * 100) / 100
    },
    correctCount,
    attemptedCount,
    totalQuestions: questions.length,
    maxMarks: questions.length * 2,
  });
}

/**
 * Formats a Firestore timestamp for display
 * @param timestamp Firestore timestamp
 * @param options Date formatting options
 * @returns Formatted date string
 */
export function formatTimestamp(
  timestamp: Timestamp | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }
): string {
  if (!timestamp) return 'N/A';
  
  const date = timestamp instanceof Date ? timestamp : timestamp?.toDate();
  if (!date) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// ============================================
// USER STATS FUNCTIONS
// ============================================

export interface UserStats {
  userId: string;
  testsCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalTimeSpentSec: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD format
  lastActivityTimestamp: Timestamp;
  accuracy: number; // Calculated field: (correctAnswers / questionsAnswered) * 100
  avgTimePerQuestionSec: number; // Calculated field
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Recent scores for trend analysis
  recentScores: {
    date: Timestamp;
    score: number;
    testId: string;
  }[];
}

/**
 * Initialize user stats document for a new user
 */
export async function initializeUserStats(userId: string): Promise<void> {
  const statsRef = doc(db, 'userStats', userId);
  const statsDoc = await getDoc(statsRef);
  
  if (!statsDoc.exists()) {
    const now = Timestamp.now();
    const today = new Date().toISOString().split('T')[0];
    
    await setDoc(statsRef, {
      userId,
      testsCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedQuestions: 0,
      totalTimeSpentSec: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: today,
      lastActivityTimestamp: now,
      accuracy: 0,
      avgTimePerQuestionSec: 0,
      createdAt: now,
      updatedAt: now,
      recentScores: []
    });
  }
}

/**
 * Get user stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const statsRef = doc(db, 'userStats', userId);
  const statsDoc = await getDoc(statsRef);
  
  if (!statsDoc.exists()) {
    // Initialize if doesn't exist
    await initializeUserStats(userId);
    return getUserStats(userId); // Recursive call to get newly created stats
  }
  
  return { id: statsDoc.id, ...statsDoc.data() } as UserStats;
}

/**
 * Calculate and update streak based on activity
 */
export function calculateStreak(lastActivityDate: string, currentStreak: number): { newStreak: number; maintainedStreak: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (lastActivityDate === today) {
    // Same day activity, maintain streak
    return { newStreak: currentStreak, maintainedStreak: true };
  } else if (lastActivityDate === yesterday) {
    // Consecutive day activity, increment streak
    return { newStreak: currentStreak + 1, maintainedStreak: true };
  } else {
    // Streak broken, reset to 1
    return { newStreak: 1, maintainedStreak: false };
  }
}

/**
 * Update user stats after completing a test
 */
export async function updateUserStatsAfterTest(
  userId: string,
  testData: {
    testId: string;
    questionsAnswered: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    timeSpentSec: number;
    score: number;
  }
): Promise<{ newAchievements: Achievement[]; streakMilestone: boolean }> {
  const statsRef = doc(db, 'userStats', userId);
  const statsDoc = await getDoc(statsRef);
  
  if (!statsDoc.exists()) {
    await initializeUserStats(userId);
  }
  
  const currentStats = statsDoc.exists() ? statsDoc.data() as UserStats : null;
  const today = new Date().toISOString().split('T')[0];
  const { newStreak, maintainedStreak } = currentStats
    ? calculateStreak(currentStats.lastActivityDate, currentStats.currentStreak)
    : { newStreak: 1, maintainedStreak: false };

  const newQuestionsAnswered = (currentStats?.questionsAnswered || 0) + Math.max(0, testData.questionsAnswered);
  const newCorrectAnswers = (currentStats?.correctAnswers || 0) + Math.max(0, testData.correctAnswers);
  const newTotalTimeSpent = (currentStats?.totalTimeSpentSec || 0) + Math.max(0, testData.timeSpentSec);

  const accuracy = newQuestionsAnswered > 0 ? (newCorrectAnswers / newQuestionsAnswered) * 100 : 0;
  const avgTimePerQuestionSec = newQuestionsAnswered > 0 ? newTotalTimeSpent / newQuestionsAnswered : 0;

  const updatedRecentScores = [
    ...(currentStats?.recentScores || []),
    {
      date: Timestamp.now(),
      score: testData.score,
      testId: testData.testId,
    }
  ].slice(-10);
  
  // Update the document
  await updateDoc(statsRef, {
    testsCompleted: increment(1),
    questionsAnswered: increment(testData.questionsAnswered),
    correctAnswers: increment(testData.correctAnswers),
    incorrectAnswers: increment(testData.incorrectAnswers),
    skippedQuestions: increment(testData.skippedQuestions),
    totalTimeSpentSec: increment(testData.timeSpentSec),
    currentStreak: newStreak,
    longestStreak: Math.max(currentStats?.longestStreak || 0, newStreak),
    lastActivityDate: today,
    lastActivityTimestamp: Timestamp.now(),
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
    avgTimePerQuestionSec: Math.round(avgTimePerQuestionSec * 100) / 100,
    updatedAt: serverTimestamp(),
    recentScores: updatedRecentScores
  });
  
  // Get updated stats for achievement checking
  const updatedStatsDoc = await getDoc(statsRef);
  const updatedStats = updatedStatsDoc.data() as UserStats;
  
  // Check for new achievements
  const newAchievements = await checkAndAwardAchievements(userId, updatedStats, testData.score);
  
  // Notify user of new achievements
  for (const achievement of newAchievements) {
    await notifyAchievement(userId, achievement);
  }
  
  // Check for streak milestone
  const streakMilestone = [3, 7, 14, 30, 50, 100].includes(newStreak);
  if (streakMilestone) {
    await notifyStreakMilestone(userId, newStreak);
  }
  
  return { newAchievements, streakMilestone };
}

/**
 * Get formatted time spent (converts seconds to readable format)
 */
export function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Update user activity timestamp (for tracking daily activity without test completion)
 */
export async function updateUserActivity(userId: string): Promise<void> {
  const statsRef = doc(db, 'userStats', userId);
  const statsDoc = await getDoc(statsRef);
  
  if (!statsDoc.exists()) {
    await initializeUserStats(userId);
    return;
  }
  
  const currentStats = statsDoc.data() as UserStats;
  const today = new Date().toISOString().split('T')[0];
  
  // Only update if it's a new day
  if (currentStats.lastActivityDate !== today) {
    const { newStreak } = calculateStreak(currentStats.lastActivityDate, currentStats.currentStreak);
    
    await updateDoc(statsRef, {
      currentStreak: newStreak,
      longestStreak: Math.max(currentStats.longestStreak, newStreak),
      lastActivityDate: today,
      lastActivityTimestamp: Timestamp.now(),
      updatedAt: serverTimestamp()
    });
  }
}

// ============================================
// ATTEMPTS FUNCTIONS
// ============================================

export interface AttemptData {
  id?: string;
  userId: string;
  examId: string;
  examTitle: string;
  maxMarks?: number;
  testType?: 'quick-quiz' | 'quick-practice' | 'sectional-mock' | 'full-mock' | 'topic-wise-mock';
  status: 'completed' | 'abandoned';
  startedAt: Timestamp;
  submittedAt: Timestamp;
  timeSpentSec: number;
  score: {
    raw: number;
    percentage: number;
    percentile?: number;
  };
  questionStats: {
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
  };
  questionSnapshots?: Array<{
    id: string;
    section?: string;
    subject?: string;
    topic?: string;
    stem?: string;
    questionText?: string;
    options?: string[];
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctIndex?: number;
    correctOption?: string;
    explanation?: string;
  }>;
  answers?: Array<{
    questionId: string;
    selectedIdx: number | null;
    selectedOption?: string | null;
    timeSpentMs?: number;
  }> | Record<string, {
    selectedIdx?: number | null;
    selectedOption?: string | null;
    timeSpentMs?: number;
  }>;
}

/**
 * Save a completed test attempt to Firestore
 */
export async function saveTestAttempt(attemptData: Omit<AttemptData, 'id'>): Promise<string> {
  const attemptsRef = collection(db, 'attempts');
  const attemptDoc = doc(attemptsRef);
  
  const maxMarks = attemptData.maxMarks ?? (attemptData.questionStats?.total ? attemptData.questionStats.total * 2 : undefined);

  await setDoc(attemptDoc, {
    ...attemptData,
    maxMarks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return attemptDoc.id;
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  rank: number;
  totalScore: number; // Calculated score based on algorithm
  testsCompleted: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  badges: {
    id: string;
    name: string;
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
  }[];
  lastActive: Timestamp;
  updatedAt: Timestamp;
}

export interface LeaderboardScores {
  testScore: number; // Raw test score component (60%)
  accuracyScore: number; // Accuracy component (25%)
  consistencyScore: number; // Streak/consistency component (15%)
  totalScore: number; // Final weighted score
}

/**
 * Calculate leaderboard score based on user stats
 * Formula: (Test Score * 0.6) + (Accuracy * 0.25) + (Consistency * 0.15)
 */
export function calculateLeaderboardScore(stats: UserStats): LeaderboardScores {
  // 1. Test Score Component (60%) - based on recent scores average
  const recentScoresAvg = stats.recentScores.length > 0
    ? stats.recentScores.reduce((sum, s) => sum + s.score, 0) / stats.recentScores.length
    : 0;
  const testScore = recentScoresAvg * 0.6;
  
  // 2. Accuracy Component (25%) - direct accuracy percentage
  const accuracyScore = stats.accuracy * 0.25;
  
  // 3. Consistency Component (15%) - based on streak
  // Max streak considered is 30 days for scoring (100% consistency)
  const streakPercentage = Math.min((stats.currentStreak / 30) * 100, 100);
  const consistencyScore = streakPercentage * 0.15;
  
  // Total Score
  const totalScore = Math.round((testScore + accuracyScore + consistencyScore) * 100) / 100;
  
  return {
    testScore: Math.round(testScore * 100) / 100,
    accuracyScore: Math.round(accuracyScore * 100) / 100,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    totalScore,
  };
}

/**
 * Update user's leaderboard entry
 */
export async function updateLeaderboardEntry(
  userId: string,
  userProfile: { displayName: string; photoURL?: string },
  stats: UserStats
): Promise<void> {
  const scores = calculateLeaderboardScore(stats);
  
  // Determine badge level based on total score
  const getBadgeLevel = (score: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    if (score >= 90) return 'platinum';
    if (score >= 75) return 'gold';
    if (score >= 60) return 'silver';
    return 'bronze';
  };
  
  const badgeLevel = getBadgeLevel(scores.totalScore);
  
  const leaderboardData: Omit<LeaderboardEntry, 'rank'> = {
    userId,
    displayName: userProfile.displayName,
    photoURL: userProfile.photoURL,
    totalScore: scores.totalScore,
    testsCompleted: stats.testsCompleted,
    accuracy: Math.round(stats.accuracy),
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    badges: [{
      id: `${badgeLevel}_badge`,
      name: `${badgeLevel.charAt(0).toUpperCase() + badgeLevel.slice(1)} Expert`,
      level: badgeLevel,
    }],
    lastActive: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Update global leaderboard
  const globalRef = doc(db, 'leaderboard_global', userId);
  await setDoc(globalRef, leaderboardData, { merge: true });
  
  // Update weekly leaderboard (with current week identifier)
  const weekId = getWeekIdentifier();
  const weeklyRef = doc(db, 'leaderboard_weekly', `${weekId}_${userId}`);
  await setDoc(weeklyRef, { ...leaderboardData, weekId }, { merge: true });
  
  // Update monthly leaderboard (with current month identifier)
  const monthId = getMonthIdentifier();
  const monthlyRef = doc(db, 'leaderboard_monthly', `${monthId}_${userId}`);
  await setDoc(monthlyRef, { ...leaderboardData, monthId }, { merge: true });
}

/**
 * Get week identifier (YYYY-WW format)
 */
function getWeekIdentifier(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get month identifier (YYYY-MM format)
 */
function getMonthIdentifier(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Get leaderboard entries (global, weekly, or monthly)
 */
export async function getLeaderboardEntries(
  type: 'global' | 'weekly' | 'monthly' = 'global',
  limitCount: number = 100
): Promise<LeaderboardEntry[]> {
  let collectionName = 'leaderboard_global';
  let additionalFilters: any[] = [];
  
  if (type === 'weekly') {
    collectionName = 'leaderboard_weekly';
    const weekId = getWeekIdentifier();
    additionalFilters.push(where('weekId', '==', weekId));
  } else if (type === 'monthly') {
    collectionName = 'leaderboard_monthly';
    const monthId = getMonthIdentifier();
    additionalFilters.push(where('monthId', '==', monthId));
  }
  
  const q = query(
    collection(db, collectionName),
    ...additionalFilters,
    orderBy('totalScore', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  // Add rank to each entry based on order
  const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
    ...doc.data() as Omit<LeaderboardEntry, 'rank'>,
    rank: index + 1,
  }));
  
  return entries;
}

/**
 * Recalculate all ranks in the leaderboard
 * This should be called after any score update to ensure ranks are accurate
 */
export async function recalculateLeaderboardRanks(
  type: 'global' | 'weekly' | 'monthly' = 'global'
): Promise<void> {
  const collectionName =
    type === 'global'
      ? 'leaderboard_global'
      : type === 'weekly'
      ? 'leaderboard_weekly'
      : 'leaderboard_monthly';

  // Get all entries sorted by totalScore descending
  const q = query(collection(db, collectionName), orderBy('totalScore', 'desc'));
  const snapshot = await getDocs(q);

  // Use batch write for efficiency
  const batch = writeBatch(db);
  
  snapshot.docs.forEach((document, index) => {
    const newRank = index + 1;
    const docRef = doc(db, collectionName, document.id);
    batch.update(docRef, { rank: newRank });
  });

  await batch.commit();
}

/**
 * Get user's rank from leaderboard
 */
export async function getUserRank(
  userId: string,
  type: 'global' | 'weekly' | 'monthly' = 'global'
): Promise<{ rank: number; totalUsers: number; entry: LeaderboardEntry | null }> {
  let collectionName = 'leaderboard_global';
  
  if (type === 'weekly') {
    collectionName = 'leaderboard_weekly';
  } else if (type === 'monthly') {
    collectionName = 'leaderboard_monthly';
  }
  
  // Get user's entry
  let userDocId = userId;
  if (type === 'weekly') {
    userDocId = `${getWeekIdentifier()}_${userId}`;
  } else if (type === 'monthly') {
    userDocId = `${getMonthIdentifier()}_${userId}`;
  }
  
  const userDocRef = doc(db, collectionName, userDocId);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    return { rank: -1, totalUsers: 0, entry: null };
  }
  
  const userData = userDoc.data() as Omit<LeaderboardEntry, 'rank'>;
  
  // Count users with higher scores
  const q = query(
    collection(db, collectionName),
    where('totalScore', '>', userData.totalScore)
  );
  
  const snapshot = await getDocs(q);
  const rank = snapshot.size + 1;
  
  // Get total users count
  const totalQuery = query(collection(db, collectionName));
  const totalSnapshot = await getDocs(totalQuery);
  const totalUsers = totalSnapshot.size;
  
  return {
    rank,
    totalUsers,
    entry: { ...userData, rank } as LeaderboardEntry,
  };
}

// ============================================
// ACHIEVEMENT & BADGE SYSTEM
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'tests' | 'accuracy' | 'streak' | 'speed' | 'special';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  points: number;
  requirement: {
    type: 'tests_completed' | 'accuracy_reached' | 'streak_days' | 'questions_answered' | 'perfect_score';
    value: number;
  };
  earnedAt?: Timestamp;
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  totalPoints: number;
  lastUpdated: Timestamp;
}

/**
 * Define all available achievements
 */
const ACHIEVEMENTS: Omit<Achievement, 'earnedAt'>[] = [
  // Test completion achievements
  {
    id: 'first_test',
    name: 'Getting Started',
    description: 'Complete your first test',
    category: 'tests',
    level: 'bronze',
    icon: '🎯',
    points: 10,
    requirement: { type: 'tests_completed', value: 1 }
  },
  {
    id: 'test_warrior_10',
    name: 'Test Warrior',
    description: 'Complete 10 tests',
    category: 'tests',
    level: 'silver',
    icon: '⚔️',
    points: 25,
    requirement: { type: 'tests_completed', value: 10 }
  },
  {
    id: 'test_master_25',
    name: 'Test Master',
    description: 'Complete 25 tests',
    category: 'tests',
    level: 'gold',
    icon: '🏆',
    points: 50,
    requirement: { type: 'tests_completed', value: 25 }
  },
  {
    id: 'test_legend_50',
    name: 'Test Legend',
    description: 'Complete 50 tests',
    category: 'tests',
    level: 'platinum',
    icon: '👑',
    points: 100,
    requirement: { type: 'tests_completed', value: 50 }
  },
  
  // Accuracy achievements
  {
    id: 'accuracy_70',
    name: 'Sharp Shooter',
    description: 'Achieve 70% accuracy',
    category: 'accuracy',
    level: 'bronze',
    icon: '🎯',
    points: 15,
    requirement: { type: 'accuracy_reached', value: 70 }
  },
  {
    id: 'accuracy_80',
    name: 'Precision Expert',
    description: 'Achieve 80% accuracy',
    category: 'accuracy',
    level: 'silver',
    icon: '🎪',
    points: 30,
    requirement: { type: 'accuracy_reached', value: 80 }
  },
  {
    id: 'accuracy_90',
    name: 'Accuracy Master',
    description: 'Achieve 90% accuracy',
    category: 'accuracy',
    level: 'gold',
    icon: '💎',
    points: 60,
    requirement: { type: 'accuracy_reached', value: 90 }
  },
  {
    id: 'perfect_score',
    name: 'Perfectionist',
    description: 'Score 100% on a test',
    category: 'accuracy',
    level: 'platinum',
    icon: '⭐',
    points: 150,
    requirement: { type: 'perfect_score', value: 100 }
  },
  
  // Streak achievements
  {
    id: 'streak_3',
    name: 'Consistent Learner',
    description: 'Maintain a 3-day streak',
    category: 'streak',
    level: 'bronze',
    icon: '🔥',
    points: 20,
    requirement: { type: 'streak_days', value: 3 }
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    level: 'silver',
    icon: '📅',
    points: 40,
    requirement: { type: 'streak_days', value: 7 }
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    category: 'streak',
    level: 'gold',
    icon: '🌟',
    points: 80,
    requirement: { type: 'streak_days', value: 30 }
  },
  {
    id: 'streak_100',
    name: 'Unstoppable',
    description: 'Maintain a 100-day streak',
    category: 'streak',
    level: 'platinum',
    icon: '🚀',
    points: 200,
    requirement: { type: 'streak_days', value: 100 }
  },
  
  // Question milestones
  {
    id: 'questions_100',
    name: 'Century Club',
    description: 'Answer 100 questions',
    category: 'tests',
    level: 'bronze',
    icon: '💯',
    points: 15,
    requirement: { type: 'questions_answered', value: 100 }
  },
  {
    id: 'questions_500',
    name: 'Knowledge Seeker',
    description: 'Answer 500 questions',
    category: 'tests',
    level: 'silver',
    icon: '📚',
    points: 35,
    requirement: { type: 'questions_answered', value: 500 }
  },
  {
    id: 'questions_1000',
    name: 'Question Master',
    description: 'Answer 1000 questions',
    category: 'tests',
    level: 'gold',
    icon: '🎓',
    points: 75,
    requirement: { type: 'questions_answered', value: 1000 }
  },
];

/**
 * Check and award new achievements to user
 */
export async function checkAndAwardAchievements(
  userId: string,
  stats: UserStats,
  latestTestScore?: number
): Promise<Achievement[]> {
  // Get user's current achievements
  const achievementsRef = doc(db, 'userAchievements', userId);
  const achievementsDoc = await getDoc(achievementsRef);
  
  const currentAchievements = achievementsDoc.exists()
    ? (achievementsDoc.data() as UserAchievements).achievements
    : [];
  
  const earnedAchievementIds = new Set(currentAchievements.map(a => a.id));
  const newAchievements: Achievement[] = [];
  
  // Check each achievement
  for (const achievement of ACHIEVEMENTS) {
    // Skip if already earned
    if (earnedAchievementIds.has(achievement.id)) continue;
    
    let earned = false;
    
    switch (achievement.requirement.type) {
      case 'tests_completed':
        earned = stats.testsCompleted >= achievement.requirement.value;
        break;
      case 'accuracy_reached':
        earned = stats.accuracy >= achievement.requirement.value;
        break;
      case 'streak_days':
        earned = stats.currentStreak >= achievement.requirement.value;
        break;
      case 'questions_answered':
        earned = stats.questionsAnswered >= achievement.requirement.value;
        break;
      case 'perfect_score':
        earned = latestTestScore === 100;
        break;
    }
    
    if (earned) {
      const newAchievement: Achievement = {
        ...achievement,
        earnedAt: Timestamp.now(),
      };
      newAchievements.push(newAchievement);
    }
  }
  
  // Save new achievements
  if (newAchievements.length > 0) {
    const updatedAchievements = [...currentAchievements, ...newAchievements];
    const totalPoints = updatedAchievements.reduce((sum, a) => {
      const points = { bronze: 10, silver: 25, gold: 50, platinum: 100 };
      return sum + points[a.level];
    }, 0);
    
    await setDoc(achievementsRef, {
      userId,
      achievements: updatedAchievements,
      totalPoints,
      lastUpdated: serverTimestamp(),
    });
  }
  
  return newAchievements;
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievements | null> {
  const achievementsRef = doc(db, 'userAchievements', userId);
  const achievementsDoc = await getDoc(achievementsRef);
  
  if (!achievementsDoc.exists()) {
    return {
      userId,
      achievements: [],
      totalPoints: 0,
      lastUpdated: Timestamp.now(),
    };
  }
  
  return achievementsDoc.data() as UserAchievements;
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

export interface Notification {
  id?: string;
  userId: string;
  type: 'achievement' | 'streak' | 'rank' | 'milestone' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  data?: {
    achievementId?: string;
    icon?: string;
    link?: string;
  };
}

/**
 * Create a notification for user
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
  const notificationsRef = collection(db, 'notifications');
  const notificationDoc = doc(notificationsRef);
  
  await setDoc(notificationDoc, {
    ...notification,
    createdAt: serverTimestamp(),
  });
  
  return notificationDoc.id;
}

/**
 * Create achievement notification
 */
export async function notifyAchievement(userId: string, achievement: Achievement): Promise<void> {
  await createNotification({
    userId,
    type: 'achievement',
    title: `🎉 Achievement Unlocked!`,
    message: `You've earned "${achievement.name}": ${achievement.description}`,
    read: false,
    data: {
      achievementId: achievement.id,
      icon: achievement.icon,
      link: '/profile',
    },
  });
}

/**
 * Create streak milestone notification
 */
export async function notifyStreakMilestone(userId: string, streakDays: number): Promise<void> {
  const milestones = [3, 7, 14, 30, 50, 100];
  
  if (milestones.includes(streakDays)) {
    await createNotification({
      userId,
      type: 'streak',
      title: `🔥 ${streakDays}-Day Streak!`,
      message: `Amazing! You've maintained a ${streakDays}-day learning streak. Keep it up!`,
      read: false,
      data: {
        icon: '🔥',
        link: '/dashboard',
      },
    });
  }
}

/**
 * Create rank improvement notification
 */
export async function notifyRankImprovement(userId: string, oldRank: number, newRank: number): Promise<void> {
  const improvement = oldRank - newRank;
  
  if (improvement >= 10) {
    await createNotification({
      userId,
      type: 'rank',
      title: `📈 Rank Improvement!`,
      message: `Congratulations! You've climbed ${improvement} positions to rank #${newRank}`,
      read: false,
      data: {
        icon: '🏆',
        link: '/leaderboard',
      },
    });
  }
}