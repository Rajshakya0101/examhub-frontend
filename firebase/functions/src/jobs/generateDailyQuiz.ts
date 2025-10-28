import { CloudEvent } from 'firebase-functions/v2';
import { db, serverTimestamp } from '../utils/firebase';
import { generateQuestions } from '../services/openai';
import * as logger from 'firebase-functions/logger';

const EXAMS = ['upsc', 'ssc', 'banking', 'engineering'];
const QUESTIONS_PER_EXAM = 5;

/**
 * Scheduled function to generate the daily quiz
 * This function runs every day at midnight
 */
export async function generateDailyQuiz(event: CloudEvent<unknown>) {
  try {
    logger.info('Starting daily quiz generation');
    
    const date = new Date();
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Generate a daily quiz for each supported exam
    for (const examId of EXAMS) {
      try {
        await generateExamDailyQuiz(examId, dateString);
      } catch (error) {
        // Log error but continue with other exams
        logger.error(`Failed to generate daily quiz for ${examId}:`, error);
      }
    }
    
    logger.info('Daily quiz generation completed');
    return { success: true };
    
  } catch (error) {
    logger.error('Daily quiz generation failed:', error);
    throw error;
  }
}

/**
 * Generate a daily quiz for a specific exam
 */
async function generateExamDailyQuiz(examId: string, dateString: string) {
  logger.info(`Generating daily quiz for ${examId}`);
  
  // Get the exam details to understand its topics
  const examRef = db.collection('exams').doc(examId);
  const examDoc = await examRef.get();
  
  if (!examDoc.exists) {
    throw new Error(`Exam ${examId} not found`);
  }
  
  const exam = examDoc.data();
  if (!exam || !exam.topics || !Array.isArray(exam.topics)) {
    throw new Error(`Invalid exam data or missing topics for ${examId}`);
  }
  
  // Select a random topic from the exam
  const topics = exam.topics;
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
  
  // Generate questions for the selected topic
  const questions = await generateQuestions(
    examId,
    selectedTopic,
    QUESTIONS_PER_EXAM,
    'medium'
  );
  
  // Store the questions in Firestore
  const batch = db.batch();
  const questionRefs: string[] = [];
  
  for (const question of questions) {
    const questionRef = db.collection('questions').doc();
    questionRefs.push(questionRef.id);
    
    batch.set(questionRef, {
      ...question,
      dailyQuiz: true,
      dailyQuizDate: dateString,
      createdAt: serverTimestamp(),
      createdBy: 'system',
      status: 'live'
    });
  }
  
  // Create the daily quiz document
  const quizRef = db.collection('dailyQuizzes').doc(`${examId}_${dateString}`);
  batch.set(quizRef, {
    examId,
    date: dateString,
    topic: selectedTopic,
    questions: questionRefs,
    publishedAt: serverTimestamp()
  });
  
  await batch.commit();
  
  logger.info(`Successfully created daily quiz for ${examId} on topic ${selectedTopic}`);
  return questionRefs;
}