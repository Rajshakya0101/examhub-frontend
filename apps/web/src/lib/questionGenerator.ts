import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { Question } from './models';

// Define the prompt template for generating questions
const QUESTION_PROMPT_TEMPLATE = `
Generate {{count}} multiple-choice questions about {{topic}} at a {{difficulty}} level for {{examType}} exam preparation.

For each question, provide:
1. A clear stem/question
2. Four options (A, B, C, D)
3. The correct answer index (0-based)
4. A brief explanation for the correct answer

Each question should test a different concept within the topic.
`;

// Types for question generation
export interface QuestionGenerationRequest {
  topic: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  examType: string;
}

export interface QuestionGenerationResponse {
  questions: Question[];
  promptUsed: string;
  tokensUsed: number;
}

/**
 * Generates questions using AI (via Firebase Functions)
 * @param params Question generation parameters
 * @returns Promise with generated questions
 */
export async function generateAIQuestions(params: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  try {
    // Call the Firebase function
    const generateQuestions = httpsCallable<QuestionGenerationRequest, QuestionGenerationResponse>(
      functions, 
      'generateQuestions'
    );
    
    const result = await generateQuestions(params);
    return result.data;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please try again later.');
  }
}

/**
 * Formats the generation prompt with the provided parameters
 * @param params Parameters to include in the prompt
 * @returns Formatted prompt string
 */
export function formatGenerationPrompt(params: QuestionGenerationRequest): string {
  let prompt = QUESTION_PROMPT_TEMPLATE;
  
  // Replace placeholders with actual values
  prompt = prompt.replace('{{count}}', params.count.toString());
  prompt = prompt.replace('{{topic}}', params.topic);
  prompt = prompt.replace('{{difficulty}}', params.difficulty);
  prompt = prompt.replace('{{examType}}', params.examType);
  
  return prompt;
}

/**
 * Estimates the number of tokens that will be used for a given prompt
 * This is a very rough estimate (4 chars ~= 1 token)
 * @param prompt The prompt text
 * @returns Estimated token count
 */
export function estimateTokenCount(prompt: string): number {
  return Math.ceil(prompt.length / 4);
}

/**
 * Validates a generated question for completeness
 * @param question The question to validate
 * @returns True if the question is valid
 */
export function isValidQuestion(question: Partial<Question>): boolean {
  return !!(
    question.stem &&
    question.options &&
    question.options.length >= 2 &&
    typeof question.correctIndex === 'number' &&
    question.correctIndex >= 0 &&
    question.correctIndex < question.options.length
  );
}