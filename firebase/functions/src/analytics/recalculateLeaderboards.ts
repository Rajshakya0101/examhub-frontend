import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

const db = getFirestore();

interface UserStats {
  userId: string;
  testsCompleted: number;
  totalCorrect: number;
  totalQuestions: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  totalScore: number;
  testsCompleted: number;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  rank?: number;
  percentile?: number;
  lastUpdated: FieldValue;
}

/**
 * Calculate leaderboard score using the same formula as frontend
 * Score = (0.6 × testsCompleted × 10) + (0.25 × avgAccuracy × 100) + (0.15 × longestStreak × 5)
 */
function calculateLeaderboardScore(stats: UserStats): number {
  const testsWeight = 0.6;
  const accuracyWeight = 0.25;
  const consistencyWeight = 0.15;

  const testsScore = stats.testsCompleted * 10;
  const accuracy = stats.totalQuestions > 0 
    ? (stats.totalCorrect / stats.totalQuestions) * 100 
    : 0;
  const accuracyScore = accuracy * 100;
  const consistencyScore = stats.longestStreak * 5;

  return Math.round(
    testsWeight * testsScore +
    accuracyWeight * accuracyScore +
    consistencyWeight * consistencyScore
  );
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
 * Recalculate global leaderboard rankings
 */
async function recalculateGlobalLeaderboard(): Promise<void> {
  logger.info('Starting global leaderboard recalculation...');

  try {
    // Fetch all user stats
    const statsSnapshot = await db.collection('userStats').get();
    
    if (statsSnapshot.empty) {
      logger.info('No user stats found, skipping global leaderboard recalculation');
      return;
    }

    // Calculate scores and prepare entries
    const entries: Array<UserStats & { score: number; displayName: string; photoURL: string }> = [];

    for (const doc of statsSnapshot.docs) {
      const stats = doc.data() as UserStats;
      
      // Get user profile for display info
      const userDoc = await db.collection('users').doc(doc.id).get();
      const userData = userDoc.data();

      const score = calculateLeaderboardScore(stats);
      
      entries.push({
        ...stats,
        userId: doc.id,
        score,
        displayName: userData?.displayName || 'Anonymous',
        photoURL: userData?.photoURL || '',
      });
    }

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Calculate percentiles and update leaderboard
    const totalUsers = entries.length;
    const batch = db.batch();
    let updateCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      const percentile = ((totalUsers - rank) / totalUsers) * 100;

      const leaderboardRef = db.collection('leaderboard_global').doc(entry.userId);
      
      const leaderboardEntry: LeaderboardEntry = {
        userId: entry.userId,
        displayName: entry.displayName,
        photoURL: entry.photoURL,
        totalScore: entry.score,
        testsCompleted: entry.testsCompleted,
        averageAccuracy: entry.totalQuestions > 0 
          ? Math.round((entry.totalCorrect / entry.totalQuestions) * 100) 
          : 0,
        currentStreak: entry.currentStreak,
        longestStreak: entry.longestStreak,
        rank,
        percentile: Math.round(percentile * 100) / 100,
        lastUpdated: FieldValue.serverTimestamp(),
      };

      batch.set(leaderboardRef, leaderboardEntry, { merge: true });
      updateCount++;

      // Commit batch every 500 operations (Firestore limit)
      if (updateCount % 500 === 0) {
        await batch.commit();
        logger.info(`Committed batch of ${updateCount} updates`);
      }
    }

    // Commit remaining updates
    if (updateCount % 500 !== 0) {
      await batch.commit();
    }

    logger.info(`Global leaderboard recalculation complete. Updated ${updateCount} entries.`);
  } catch (error) {
    logger.error('Error recalculating global leaderboard:', error);
    throw error;
  }
}

/**
 * Recalculate weekly leaderboard rankings
 */
