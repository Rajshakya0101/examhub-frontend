import { CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import cors from 'cors';
import * as functions from 'firebase-functions/v2';
import { openai } from '../services/openai';
import { db } from '../admin';

const corsHandler = cors({ origin: true });

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

    // Generate questions using OpenAI
    const prompt = `Generate ${numQuestions} multiple choice questions for a ${difficulty} level ${subject} quiz.
    Each question should have 4 options with one correct answer.
    Format the response as a valid JSON array of objects with exactly this structure:
    [
      {
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation of why this is correct"
      }
    ]
    Important: Ensure the correctAnswer is the 0-based index (0-3) of the correct option.
    Make questions challenging but clear, and ensure answers are factually correct.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional exam question generator. Create clear, accurate, and well-structured questions."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Failed to generate questions');
    }

    // Parse and validate the response
    let questions: Question[];
    try {
      questions = JSON.parse(response);
      
      // Validate the structure
      if (!Array.isArray(questions) || questions.length !== numQuestions) {
        throw new Error('Invalid questions format');
      }

      questions.forEach((q, i) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.correctAnswer !== 'number' || !q.explanation) {
          throw new Error(`Invalid question format at index ${i}`);
        }
      });
    } catch (error) {
      logger.error('Failed to parse OpenAI response:', error);
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