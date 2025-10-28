import { CallableRequest } from 'firebase-functions/v2/https';
import { db, handleError, validateAuth } from '../utils/firebase';
import * as logger from 'firebase-functions/logger';

interface ScoreAttemptRequest {
  attemptId: string;
}

/**
 * Function to score a completed exam attempt and calculate analytics
 */
export async function scoreAttempt(request: CallableRequest<ScoreAttemptRequest>) {
  try {
    // Validate authentication
    const uid = validateAuth(request.auth || {});
    
    // Get attempt ID from request
    const { attemptId } = request.data;
    if (!attemptId) {
      throw new Error('Attempt ID is required');
    }
    
    // Get attempt document
    const attemptRef = db.collection('attempts').doc(attemptId);
    const attemptDoc = await attemptRef.get();
    
    if (!attemptDoc.exists) {
      throw new Error(`Attempt ${attemptId} not found`);
    }
    
    const attempt = attemptDoc.data();
    if (!attempt) {
      throw new Error('Invalid attempt data');
    }
    
    // Verify ownership
    if (attempt.userId !== uid) {
      throw new Error('You can only score your own attempts');
    }
    
    // Check if already scored
    if (attempt.status === 'scored') {
      return { success: true, message: 'Attempt already scored', score: attempt.score };
    }
    
    // Get exam details to determine scoring rules
    const examRef = db.collection('exams').doc(attempt.examId);
    const examDoc = await examRef.get();
    
    if (!examDoc.exists) {
      throw new Error(`Exam ${attempt.examId} not found`);
    }
    
    const exam = examDoc.data();
    if (!exam) {
      throw new Error('Invalid exam data');
    }
    
    // Get attempt items (answers)
    const answersSnapshot = await db.collection('attempts')
      .doc(attemptId)
      .collection('items')
      .get();
    
    if (answersSnapshot.empty) {
      throw new Error('No answers found for this attempt');
    }
    
    // Define a proper type for answer items
    interface AnswerItem {
      id: string;
      selectedIdx: number | null;
      timeSpentMs: number;
      correctBool?: boolean;
      [key: string]: any; // For other potential fields
    }
    
    const answers: AnswerItem[] = answersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AnswerItem));
    
    // Get questions to check against correct answers
    const questionIds = answers.map(answer => answer.id);
    const questions: Record<string, any> = {};
    
    // Process questions in chunks of 10 (Firestore limit for 'in' queries)
    const chunkSize = 10;
    
    try {
      // Split question IDs into chunks of 10
      for (let i = 0; i < questionIds.length; i += chunkSize) {
        const idChunk = questionIds.slice(i, i + chunkSize);
        
        const chunkSnapshot = await db.collection('questions')
          .where('__name__', 'in', idChunk)
          .get();
          
        chunkSnapshot.docs.forEach(doc => {
          questions[doc.id] = doc.data();
        });
      }
      
      // Verify we got all the questions
      const retrievedCount = Object.keys(questions).length;
      if (retrievedCount < questionIds.length) {
        logger.warn(`Only retrieved ${retrievedCount}/${questionIds.length} questions for attempt ${attemptId}`);
      }
    } catch (error) {
      logger.error('Error fetching questions for scoring:', error);
      throw new Error(`Failed to retrieve questions: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Calculate score
    let totalQuestions = answers.length;
    let correctAnswers = 0;
    let totalTimeMs = 0;
    let sectionScores: Record<string, { total: number, correct: number }> = {};
    
    // Process each answer
    const batch = db.batch();
    const skippedAnswers: string[] = [];
    const invalidQuestions: string[] = [];
    
    answers.forEach(answer => {
      const question = questions[answer.id];
      
      if (!question) {
        logger.warn(`Question ${answer.id} not found for scoring`);
        invalidQuestions.push(answer.id);
        totalQuestions--;
        return;
      }
      
      // Track section scores
      const section = question.section || 'general';
      if (!sectionScores[section]) {
        sectionScores[section] = { total: 0, correct: 0 };
      }
      sectionScores[section].total++;
      
      // Get the user's selected answer
      const selectedIdx = answer.selectedIdx;
      
      // Track skipped questions
      if (selectedIdx === null || selectedIdx === undefined) {
        skippedAnswers.push(answer.id);
      }
      
      // Calculate correctness
      let isCorrect = false;
      let answerRef = db.collection('attempts').doc(attemptId).collection('items').doc(answer.id);
      
      // Check if answer is correct (only if an answer was selected)
      if (selectedIdx !== null && selectedIdx !== undefined && 
          question.correctIndex !== null && question.correctIndex !== undefined &&
          selectedIdx === question.correctIndex) {
        isCorrect = true;
        correctAnswers++;
        sectionScores[section].correct++;
      }
      
      // Update the answer with correctness info
      batch.update(answerRef, { correctBool: isCorrect });
      
      // Add to total time spent (with safety check)
      totalTimeMs += (typeof answer.timeSpentMs === 'number') ? answer.timeSpentMs : 0;
    });
    
    // Log summary information
    if (skippedAnswers.length > 0) {
      logger.info(`Attempt ${attemptId} has ${skippedAnswers.length} skipped questions`);
    }
    
    if (invalidQuestions.length > 0) {
      logger.warn(`Attempt ${attemptId} has ${invalidQuestions.length} invalid questions that couldn't be scored`);
    }
    
    // Ensure we have questions to score
    if (totalQuestions <= 0) {
      throw new Error('No valid questions found for scoring this attempt');
    }
    
    // Calculate raw score with negative marking
    const negativeMarkingFactor = exam.negativeMarking || 0;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const negativeMarks = incorrectAnswers * negativeMarkingFactor;
    const rawScore = Math.max(0, correctAnswers - negativeMarks);
    
    // Calculate percentile (placeholder - would normally compare against all attempts)
    // In a real implementation, this would involve a separate analytics job
    const percentile = Math.min(100, (rawScore / totalQuestions) * 100);
    
    // Format section scores for storage
    const formattedSectionScores = Object.entries(sectionScores).map(([name, data]) => ({
      name,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0
    }));
    
    // Update the attempt document with scores
    batch.update(attemptRef, {
      status: 'scored',
      score: {
        raw: rawScore,
        outOf: totalQuestions,
        percentage: (rawScore / totalQuestions) * 100,
        percentile: percentile,
        correctAnswers,
        incorrectAnswers,
        totalTimeMs,
        avgTimePerQuestionMs: totalQuestions > 0 ? totalTimeMs / totalQuestions : 0,
        sections: formattedSectionScores
      },
      scoredAt: new Date()
    });
    
    // Commit all updates with error handling
    try {
      await batch.commit();
      logger.info(`Successfully scored attempt ${attemptId} for user ${uid}`);
    } catch (error) {
      logger.error(`Failed to commit batch updates for attempt ${attemptId}:`, error);
      throw new Error(`Failed to save scoring results: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Return the score details
    return {
      success: true,
      attemptId,
      score: {
        raw: rawScore,
        outOf: totalQuestions,
        percentage: (rawScore / totalQuestions) * 100,
        percentile: percentile,
        correctAnswers,
        incorrectAnswers,
        sections: formattedSectionScores
      }
    };
    
  } catch (error) {
    logger.error(`Error in scoreAttempt function for attempt ${request.data?.attemptId}:`, error);
    return handleError(error);
  }
}