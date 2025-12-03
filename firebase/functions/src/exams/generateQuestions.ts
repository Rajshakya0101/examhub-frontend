import { CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { generateQuestions as generateQuestionsAI } from '../services/gemini';
import { db } from '../utils/firebase';

interface GenerateQuestionsParams {
  topic: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  examType?: string;
}

interface QuestionData {
  examId: string;
  topic: string;
  type: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: string;
  tags: string[];
}

/**
 * Generate questions for a specific topic using AI
 * This function can be called from the frontend to generate questions on-demand
 */
export async function generateQuestionsByTopic(
  request: CallableRequest<GenerateQuestionsParams>
) {
  try {
    // Validate input
    const { topic, count, difficulty, examType = 'general' } = request.data;
    
    if (!topic || !count || !difficulty) {
      throw new Error('Missing required parameters: topic, count, and difficulty are required');
    }

    if (count < 1 || count > 50) {
      throw new Error('Question count must be between 1 and 50');
    }

    logger.info(`Generating ${count} questions for topic: ${topic}, difficulty: ${difficulty}`);

    // Generate questions using OpenAI
    const questions = await generateQuestionsAI(
      examType,
      topic,
      count,
      difficulty
    );

    // Store questions in Firestore
    const batch = db.batch();
    const questionIds: string[] = [];
    const timestamp = new Date();

    for (const question of questions) {
      const questionRef = db.collection('questions').doc();
      questionIds.push(questionRef.id);
      
      const questionData: QuestionData & { createdAt: Date; createdBy: string; status: string } = {
        ...question,
        createdAt: timestamp,
        createdBy: request.auth?.uid || 'system',
        status: 'active'
      };
      
      batch.set(questionRef, questionData);
    }

    await batch.commit();

    logger.info(`Successfully generated and stored ${questions.length} questions`);

    return {
      success: true,
      questionIds,
      count: questions.length,
      questions: questions.map((q, index) => ({
        id: questionIds[index],
        question: q.stem,
        topic: q.topic,
        difficulty: q.difficulty
      }))
    };

  } catch (error) {
    logger.error('Error generating questions:', error);
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
