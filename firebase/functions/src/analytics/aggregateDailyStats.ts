import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

const db = getFirestore();

interface UserStats {
  userId: string;
  testsCompleted: number;
  totalCorrect: number;
  totalQuestions: number;
  totalTimeSpent: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  lastTestDate?: Timestamp;
}

interface TestAttempt {
  userId: string;
  examId: string;
  examTitle: string;
  status: 'completed' | 'in-progress' | 'abandoned';
  submittedAt?: Timestamp;
  timeSpentSec: number;
  score: {
    raw: number;
    percentage: number;
  };
  questionStats: {
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
  };
}

interface DailySummary {
  userId: string;
  date: string; // YYYY-MM-DD
  testsCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentMinutes: number;
  averageScore: number;
  topicsStudied: string[];
  bestScore: number;
  worstScore: number;
  createdAt: FieldValue;
}

interface WeeklySummary {
  userId: string;
  weekId: string; // YYYY-WW
  testsCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentMinutes: number;
  averageScore: number;
  improvementRate: number;
  activeDays: number;
  topicsStudied: string[];
  createdAt: FieldValue;
}

interface MonthlySummary {
  userId: string;
  monthId: string; // YYYY-MM
  testsCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentMinutes: number;
  averageScore: number;
  improvementRate: number;
  activeDays: number;
  topicsStudied: string[];
  rankChange: number;
  achievementsEarned: number;
  createdAt: FieldValue;
}