async function recalculateWeeklyLeaderboard(): Promise<void> {
  logger.info('Starting weekly leaderboard recalculation...');

  try {
    const weekId = getWeekId();
    const weekPattern = `${weekId}_`;

    // Fetch all entries for current week
    const weeklySnapshot = await db.collection('leaderboard_weekly')
      .where('__name__', '>=', weekPattern)
      .where('__name__', '<', weekPattern + '\uf8ff')
      .get();

    if (weeklySnapshot.empty) {
      logger.info('No weekly leaderboard entries found');
      return;
    }

    // Extract and sort entries
    const entries: Array<LeaderboardEntry & { docId: string }> = [];
    
    for (const doc of weeklySnapshot.docs) {
      const data = doc.data() as LeaderboardEntry;
      entries.push({
        ...data,
        docId: doc.id,
      });
    }

    // Sort by score descending
    entries.sort((a, b) => b.totalScore - a.totalScore);

    // Update ranks and percentiles
    const totalUsers = entries.length;
    const batch = db.batch();
    let updateCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      const percentile = ((totalUsers - rank) / totalUsers) * 100;

      const leaderboardRef = db.collection('leaderboard_weekly').doc(entry.docId);
      
      batch.update(leaderboardRef, {
        rank,
        percentile: Math.round(percentile * 100) / 100,
        lastUpdated: FieldValue.serverTimestamp(),
      });
      updateCount++;

      if (updateCount % 500 === 0) {
        await batch.commit();
        logger.info(`Committed batch of ${updateCount} weekly updates`);
      }
    }

    if (updateCount % 500 !== 0) {
      await batch.commit();
    }

    logger.info(`Weekly leaderboard recalculation complete. Updated ${updateCount} entries.`);
  } catch (error) {
    logger.error('Error recalculating weekly leaderboard:', error);
    throw error;
  }
}

/**
 * Recalculate monthly leaderboard rankings
 */
async function recalculateMonthlyLeaderboard(): Promise<void> {
  logger.info('Starting monthly leaderboard recalculation...');

  try {
    const monthId = getMonthId();
    const monthPattern = `${monthId}_`;

    // Fetch all entries for current month
    const monthlySnapshot = await db.collection('leaderboard_monthly')
      .where('__name__', '>=', monthPattern)
      .where('__name__', '<', monthPattern + '\uf8ff')
      .get();

    if (monthlySnapshot.empty) {
      logger.info('No monthly leaderboard entries found');
      return;
    }

    // Extract and sort entries
    const entries: Array<LeaderboardEntry & { docId: string }> = [];
    
    for (const doc of monthlySnapshot.docs) {
      const data = doc.data() as LeaderboardEntry;
      entries.push({
        ...data,
        docId: doc.id,
      });
    }

    // Sort by score descending
    entries.sort((a, b) => b.totalScore - a.totalScore);

    // Update ranks and percentiles
    const totalUsers = entries.length;
    const batch = db.batch();
    let updateCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      const percentile = ((totalUsers - rank) / totalUsers) * 100;

      const leaderboardRef = db.collection('leaderboard_monthly').doc(entry.docId);
      
      batch.update(leaderboardRef, {
        rank,
        percentile: Math.round(percentile * 100) / 100,
        lastUpdated: FieldValue.serverTimestamp(),
      });
      updateCount++;

      if (updateCount % 500 === 0) {
        await batch.commit();
        logger.info(`Committed batch of ${updateCount} monthly updates`);
      }
    }

    if (updateCount % 500 !== 0) {
      await batch.commit();
    }

    logger.info(`Monthly leaderboard recalculation complete. Updated ${updateCount} entries.`);
  } catch (error) {
    logger.error('Error recalculating monthly leaderboard:', error);
    throw error;
  }
}

/**
 * Archive old weekly leaderboards (older than 8 weeks)
 */
