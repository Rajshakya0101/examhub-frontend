import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import * as functions from 'firebase-functions/v2';
import { config } from '../utils/config';

// Create OpenAI client using config
export const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

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
 * Generate questions using OpenAI
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
    // Create the specific prompt for the requested questions
    const prompt = `
Generate ${count} multiple-choice questions for ${examId} exam on the topic of "${topic}" at ${difficulty} difficulty level.

Requirements:
- Each question must have exactly 4 answer options
- One and only one option must be correct
- Include a detailed explanation for the correct answer
- Question must be challenging but fair for ${examId} exam standard

Return ONLY a JSON array with this structure (DO NOT include any other text):
[
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
  },
  ...more questions
]
`;

    // Prepare the messages for the OpenAI API
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: QUESTION_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(responseContent);
      return Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.questions || [];
    } catch (error) {
      functions.logger.error('Failed to parse OpenAI response', responseContent);
      throw new Error('Invalid response format from AI service');
    }

  } catch (error) {
    functions.logger.error('OpenAI API error:', error);
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate explanation for a question using OpenAI
 */
export async function generateExplanation(
  question: string,
  options: string[],
  correctAnswer: string
): Promise<string> {
  try {
    const prompt = `
Provide a detailed explanation for the following question:

Question: ${question}

Options:
${options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}

Correct Answer: ${correctAnswer}

Explain why this answer is correct and why the other options are incorrect.
Include relevant concepts, formulas, or rules that apply to this problem.
`;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are an expert educator providing clear, concise explanations for exam questions.' },
      { role: 'user', content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices[0].message.content || 'No explanation available.';
  } catch (error) {
    functions.logger.error('OpenAI explanation error:', error);
    return 'Failed to generate explanation. Please try again later.';
  }
}