interface PersonalizedRecommendation {
  userId: string;
  recommendations: Array<{
    type: 'subject' | 'difficulty' | 'topic';
    title: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  weakAreas: string[];
  strongAreas: string[];
  suggestedFocusTime: number;
  generatedAt: FieldValue;
}

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get week identifier (YYYY-WW format)
 */
function getWeekId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get month identifier (YYYY-MM format)
 */
function getMonthId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get yesterday's date
 */
function getYesterdayDate(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * Calculate daily summary for a user
 */
async function calculateDailySummary(userId: string, date: Date): Promise<DailySummary | null> {
  const dateStr = getDateString(date);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Fetch all attempts for this user on this date
    const attemptsSnapshot = await db.collection('attempts')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .where('submittedAt', '>=', Timestamp.fromDate(startOfDay))
      .where('submittedAt', '<=', Timestamp.fromDate(endOfDay))
      .get();

    if (attemptsSnapshot.empty) {
      return null; // No activity on this day
    }

    let testsCompleted = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;
    let timeSpentSec = 0;
    let totalScore = 0;
    let bestScore = 0;
    let worstScore = 100;
    const topicsSet = new Set<string>();

    for (const doc of attemptsSnapshot.docs) {
      const attempt = doc.data() as TestAttempt;
      
      testsCompleted++;
      totalQuestions += attempt.questionStats.total;
      correctAnswers += attempt.questionStats.correct;
      timeSpentSec += attempt.timeSpentSec;
      totalScore += attempt.score.percentage;
      
      if (attempt.score.percentage > bestScore) {
        bestScore = attempt.score.percentage;
      }
      if (attempt.score.percentage < worstScore) {
        worstScore = attempt.score.percentage;
      }

      // Extract topic from exam title (simplified)
      if (attempt.examTitle) {
        topicsSet.add(attempt.examTitle);
      }
    }

    const averageScore = testsCompleted > 0 ? totalScore / testsCompleted : 0;
    const timeSpentMinutes = Math.round(timeSpentSec / 60);

    return {
      userId,
      date: dateStr,
      testsCompleted,
      totalQuestions,
      correctAnswers,
      timeSpentMinutes,
      averageScore: Math.round(averageScore * 100) / 100,
      topicsStudied: Array.from(topicsSet),
      bestScore: Math.round(bestScore * 100) / 100,
      worstScore: testsCompleted > 0 ? Math.round(worstScore * 100) / 100 : 0,
      createdAt: FieldValue.serverTimestamp(),
    };
  } catch (error) {
    logger.error(`Error calculating daily summary for user ${userId}:`, error);
    return null;
  }
}

/**
 * Calculate weekly summary for a user
 */
async function calculateWeeklySummary(userId: string, weekId: string): Promise<WeeklySummary | null> {
  try {
    // Fetch all daily summaries for this week
    const weekPattern = weekId.replace('-W', '-');
    const year = parseInt(weekPattern.split('-')[0]);
    const week = parseInt(weekPattern.split('-')[1]);
    
    // Calculate start and end dates for the week
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const weekStart = new Date(firstDayOfYear);
    weekStart.setDate(firstDayOfYear.getDate() + daysOffset);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startDateStr = getDateString(weekStart);
    const endDateStr = getDateString(weekEnd);

    // Fetch daily summaries for the week
    const dailySummariesSnapshot = await db.collection('dailySummaries')
      .where('userId', '==', userId)
      .where('date', '>=', startDateStr)
      .where('date', '<=', endDateStr)
      .get();

    if (dailySummariesSnapshot.empty) {
      return null;
    }

    let testsCompleted = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;
    let timeSpentMinutes = 0;
    let totalScore = 0;
    let activeDays = dailySummariesSnapshot.size;
    const topicsSet = new Set<string>();

    const scores: number[] = [];

    for (const doc of dailySummariesSnapshot.docs) {
      const summary = doc.data() as DailySummary;
      
      testsCompleted += summary.testsCompleted;
      totalQuestions += summary.totalQuestions;
      correctAnswers += summary.correctAnswers;
      timeSpentMinutes += summary.timeSpentMinutes;
      totalScore += summary.averageScore;
      scores.push(summary.averageScore);
      
      summary.topicsStudied.forEach(topic => topicsSet.add(topic));
    }

    const averageScore = activeDays > 0 ? totalScore / activeDays : 0;
    
    // Calculate improvement rate (last 3 days vs first 3 days)
    let improvementRate = 0;
    if (scores.length >= 6) {
      const firstHalfAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const secondHalfAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
      improvementRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    }

    return {
      userId,
      weekId,
      testsCompleted,
      totalQuestions,
      correctAnswers,
      timeSpentMinutes,
      averageScore: Math.round(averageScore * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      activeDay: activeDays,
      topicsStudied: Array.from(topicsSet),
      createdAt: FieldValue.serverTimestamp(),
    };
  } catch (error) {
    logger.error(`Error calculating weekly summary for user ${userId}:`, error);
    return null;
  }
}

/**
 * Calculate monthly summary for a user
 */
async function calculateMonthlySummary(userId: string, monthId: string): Promise<MonthlySummary | null> {
  try {
    const [year, month] = monthId.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Last day of month

    const startDateStr = getDateString(monthStart);
    const endDateStr = getDateString(monthEnd);

    // Fetch daily summaries for the month
    const dailySummariesSnapshot = await db.collection('dailySummaries')
      .where('userId', '==', userId)
      .where('date', '>=', startDateStr)
      .where('date', '<=', endDateStr)
      .get();

    if (dailySummariesSnapshot.empty) {
      return null;
    }

    let testsCompleted = 0;
    let totalQuestions = 0;
    let correctAnswers = 0;
    let timeSpentMinutes = 0;
    let totalScore = 0;
    let activeDays = dailySummariesSnapshot.size;
    const topicsSet = new Set<string>();
    const scores: number[] = [];

    for (const doc of dailySummariesSnapshot.docs) {
      const summary = doc.data() as DailySummary;
      
      testsCompleted += summary.testsCompleted;
      totalQuestions += summary.totalQuestions;
      correctAnswers += summary.correctAnswers;
      timeSpentMinutes += summary.timeSpentMinutes;
      totalScore += summary.averageScore;
      scores.push(summary.averageScore);
      
      summary.topicsStudied.forEach(topic => topicsSet.add(topic));
    }

    const averageScore = activeDays > 0 ? totalScore / activeDays : 0;
    
    // Calculate improvement rate (last week vs first week)
    let improvementRate = 0;
    if (scores.length >= 14) {
      const firstWeekAvg = scores.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
      const lastWeekAvg = scores.slice(-7).reduce((a, b) => a + b, 0) / 7;
      improvementRate = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
    }

    // Get rank change (compare with previous month)
    let rankChange = 0;
    const currentRankDoc = await db.collection('leaderboard_global').doc(userId).get();
    if (currentRankDoc.exists()) {
      const currentRank = currentRankDoc.data()?.rank || 0;
      
      // Try to get previous month's rank from archive
      const prevMonthId = getMonthId(new Date(year, month - 2, 1));
      const prevMonthSummaryDoc = await db.collection('monthlySummaries')
        .where('userId', '==', userId)
        .where('monthId', '==', prevMonthId)
        .limit(1)
        .get();
      
      if (!prevMonthSummaryDoc.empty) {
        const prevData = prevMonthSummaryDoc.docs[0].data() as MonthlySummary;
        // Rank change is positive if rank improved (lower number)
        rankChange = (prevData.rankChange || 0) - currentRank;
      }
    }

    // Count achievements earned this month
    const achievementsSnapshot = await db.collection('userAchievements').doc(userId).get();
    let achievementsEarned = 0;
    if (achievementsSnapshot.exists()) {
      const achievements = achievementsSnapshot.data()?.achievements || [];
      achievementsEarned = achievements.filter((ach: any) => {
        if (!ach.earnedAt) return false;
        const earnedDate = ach.earnedAt.toDate();
        return earnedDate >= monthStart && earnedDate <= monthEnd;
      }).length;
    }

    return {
      userId,
      monthId,
      testsCompleted,
      totalQuestions,
      correctAnswers,
      timeSpentMinutes,
      averageScore: Math.round(averageScore * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      activeDays,
      topicsStudied: Array.from(topicsSet),
      rankChange,
      achievementsEarned,
      createdAt: FieldValue.serverTimestamp(),
    };
  } catch (error) {
    logger.error(`Error calculating monthly summary for user ${userId}:`, error);
    return null;
  }
}

/**
 * Generate personalized recommendations for a user
 */
async function generatePersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation | null> {
  try {
    // Get user stats
    const statsDoc = await db.collection('userStats').doc(userId).get();
    if (!statsDoc.exists()) {
      return null;
    }

    const stats = statsDoc.data() as UserStats;
    const accuracy = stats.totalQuestions > 0 
      ? (stats.totalCorrect / stats.totalQuestions) * 100 
      : 0;

    // Get recent attempts to analyze weak areas
    const recentAttemptsSnapshot = await db.collection('attempts')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .orderBy('submittedAt', 'desc')
      .limit(10)
      .get();

    const recommendations: Array<{
      type: 'subject' | 'difficulty' | 'topic';
      title: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    // Analyze performance
    if (accuracy < 60) {
      recommendations.push({
        type: 'difficulty',
        title: 'Start with easier tests',
        reason: 'Your accuracy is below 60%. Building confidence with easier questions will help.',
        priority: 'high',
      });
    } else if (accuracy > 85) {
      recommendations.push({
        type: 'difficulty',
        title: 'Challenge yourself with harder tests',
        reason: 'Your accuracy is excellent! Try more challenging questions to push your limits.',
        priority: 'high',
      });
      strongAreas.push('Overall Performance');
    }

    // Check streak
    if (stats.currentStreak === 0) {
      recommendations.push({
        type: 'topic',
        title: 'Build a daily practice habit',
        reason: 'Start a streak! Daily practice leads to better retention and results.',
        priority: 'high',
      });
    } else if (stats.currentStreak >= 7) {
      strongAreas.push('Consistency');
    }

    // Check tests completed
    if (stats.testsCompleted < 5) {
      recommendations.push({
        type: 'topic',
        title: 'Take more practice tests',
        reason: 'More practice will help identify your strengths and weaknesses.',
        priority: 'medium',
      });
    }

    // Analyze time management
    const avgTimePerQuestion = stats.totalQuestions > 0 
      ? stats.totalTimeSpent / stats.totalQuestions 
      : 0;
    
    if (avgTimePerQuestion > 120) { // More than 2 minutes per question
      recommendations.push({
        type: 'topic',
        title: 'Focus on time management',
        reason: 'You\'re spending too much time per question. Practice timed tests to improve speed.',
        priority: 'medium',
      });
      weakAreas.push('Time Management');
    }

    // Analyze recent performance trends
    if (!recentAttemptsSnapshot.empty) {
      const scores = recentAttemptsSnapshot.docs.map(doc => {
        const attempt = doc.data() as TestAttempt;
        return attempt.score.percentage;
      });

      const recentAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const olderAvg = scores.length > 3 
        ? scores.slice(3).reduce((a, b) => a + b, 0) / (scores.length - 3)
        : recentAvg;

      if (recentAvg < olderAvg - 10) {
        recommendations.push({
          type: 'topic',
          title: 'Review fundamentals',
          reason: 'Your recent scores have dropped. Consider reviewing basic concepts.',
          priority: 'high',
        });
        weakAreas.push('Recent Performance');
      } else if (recentAvg > olderAvg + 10) {
        strongAreas.push('Improving Performance');
      }
    }

    // Suggested focus time (in minutes)
    let suggestedFocusTime = 30; // Default
    if (stats.testsCompleted < 10) {
      suggestedFocusTime = 45; // More practice needed
    } else if (accuracy > 80 && stats.currentStreak > 7) {
      suggestedFocusTime = 20; // Maintenance mode
    }

    return {
      userId,
      recommendations,
      weakAreas,
      strongAreas,
      suggestedFocusTime,
      generatedAt: FieldValue.serverTimestamp(),
    };
  } catch (error) {
    logger.error(`Error generating recommendations for user ${userId}:`, error);
    return null;
  }
}

/**
 * Clean up old data (attempts older than 6 months)
 */
async function cleanupOldData(): Promise<void> {
  logger.info('Starting old data cleanup...');

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Clean up old attempts (keep only 6 months)
    const oldAttemptsSnapshot = await db.collection('attempts')
      .where('submittedAt', '<', Timestamp.fromDate(sixMonthsAgo))
      .limit(500)
      .get();

    if (!oldAttemptsSnapshot.empty) {
      const batch = db.batch();
      let deleteCount = 0;

      for (const doc of oldAttemptsSnapshot.docs) {
        batch.delete(doc.ref);
        deleteCount++;
      }

      await batch.commit();
      logger.info(`Deleted ${deleteCount} old attempts`);
    }

    // Clean up old daily summaries (keep only 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = getDateString(threeMonthsAgo);

    const oldDailySummariesSnapshot = await db.collection('dailySummaries')
      .where('date', '<', threeMonthsAgoStr)
      .limit(500)
      .get();

    if (!oldDailySummariesSnapshot.empty) {
      const batch = db.batch();
      let deleteCount = 0;

      for (const doc of oldDailySummariesSnapshot.docs) {
        batch.delete(doc.ref);
        deleteCount++;
      }

      await batch.commit();
      logger.info(`Deleted ${deleteCount} old daily summaries`);
    }

    logger.info('Old data cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up old data:', error);
    throw error;
  }
}

/**
 * Main function to aggregate daily stats for all active users
 */
export async function aggregateDailyStats(): Promise<void> {
  logger.info('Starting daily stats aggregation...');

  try {
    const yesterday = getYesterdayDate();
    const yesterdayStr = getDateString(yesterday);

    // Get all users who had activity yesterday
    const startOfDay = new Date(yesterday);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    const activeUsersSnapshot = await db.collection('attempts')
      .where('status', '==', 'completed')
      .where('submittedAt', '>=', Timestamp.fromDate(startOfDay))
      .where('submittedAt', '<=', Timestamp.fromDate(endOfDay))
      .get();

    // Get unique user IDs
    const userIds = new Set<string>();
    activeUsersSnapshot.docs.forEach(doc => {
      const attempt = doc.data() as TestAttempt;
      userIds.add(attempt.userId);
    });

    logger.info(`Processing ${userIds.size} active users for ${yesterdayStr}`);

    // Calculate daily summaries
    const batch = db.batch();
    let processedCount = 0;

    for (const userId of userIds) {
      const dailySummary = await calculateDailySummary(userId, yesterday);
      
      if (dailySummary) {
        const summaryRef = db.collection('dailySummaries').doc(`${userId}_${yesterdayStr}`);
        batch.set(summaryRef, dailySummary);
        processedCount++;

        if (processedCount % 500 === 0) {
          await batch.commit();
          logger.info(`Processed ${processedCount} daily summaries`);
        }
      }
    }

    if (processedCount % 500 !== 0) {
      await batch.commit();
    }

    logger.info(`Daily stats aggregation complete. Processed ${processedCount} users.`);

    // Calculate weekly summaries (on Sundays)
    const dayOfWeek = yesterday.getDay();
    if (dayOfWeek === 0) { // Sunday
      await aggregateWeeklySummaries(yesterday);
    }

    // Calculate monthly summaries (on last day of month)
    const lastDayOfMonth = new Date(yesterday.getFullYear(), yesterday.getMonth() + 1, 0);
    if (yesterday.getDate() === lastDayOfMonth.getDate()) {
      await aggregateMonthlySummaries(yesterday);
    }

    // Generate personalized recommendations for active users
    await generateRecommendationsForActiveUsers(Array.from(userIds));

    // Clean up old data
    await cleanupOldData();

  } catch (error) {
    logger.error('Error in daily stats aggregation:', error);
    throw error;
  }
}

/**
 * Aggregate weekly summaries
 */
async function aggregateWeeklySummaries(date: Date): Promise<void> {
  logger.info('Starting weekly summaries aggregation...');

  const weekId = getWeekId(date);

  // Get all users who have daily summaries for this week
  const year = parseInt(weekId.split('-')[0]);
  const week = parseInt(weekId.split('W')[1]);
  
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7;
  const weekStart = new Date(firstDayOfYear);
  weekStart.setDate(firstDayOfYear.getDate() + daysOffset);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDateStr = getDateString(weekStart);
  const endDateStr = getDateString(weekEnd);

  const dailySummariesSnapshot = await db.collection('dailySummaries')
    .where('date', '>=', startDateStr)
    .where('date', '<=', endDateStr)
    .get();

  const userIds = new Set<string>();
  dailySummariesSnapshot.docs.forEach(doc => {
    const summary = doc.data() as DailySummary;
    userIds.add(summary.userId);
  });

  logger.info(`Processing ${userIds.size} users for weekly summary ${weekId}`);

  const batch = db.batch();
  let processedCount = 0;

  for (const userId of userIds) {
    const weeklySummary = await calculateWeeklySummary(userId, weekId);
    
    if (weeklySummary) {
      const summaryRef = db.collection('weeklySummaries').doc(`${userId}_${weekId}`);
      batch.set(summaryRef, weeklySummary);
      processedCount++;

      if (processedCount % 500 === 0) {
        await batch.commit();
        logger.info(`Processed ${processedCount} weekly summaries`);
      }
    }
  }

  if (processedCount % 500 !== 0) {
    await batch.commit();
  }

  logger.info(`Weekly summaries aggregation complete. Processed ${processedCount} users.`);
}

/**
 * Aggregate monthly summaries
 */
async function aggregateMonthlySummaries(date: Date): Promise<void> {
  logger.info('Starting monthly summaries aggregation...');

  const monthId = getMonthId(date);
  const [year, month] = monthId.split('-').map(Number);
  
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const startDateStr = getDateString(monthStart);
  const endDateStr = getDateString(monthEnd);

  const dailySummariesSnapshot = await db.collection('dailySummaries')
    .where('date', '>=', startDateStr)
    .where('date', '<=', endDateStr)
    .get();

  const userIds = new Set<string>();
  dailySummariesSnapshot.docs.forEach(doc => {
    const summary = doc.data() as DailySummary;
    userIds.add(summary.userId);
  });

  logger.info(`Processing ${userIds.size} users for monthly summary ${monthId}`);

  const batch = db.batch();
  let processedCount = 0;

  for (const userId of userIds) {
    const monthlySummary = await calculateMonthlySummary(userId, monthId);
    
    if (monthlySummary) {
      const summaryRef = db.collection('monthlySummaries').doc(`${userId}_${monthId}`);
      batch.set(summaryRef, monthlySummary);
      processedCount++;

      if (processedCount % 500 === 0) {
        await batch.commit();
        logger.info(`Processed ${processedCount} monthly summaries`);
      }
    }
  }

  if (processedCount % 500 !== 0) {
    await batch.commit();
  }

  logger.info(`Monthly summaries aggregation complete. Processed ${processedCount} users.`);
}

/**
 * Generate recommendations for active users
 */
async function generateRecommendationsForActiveUsers(userIds: string[]): Promise<void> {
  logger.info(`Generating recommendations for ${userIds.length} users...`);

  const batch = db.batch();
  let processedCount = 0;

  for (const userId of userIds) {
    const recommendations = await generatePersonalizedRecommendations(userId);
    
    if (recommendations) {
      const recommendationsRef = db.collection('userRecommendations').doc(userId);
      batch.set(recommendationsRef, recommendations);
      processedCount++;

      if (processedCount % 500 === 0) {
        await batch.commit();
        logger.info(`Generated ${processedCount} recommendations`);
      }
    }
  }

  if (processedCount % 500 !== 0) {
    await batch.commit();
  }

  logger.info(`Recommendations generation complete. Processed ${processedCount} users.`);
}
