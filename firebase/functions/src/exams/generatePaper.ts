import { CallableRequest } from 'firebase-functions/v2/https';
import { db, handleError, validateAuth } from '../utils/firebase';
import { examSchema } from '../shared/schema';
import { generateQuestions } from '../services/gemini';
import * as logger from 'firebase-functions/logger';

type GeneratePaperRequest = {
  examId: string;
  topics: Array<{
    topic: string;
    count: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
};

/**
 * Function to generate a mock exam paper with AI-powered questions
 */
export async function generatePaper(request: CallableRequest<GeneratePaperRequest>) {
  try {
    // Validate authentication
    const uid = validateAuth(request.auth || {});

    // Validate input
    const { examId, topics } = request.data;
    if (!examId || !topics || !Array.isArray(topics) || topics.length === 0) {
      throw new Error('Invalid request: examId and topics array are required');
    }

    logger.info(`Generating paper for exam ${examId} with ${topics.length} topics`);

    // Get exam details
    const examRef = db.collection('exams').doc(examId);
    const examDoc = await examRef.get();
    
    if (!examDoc.exists) {
      throw new Error(`Exam ${examId} not found`);
    }
    
    const exam = examDoc.data();
    if (!exam) {
      throw new Error(`Invalid exam data for ${examId}`);
    }

    // Create a new paper document
    const paperRef = db.collection('papers').doc();
    const paperId = paperRef.id;

    // Generate questions for each topic
    const generatedQuestions: any[] = [];
    
    // Process each topic sequentially to avoid rate limiting
    for (const topic of topics) {
      const questions = await generateQuestions(
        examId,
        topic.topic,
        topic.count,
        topic.difficulty || 'medium'
      );
      
      generatedQuestions.push(...questions);
    }

    // Store the questions in Firestore
    const batch = db.batch();
    const questionRefs: string[] = [];
    
    for (const question of generatedQuestions) {
      const questionRef = db.collection('questions').doc();
      questionRefs.push(questionRef.id);
      
      batch.set(questionRef, {
        ...question,
        paperRef: paperId,
        createdAt: new Date(),
        createdBy: 'system',
        status: 'live'
      });
    }
    
    // Store the paper details
    batch.set(paperRef, {
      examId,
      name: `AI Generated Mock - ${new Date().toLocaleDateString()}`,
      description: `AI-generated mock test for ${examId.toUpperCase()} covering ${topics.map(t => t.topic).join(', ')}`,
      questions: questionRefs,
      createdAt: new Date(),
      createdBy: uid,
      visibility: 'private'
    });
    
    await batch.commit();
    
    logger.info(`Successfully generated paper ${paperId} with ${generatedQuestions.length} questions`);
    
    return {
      success: true,
      paperId,
      questionCount: generatedQuestions.length
    };
    
  } catch (error) {
    return handleError(error);
  }
}