import { CallableRequest } from 'firebase-functions/v2/https';
import { db, handleError, validateAuth } from '../utils/firebase';
import * as logger from 'firebase-functions/logger';

interface AnalysisRequest {
  attemptId: string;
}

interface TopicAnalysis {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  timeSpentMs: number;
}

interface DifficultyAnalysis {
  difficulty: 'easy' | 'medium' | 'hard';
  correct: number;
  total: number;
  percentage: number;
  timeSpentMs: number;
}

interface AnalysisResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  accuracy: number;
  timeSpentMinutes: number;
  averageTimePerQuestion: number; // in seconds
  topicBreakdown: TopicAnalysis[];
  difficultyBreakdown: DifficultyAnalysis[];
  weakTopics: string[];
  strengths: string[];
  improvementAreas: {
    topic: string;
    description: string;
  }[];
  performance: {
    category: 'time' | 'accuracy' | 'completion';
    rating: 'excellent' | 'good' | 'average' | 'needs_improvement';
    description: string;
  }[];
}

/**
 * Function to analyze a scored attempt and provide detailed insights
 */
export async function analyzeAttempt(request: CallableRequest<AnalysisRequest>) {
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
      throw new Error('You can only analyze your own attempts');
    }
    
    // Check if attempt is scored
    if (attempt.status !== 'scored') {
      throw new Error('Attempt must be scored before analysis');
    }
    
    // Get answers
    let answers: any[] = [];
    try {
      const answersSnapshot = await db.collection('attempts')
        .doc(attemptId)
        .collection('items')
        .get();
      
      answers = answersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (answers.length === 0) {
        throw new Error('No answer items found for this attempt');
      }
    } catch (error) {
      logger.error(`Error fetching answers for attempt ${attemptId}:`, error);
      throw new Error(`Failed to retrieve answers: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Get questions
    // Firebase 'in' queries are limited to 10 items, so we may need to chunk the requests
    const questionIds = answers.map(answer => answer.id);
    const questions: Record<string, any> = {};
    
    // Process questions in chunks of 10 (Firestore limit for 'in' queries)
    const chunkSize = 10;
    const questionIdChunks: string[][] = [];
    for (let i = 0; i < questionIds.length; i += chunkSize) {
      questionIdChunks.push(questionIds.slice(i, i + chunkSize));
    }
    
    // Query each chunk and merge results
    await Promise.all(
      questionIdChunks.map(async (idChunk) => {
        if (idChunk.length === 0) return; // Skip empty chunks
        
        try {
          const chunkSnapshot = await db.collection('questions')
            .where('__name__', 'in', idChunk)
            .get();
          
          chunkSnapshot.docs.forEach(doc => {
            questions[doc.id] = { id: doc.id, ...doc.data() };
          });
        } catch (error) {
          logger.error('Error fetching questions chunk:', error);
          // Continue with available data instead of failing completely
        }
      })
    );
    
    // Generate analysis
    const analysis = generateAnalysis(answers, questions);
    
    // Store analysis result
    try {
      await db.runTransaction(async (transaction) => {
        // Re-get the document to ensure it's still valid
        const freshAttemptDoc = await transaction.get(attemptRef);
        
        if (!freshAttemptDoc.exists) {
          throw new Error(`Attempt ${attemptId} no longer exists`);
        }
        
        // Update with the analysis
        transaction.update(attemptRef, {
          analysis: analysis,
          analyzedAt: new Date()
        });
      });
      
      logger.info(`Successfully analyzed attempt ${attemptId} for user ${uid}`);
      
      return {
        success: true,
        analysis
      };
    } catch (error) {
      logger.error(`Error saving analysis for attempt ${attemptId}:`, error);
      throw new Error(`Failed to save analysis results: ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Generate detailed analysis from answers and questions
 */
function generateAnalysis(answers: any[], questions: Record<string, any>): AnalysisResult {
  // Basic metrics
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.correctBool).length;
  const incorrectAnswers = answers.filter(a => a.correctBool === false).length;
  const skippedQuestions = answers.filter(a => a.selectedIdx === null).length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  // Time metrics
  const totalTimeMs = answers.reduce((sum, a) => sum + (a.timeSpentMs || 0), 0);
  const timeSpentMinutes = totalTimeMs / (1000 * 60);
  const averageTimePerQuestion = totalTimeMs / (totalQuestions * 1000); // in seconds
  
  // Topic breakdown
  const topicMap = new Map<string, { correct: number, total: number, time: number }>();
  
  // Difficulty breakdown
  const difficultyMap = new Map<string, { correct: number, total: number, time: number }>();
  
  // Track missing questions for logging
  const missingQuestions: string[] = [];
  
  // Process each answer
  answers.forEach(answer => {
    const question = questions[answer.id];
    if (!question) {
      // Track missing questions but don't halt the analysis
      missingQuestions.push(answer.id);
      return;
    }
    
    const topic = question.topic || 'Unknown';
    const difficulty = question.difficulty || 'medium';
    const isCorrect = answer.correctBool === true;
    const timeSpent = answer.timeSpentMs || 0;
    
    // Update topic stats
    if (!topicMap.has(topic)) {
      topicMap.set(topic, { correct: 0, total: 0, time: 0 });
    }
    const topicStats = topicMap.get(topic)!;
    topicStats.total++;
    topicStats.time += timeSpent;
    if (isCorrect) topicStats.correct++;
    
    // Update difficulty stats
    if (!difficultyMap.has(difficulty)) {
      difficultyMap.set(difficulty, { correct: 0, total: 0, time: 0 });
    }
    const diffStats = difficultyMap.get(difficulty)!;
    diffStats.total++;
    diffStats.time += timeSpent;
    if (isCorrect) diffStats.correct++;
  });
  
  // Format topic breakdown
  const topicBreakdown: TopicAnalysis[] = Array.from(topicMap.entries())
    .map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      timeSpentMs: stats.time
    }))
    .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  
  // Format difficulty breakdown
  const difficultyBreakdown: DifficultyAnalysis[] = Array.from(difficultyMap.entries())
    .map(([difficulty, stats]) => ({
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      timeSpentMs: stats.time
    }))
    .sort((a, b) => {
      // Sort by difficulty: easy, medium, hard
      const difficultyOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  
  // Identify weak topics (less than 60% accuracy)
  const weakTopics = topicBreakdown
    .filter(t => t.percentage < 60)
    .map(t => t.topic);
  
  // Identify strengths (more than 80% accuracy)
  const strengths = topicBreakdown
    .filter(t => t.percentage >= 80)
    .map(t => t.topic);
  
  // Generate improvement suggestions
  const improvementAreas = weakTopics.map(topic => {
    const topicData = topicBreakdown.find(t => t.topic === topic)!;
    
    return {
      topic,
      description: `Focus on improving ${topic} where you scored ${topicData.correct}/${topicData.total} (${Math.round(topicData.percentage)}%). Review concepts and practice more questions in this area.`
    };
  });
  
  // Generate performance insights
  const performance: {
    category: 'time' | 'accuracy' | 'completion';
    rating: 'excellent' | 'good' | 'average' | 'needs_improvement';
    description: string;
  }[] = [];
  
  // Time performance
  if (averageTimePerQuestion < 20) { // Less than 20 seconds per question
    performance.push({
      category: 'time',
      rating: 'excellent',
      description: 'Your speed is excellent. You\'re answering questions quickly which gives you an advantage in time-constrained exams.'
    });
  } else if (averageTimePerQuestion < 45) {
    performance.push({
      category: 'time',
      rating: 'good',
      description: 'Your pace is good. You\'re taking a reasonable amount of time on each question.'
    });
  } else if (averageTimePerQuestion < 90) {
    performance.push({
      category: 'time',
      rating: 'average',
      description: 'Your pace is average. Try to improve your speed by practicing more questions under timed conditions.'
    });
  } else {
    performance.push({
      category: 'time',
      rating: 'needs_improvement',
      description: 'You\'re spending too much time on questions. Work on improving your speed by setting time limits for practice sessions.'
    });
  }
  
  // Accuracy performance
  if (accuracy >= 90) {
    performance.push({
      category: 'accuracy',
      rating: 'excellent',
      description: 'Your accuracy is outstanding. You have a strong grasp of the concepts being tested.'
    });
  } else if (accuracy >= 75) {
    performance.push({
      category: 'accuracy',
      rating: 'good',
      description: 'Your accuracy is good. You understand most concepts but there\'s still room for improvement.'
    });
  } else if (accuracy >= 60) {
    performance.push({
      category: 'accuracy',
      rating: 'average',
      description: 'Your accuracy is acceptable but needs improvement. Focus on understanding core concepts better.'
    });
  } else {
    performance.push({
      category: 'accuracy',
      rating: 'needs_improvement',
      description: 'Your accuracy needs significant improvement. Review the fundamentals and work on understanding basic concepts.'
    });
  }
  
  // Completion performance
  const completionRate = (totalQuestions - skippedQuestions) / totalQuestions * 100;
  if (completionRate === 100) {
    performance.push({
      category: 'completion',
      rating: 'excellent',
      description: 'You attempted all questions, which is excellent. This maximizes your scoring potential.'
    });
  } else if (completionRate >= 90) {
    performance.push({
      category: 'completion',
      rating: 'good',
      description: 'You attempted most questions. In the future, try to answer all questions even if you need to make educated guesses.'
    });
  } else if (completionRate >= 75) {
    performance.push({
      category: 'completion',
      rating: 'average',
      description: 'You skipped several questions. Work on time management to ensure you can attempt all questions.'
    });
  } else {
    performance.push({
      category: 'completion',
      rating: 'needs_improvement',
      description: 'You left many questions unattempted. Focus on answering all questions, even with educated guesses.'
    });
  }
  
  // Log if there were missing questions
  if (missingQuestions.length > 0) {
    logger.warn(`Missing ${missingQuestions.length} questions during analysis:`, missingQuestions);
  }

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    skippedQuestions,
    accuracy,
    timeSpentMinutes,
    averageTimePerQuestion,
    topicBreakdown,
    difficultyBreakdown,
    weakTopics,
    strengths,
    improvementAreas,
    performance
  };
}