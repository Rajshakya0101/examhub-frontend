/**
 * Firestore functions for test attempts
 * These functions handle creating, saving, and submitting test attempts
 */

import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { updateUserStatsAfterTest } from './firestore';

/**
 * Create a new test attempt in Firestore
 */
export async function createAttempt(
  userId: string,
  examId: string,
  examTitle: string,
  testType: 'full-mock' | 'sectional-mock' | 'topic-wise-mock' | 'quick-practice' | 'quick-quiz',
  totalQuestions: number,
  timeLimitMinutes: number
): Promise<string> {
  const attemptId = `attempt_${userId}_${Date.now()}`;
  const attemptRef = doc(db, 'attempts', attemptId);

  await setDoc(attemptRef, {
    id: attemptId,
    userId,
    examId,
    examTitle,
    testType,
    category: 'SSC',
    difficulty: 'moderate',
    status: 'in-progress',
    startedAt: Timestamp.now(),
    timeSpentSec: 0,
    timeLimitSec: timeLimitMinutes * 60,
    questionStats: {
      total: totalQuestions,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      skipped: totalQuestions,
    },
    // Maximum marks for this attempt (2 marks per question)
    maxMarks: totalQuestions * 2,
    updatedAt: Timestamp.now(),
  });

  return attemptId;
}

/**
 * Save a single answer during the test
 */
export async function saveAnswer(
  attemptId: string,
  questionId: string,
  payload: {
    selectedIdx?: number | null;
    selectedOption?: string | null;
    timeSpentMs?: number;
    markedForReview?: boolean;
    questionId?: string;
  }
): Promise<void> {
  const answerRef = doc(db, 'attempts', attemptId, 'answers', questionId);

  const docData: any = {
    questionId: payload.questionId || questionId,
    selectedIdx: payload.selectedIdx,
    selectedOption: payload.selectedOption ?? null,
    timeSpentMs: payload.timeSpentMs ?? 0,
    markedForReview: payload.markedForReview ?? false,
    savedAt: Timestamp.now(),
  };

  await setDoc(answerRef, docData);
}

/**
 * Submit the test attempt and calculate score
 */
export async function submitAttempt(
  attemptId: string,
  timeRemainingSeconds: number,
  questions: Array<{
    id: string;
    correctOption: string;
    selectedOption?: string | null;
    timeSpentMs?: number;
  }>
): Promise<void> {
  // Calculate statistics
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  let attempted = 0;
  let totalTimeSpent = 0;

  questions.forEach((q) => {
    if (q.selectedOption) {
      attempted++;
      totalTimeSpent += q.timeSpentMs || 0;
      if (q.selectedOption === q.correctOption) {
        correct++;
      } else {
        incorrect++;
      }
    } else {
      skipped++;
    }
  });

  const totalQuestions = questions.length;
  const rawScore = correct; // number of correct answers
  const rawMarks = correct * 2; // marks (2 per question)
  const percentage = (correct / totalQuestions) * 100;
  const timeSpentSec = Math.floor(totalTimeSpent / 1000);

  // Update attempt document
  const attemptRef = doc(db, 'attempts', attemptId);
  
  await updateDoc(attemptRef, {
    status: 'submitted',
    submittedAt: Timestamp.now(),
    timeSpentSec,
    score: {
      raw: rawMarks, // store raw as marks (2 marks per correct answer)
      percentage: Math.round(percentage * 100) / 100,
      passFail: percentage >= 40 ? 'pass' : 'fail',
    },
    questionStats: {
      total: totalQuestions,
      attempted,
      correct,
      incorrect,
      skipped,
    },
    maxMarks: totalQuestions * 2,
    updatedAt: Timestamp.now(),
  });

  // Get user ID and test type, then update stats
  const attemptDoc = await getDoc(attemptRef);
  const attemptData = attemptDoc.data();
  const userId = attemptData?.userId;
  const testType = attemptData?.testType;

  if (userId) {
    await updateUserStatsAfterTest(userId, {
      testId: attemptId,
      questionsAnswered: attempted,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      skippedQuestions: skipped,
      timeSpentSec,
      score: rawScore,
      testType: testType || 'full-mock',
    });
  }
}
