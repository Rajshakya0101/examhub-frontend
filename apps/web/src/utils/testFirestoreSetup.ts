/**
 * Test script to verify Firestore setup and create sample user data
 * Run this after a user logs in to ensure collections are created
 */

import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Initialize user stats document
 */
async function initializeUserStats(userId: string) {
  await setDoc(doc(db, 'userStats', userId), {
    userId,
    testsCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedQuestions: 0,
    totalTimeSpentSec: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    accuracy: 0,
    avgTimePerQuestionSec: 0,
    recentScores: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}

/**
 * Update user stats after test
 */
async function updateUserStatsAfterTest(userId: string, testData: any) {
  const userStatsRef = doc(db, 'userStats', userId);
  
  await setDoc(userStatsRef, {
    testsCompleted: 1,
    questionsAnswered: testData.questionsAnswered,
    correctAnswers: testData.correctAnswers,
    incorrectAnswers: testData.incorrectAnswers,
    skippedQuestions: testData.skippedQuestions,
    totalTimeSpentSec: testData.timeSpentSec,
    currentStreak: 1,
    longestStreak: 1,
    lastActivityDate: Timestamp.now(),
    accuracy: (testData.correctAnswers / testData.questionsAnswered) * 100,
    avgTimePerQuestionSec: testData.timeSpentSec / testData.questionsAnswered,
    recentScores: [testData.score],
    updatedAt: Timestamp.now()
  }, { merge: true });
}

/**
 * Create sample user data in Firestore
 * This will create all necessary collections with test data
 */
export async function createSampleUserData(userId: string) {
  try {
    console.log('🔄 Creating sample user data for userId:', userId);
    
    // 1. Initialize user stats
    await initializeUserStats(userId);
    console.log('✅ UserStats initialized');
    
    // 2. Create a sample test attempt
    const attemptId = `test_attempt_${Date.now()}`;
    await setDoc(doc(db, 'attempts', attemptId), {
      id: attemptId,
      userId,
      examId: 'sample_exam_1',
      examTitle: 'Sample SSC CGL Mock Test',
      testType: 'full-mock',
      category: 'SSC',
      difficulty: 'moderate',
      status: 'submitted',
      startedAt: Timestamp.now(),
      submittedAt: Timestamp.now(),
      timeSpentSec: 3600, // 1 hour
      timeLimitSec: 3600,
      score: {
        raw: 75,
        percentage: 75,
        percentile: 85,
        passFail: 'pass'
      },
      questionStats: {
        total: 100,
        attempted: 95,
        correct: 75,
        incorrect: 20,
        skipped: 5,
        markedForReview: 10
      },
      sectionScores: {
        'Quantitative Aptitude': {
          raw: 18,
          total: 25,
          attempted: 24,
          accuracy: 75
        },
        'Reasoning': {
          raw: 20,
          total: 25,
          attempted: 25,
          accuracy: 80
        },
        'English': {
          raw: 17,
          total: 25,
          attempted: 23,
          accuracy: 74
        },
        'General Knowledge': {
          raw: 20,
          total: 25,
          attempted: 23,
          accuracy: 87
        }
      },
      updatedAt: Timestamp.now()
    });
    console.log('✅ Sample attempt created');
    
    // 3. Update user stats based on the sample attempt
    await updateUserStatsAfterTest(userId, {
      testId: attemptId,
      questionsAnswered: 95,
      correctAnswers: 75,
      incorrectAnswers: 20,
      skippedQuestions: 5,
      timeSpentSec: 3600,
      score: 75
    });
    console.log('✅ UserStats updated with test data');
    
    // 4. Create a leaderboard entry
    await setDoc(doc(db, 'leaderboard_global', userId), {
      userId,
      displayName: 'Test User',
      photoURL: '',
      rank: 1,
      totalScore: 750,
      testsCompleted: 1,
      accuracy: 79,
      currentStreak: 1,
      longestStreak: 1,
      badges: [
        {
          id: 'first_test',
          name: 'First Steps',
          level: 'bronze'
        }
      ],
      updatedAt: Timestamp.now(),
      lastActive: Timestamp.now()
    });
    console.log('✅ Leaderboard entry created');
    
    // 5. Create a daily summary
    const today = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'dailySummaries', `${userId}_${today}`), {
      id: `${userId}_${today}`,
      userId,
      date: today,
      testsCompleted: 1,
      totalQuestions: 100,
      correctAnswers: 75,
      accuracy: 79,
      timeSpent: 3600,
      fullMockCount: 1,
      sectionalCount: 0,
      topicWiseCount: 0,
      bestScore: 75,
      bestAccuracy: 79,
      createdAt: Timestamp.now()
    });
    console.log('✅ Daily summary created');
    
    console.log('🎉 Sample data creation completed successfully!');
    console.log('📊 Check Firestore console for collections:');
    console.log('   - userStats');
    console.log('   - attempts');
    console.log('   - leaderboard_global');
    console.log('   - dailySummaries');
    
    return {
      success: true,
      message: 'Sample data created successfully',
      userId,
      attemptId
    };
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

/**
 * Quick test function to check Firestore connection
 */
export async function testFirestoreConnection() {
  try {
    // Try to read from a public collection to test connection
    const testQuery = doc(db, 'users', 'connection_test');
    await setDoc(testQuery, {
      test: true,
      timestamp: Timestamp.now()
    }, { merge: true });
    console.log('✅ Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
}

/**
 * Hook to call from a component to initialize sample data
 */
export function useSampleDataCreator() {
  const createSample = async (userId: string) => {
    try {
      const result = await createSampleUserData(userId);
      return result;
    } catch (error) {
      console.error('Error in useSampleDataCreator:', error);
      throw error;
    }
  };
  
  return { createSample };
}
