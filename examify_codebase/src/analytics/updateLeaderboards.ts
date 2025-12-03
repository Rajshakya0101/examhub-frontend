import { Change, DocumentSnapshot } from 'firebase-functions/v2/firestore';
import { db, serverTimestamp } from '../utils/firebase';
import * as logger from 'firebase-functions/logger';

// Window settings
const WEEKLY_WINDOW_DAYS = 7;
const MONTHLY_WINDOW_DAYS = 30;

// Number of users to keep in leaderboards
const MAX_LEADERBOARD_ENTRIES = 100;

/**
 * Function to update leaderboards when a new attempt is submitted
 */
export async function updateLeaderboards(
  change: Change<DocumentSnapshot>,
  context: { params: { attemptId: string } }
) {
  try {
    // Only run for new submissions or updates to scored attempts
    const afterData = change.after.data();
    const beforeData = change.before.data();
    
    if (!afterData) {
      logger.info('Attempt was deleted, no leaderboard update needed');
      return;
    }
    
    // Skip if this isn't a completed, scored attempt
    if (afterData.status !== 'scored') {
      logger.info('Attempt not yet scored, skipping leaderboard update');
      return;
    }
    
    // Skip if already processed (score unchanged)
    if (
      beforeData && 
      beforeData.status === 'scored' && 
      beforeData.score?.raw === afterData.score?.raw
    ) {
      logger.info('No score change detected, skipping leaderboard update');
      return;
    }
    
    const attemptId = context.params.attemptId;
    const examId = afterData.examId;
    const userId = afterData.userId;
    const score = afterData.score?.raw || 0;
    
    logger.info(`Updating leaderboards for attempt ${attemptId} (User: ${userId}, Exam: ${examId}, Score: ${score})`);
    
    // Get user details for the leaderboard entry
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found, using placeholder name`);
    }
    
    const userData = userDoc.data() || {};
    const displayName = userData.displayName || 'Anonymous';
    const photoURL = userData.photoURL || null;
    
    // Get current date for time window calculations
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - WEEKLY_WINDOW_DAYS);
    
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - MONTHLY_WINDOW_DAYS);
    
    // Update weekly global leaderboard
    await updateLeaderboard(
      `leaderboards/${examId}_global_weekly`,
      examId,
      'global',
      'weekly',
      userId,
      displayName,
      photoURL,
      score
    );
    
    // Update monthly global leaderboard
    await updateLeaderboard(
      `leaderboards/${examId}_global_monthly`,
      examId,
      'global',
      'monthly',
      userId,
      displayName,
      photoURL,
      score
    );
    
    // If user has friends, update friends leaderboard
    if (userData.friends && Array.isArray(userData.friends) && userData.friends.length > 0) {
      // Update weekly friends leaderboard
      await updateLeaderboard(
        `leaderboards/${examId}_friends_weekly_${userId}`,
        examId,
        'friends',
        'weekly',
        userId,
        displayName,
        photoURL,
        score,
        userData.friends
      );
      
      // Update monthly friends leaderboard
      await updateLeaderboard(
        `leaderboards/${examId}_friends_monthly_${userId}`,
        examId,
        'friends',
        'monthly',
        userId,
        displayName,
        photoURL,
        score,
        userData.friends
      );
      
      // Also add this score to friends' leaderboards
      for (const friendId of userData.friends) {
        // Check if friend exists
        const friendDoc = await db.collection('users').doc(friendId).get();
        if (!friendDoc.exists) {
          logger.warn(`Friend ${friendId} not found, skipping their leaderboard update`);
          continue;
        }
        
        // Update weekly friend leaderboard
        await updateLeaderboard(
          `leaderboards/${examId}_friends_weekly_${friendId}`,
          examId,
          'friends',
          'weekly',
          userId,
          displayName,
          photoURL,
          score
        );
        
        // Update monthly friend leaderboard
        await updateLeaderboard(
          `leaderboards/${examId}_friends_monthly_${friendId}`,
          examId,
          'friends',
          'monthly',
          userId,
          displayName,
          photoURL,
          score
        );
      }
    }
    
    logger.info(`Leaderboard updates completed for attempt ${attemptId}`);
    
  } catch (error) {
    logger.error('Error updating leaderboards:', error);
    throw error;
  }
}

/**
 * Helper function to update a specific leaderboard
 */
async function updateLeaderboard(
  docPath: string,
  examId: string,
  type: 'global' | 'friends',
  window: 'weekly' | 'monthly',
  userId: string,
  displayName: string,
  photoURL: string | null,
  score: number,
  friendIds?: string[]
) {
  // Try to get existing leaderboard
  const leaderboardRef = db.doc(docPath);
  const leaderboardDoc = await leaderboardRef.get();
  
  if (!leaderboardDoc.exists) {
    // Create new leaderboard
    await leaderboardRef.set({
      examId,
      type,
      window,
      entries: [
        {
          rank: 1,
          userId,
          displayName,
          photoURL,
          score
        }
      ],
      updatedAt: serverTimestamp()
    });
    return;
  }
  
  // Update existing leaderboard
  const leaderboard = leaderboardDoc.data() || {};
  const entries = leaderboard.entries || [];
  
  // Check if user already exists in the leaderboard
  const existingEntryIndex = entries.findIndex((e: any) => e.userId === userId);
  
  if (existingEntryIndex >= 0) {
    // Update existing entry if new score is higher
    if (entries[existingEntryIndex].score < score) {
      entries[existingEntryIndex].score = score;
      entries[existingEntryIndex].displayName = displayName; // Update in case name changed
      entries[existingEntryIndex].photoURL = photoURL; // Update photo URL
    } else {
      // Skip if new score is not higher
      return;
    }
  } else {
    // Add new entry
    entries.push({
      userId,
      displayName,
      photoURL,
      score
    });
    
    // For friends leaderboard, filter entries to include only friends
    if (type === 'friends' && friendIds) {
      const validUserIds = [...friendIds, userId]; // Include self
      const filteredEntries = entries.filter((entry: any) => 
        validUserIds.includes(entry.userId)
      );
      
      if (filteredEntries.length < entries.length) {
        // Some entries were filtered out
        entries.length = 0; // Clear array
        entries.push(...filteredEntries); // Replace with filtered entries
      }
    }
  }
  
  // Sort entries by score (descending)
  entries.sort((a: any, b: any) => b.score - a.score);
  
  // Limit to max entries
  if (entries.length > MAX_LEADERBOARD_ENTRIES) {
    entries.length = MAX_LEADERBOARD_ENTRIES;
  }
  
  // Update ranks
  entries.forEach((entry: any, index: number) => {
    entry.rank = index + 1;
  });
  
  // Update leaderboard
  await leaderboardRef.update({
    entries,
    updatedAt: serverTimestamp()
  });
}