async function archiveOldWeeklyLeaderboards(): Promise<void> {
  logger.info('Starting weekly leaderboard archival...');

  try {
    const currentDate = new Date();
    const archiveDate = new Date(currentDate);
    archiveDate.setDate(archiveDate.getDate() - 56); // 8 weeks ago

    // Get week IDs to archive
    const weeksToArchive: string[] = [];
    for (let i = 0; i < 8; i++) {
      const weekDate = new Date(archiveDate);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      weeksToArchive.push(getWeekId(weekDate));
    }

    let archivedCount = 0;

    for (const weekId of weeksToArchive) {
      const weekPattern = `${weekId}_`;
      
      // Fetch entries for this week
      const snapshot = await db.collection('leaderboard_weekly')
        .where('__name__', '>=', weekPattern)
        .where('__name__', '<', weekPattern + '\uf8ff')
        .get();

      if (snapshot.empty) continue;

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        // Copy to archive collection
        const archiveRef = db.collection('leaderboard_archive_weekly').doc(doc.id);
        batch.set(archiveRef, {
          ...doc.data(),
          archivedAt: FieldValue.serverTimestamp(),
        });

        // Delete from active collection
        batch.delete(doc.ref);
        batchCount++;
        archivedCount++;

        if (batchCount >= 500) {
          await batch.commit();
          logger.info(`Archived batch of ${batchCount} entries for week ${weekId}`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
    }

    logger.info(`Archived ${archivedCount} old weekly leaderboard entries`);
  } catch (error) {
    logger.error('Error archiving weekly leaderboards:', error);
    throw error;
  }
}

/**
 * Archive old monthly leaderboards (older than 6 months)
 */
async function archiveOldMonthlyLeaderboards(): Promise<void> {
  logger.info('Starting monthly leaderboard archival...');

  try {
    const currentDate = new Date();
    const archiveDate = new Date(currentDate);
    archiveDate.setMonth(archiveDate.getMonth() - 6); // 6 months ago

    // Get month IDs to archive
    const monthsToArchive: string[] = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(archiveDate);
      monthDate.setMonth(monthDate.getMonth() - i);
      monthsToArchive.push(getMonthId(monthDate));
    }

    let archivedCount = 0;

    for (const monthId of monthsToArchive) {
      const monthPattern = `${monthId}_`;
      
      // Fetch entries for this month
      const snapshot = await db.collection('leaderboard_monthly')
        .where('__name__', '>=', monthPattern)
        .where('__name__', '<', monthPattern + '\uf8ff')
        .get();

      if (snapshot.empty) continue;

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        // Copy to archive collection
        const archiveRef = db.collection('leaderboard_archive_monthly').doc(doc.id);
        batch.set(archiveRef, {
          ...doc.data(),
          archivedAt: FieldValue.serverTimestamp(),
        });

        // Delete from active collection
        batch.delete(doc.ref);
        batchCount++;
        archivedCount++;

        if (batchCount >= 500) {
          await batch.commit();
          logger.info(`Archived batch of ${batchCount} entries for month ${monthId}`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
    }

    logger.info(`Archived ${archivedCount} old monthly leaderboard entries`);
  } catch (error) {
    logger.error('Error archiving monthly leaderboards:', error);
    throw error;
  }
}

/**
 * Main function to recalculate all leaderboards
 */
export async function recalculateAllLeaderboards(): Promise<void> {
  logger.info('Starting complete leaderboard recalculation process...');

  try {
    // Recalculate all leaderboards
    await Promise.all([
      recalculateGlobalLeaderboard(),
      recalculateWeeklyLeaderboard(),
      recalculateMonthlyLeaderboard(),
    ]);

    // Archive old data (run sequentially to avoid overwhelming Firestore)
    await archiveOldWeeklyLeaderboards();
    await archiveOldMonthlyLeaderboards();

    logger.info('Complete leaderboard recalculation process finished successfully');
  } catch (error) {
    logger.error('Error in complete leaderboard recalculation:', error);
    throw error;
  }
}
