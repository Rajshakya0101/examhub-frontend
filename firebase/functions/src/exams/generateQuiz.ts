import { CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db } from '../admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../utils/config';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

interface GenerateQuizParams {
  subject: string;
  numQuestions: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateQuiz(request: CallableRequest<GenerateQuizParams>) {
  try {
    const { subject, numQuestions, timeLimit, difficulty } = request.data;

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    // Generate questions using Gemini
    const prompt = `Generate ${numQuestions} multiple choice questions for a ${difficulty} level ${subject} quiz.
    Each question should have 4 options with one correct answer.
    Format the response as a valid JSON object with a "questions" array containing objects with exactly this structure:
    {
      "questions": [
        {
          "question": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation of why this is correct"
        }
      ]
    }
    Important: Ensure the correctAnswer is the 0-based index (0-3) of the correct option.
    Make questions challenging but clear, and ensure answers are factually correct.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Failed to generate questions');
    }

    // Parse and validate the response
    let questions: Question[];
    try {
      const parsed = JSON.parse(text);
      questions = parsed.questions || parsed;
      
      // Validate the structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format');
      }

      questions.forEach((q, i) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.correctAnswer !== 'number' || !q.explanation) {
          throw new Error(`Invalid question format at index ${i}`);
        }
      });
    } catch (error) {
      logger.error('Failed to parse Gemini response:', error);
      throw new Error('Failed to generate valid questions');
    }

    // Store the quiz in Firestore
    const quizData = {
      title: `${subject} Quiz`,
      description: `A ${difficulty} level quiz on ${subject}`,
      questions,
      timeLimit: timeLimit * 60, // Convert to seconds
      createdAt: new Date(),
      type: 'guest',
      subject,
      difficulty,
      isPublic: true
    };

    const quizRef = await db.collection('quizzes').add(quizData);
    logger.info(`Generated quiz ${quizRef.id} for subject ${subject}`);

    return quizRef.id;
  } catch (error) {
    logger.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz');
  }
}