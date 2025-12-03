import { GoogleGenerativeAI } from '@google/generative-ai';
import * as functions from 'firebase-functions/v2';
import { config } from '../utils/config';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Question generation system prompt
const QUESTION_SYSTEM_PROMPT = `
You are an expert educational assessment creator specializing in competitive exams.
Create high-quality, challenging multiple-choice questions that assess understanding of key concepts.

Your questions should:
- Be precisely formatted in JSON
- Be challenging yet fair
- Include detailed explanations of the correct answer
- Cover the requested topic thoroughly
- Use appropriate terminology for the exam level
`;

/**
 * Generate questions using Google Gemini
 * 
 * @param examId The ID of the exam (e.g., "upsc", "ssc", "banking")
 * @param topic The specific topic to generate questions for
 * @param count The number of questions to generate
 * @param difficulty The difficulty level (easy, medium, hard)
 */
export async function generateQuestions(
  examId: string,
  topic: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<any[]> {
  try {
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

    // Create the specific prompt for the requested questions
    const prompt = `
${QUESTION_SYSTEM_PROMPT}

Generate ${count} multiple-choice questions for ${examId} exam on the topic of "${topic}" at ${difficulty} difficulty level.

Requirements:
- Each question must have exactly 4 answer options
- One and only one option must be correct
- Include a detailed explanation for the correct answer
- Question must be challenging but fair for ${examId} exam standard

Return ONLY a JSON object with a "questions" array containing objects with this exact structure:
{
  "questions": [
    {
      "examId": "${examId}",
      "topic": "${topic}",
      "type": "mcq",
      "stem": "Question text goes here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation why Option A is correct",
      "difficulty": "${difficulty}",
      "tags": ["subtopic1", "subtopic2"]
    }
  ]
}
`;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(text);
      const questions = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.questions || [];
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions generated');
      }
      
      functions.logger.info(`Successfully generated ${questions.length} questions using Gemini`);
      return questions;
    } catch (error) {
      functions.logger.error('Failed to parse Gemini response', text);
      throw new Error('Invalid response format from AI service');
    }

  } catch (error) {
    functions.logger.error('Gemini API error:', error);
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate explanation for a question using Gemini
 */
export async function generateExplanation(
  question: string,
  options: string[],
  correctAnswer: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    const prompt = `
You are an expert educator providing clear, concise explanations for exam questions.

Provide a detailed explanation for the following question:

Question: ${question}

Options:
${options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}

Correct Answer: ${correctAnswer}

Explain why this answer is correct and why the other options are incorrect.
Include relevant concepts, formulas, or rules that apply to this problem.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || 'No explanation available.';
  } catch (error) {
    functions.logger.error('Gemini explanation error:', error);
    return 'Failed to generate explanation. Please try again later.';
  }
}
