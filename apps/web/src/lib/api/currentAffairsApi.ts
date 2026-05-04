import axios from 'axios';

/**
 * Current Affairs API Response interface from the external endpoint
 */
interface CurrentAffairsQuestion {
  id?: string;
  exam?: string;
  as_of_date?: string;
  category?: string;
  difficulty?: string;
  fact?: string;
  question: string;
  options: string[];
  answer_index?: number;
  answer?: string;
  explanation?: string;
  tags?: string[];
  source?: {
    title?: string;
    url?: string;
    publisher?: string;
    published_on?: string;
  };
}

interface CurrentAffairsResponse {
  total_available?: number;
  returned?: number;
  as_of_date?: string;
  questions: CurrentAffairsQuestion[];
}

/**
 * Normalized Question interface for exam player
 */
export interface NormalizedQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  timeToSolveSeconds: number;
  subject?: string;
}

/**
 * Normalized Quiz Response for exam player
 */
export interface NormalizedQuizResponse {
  message: string;
  test: {
    id: string;
    title: string;
    subject: string;
    difficulty: string;
    numQuestions: number;
    durationMinutes: number;
    questions: NormalizedQuestion[];
  };
}

/**
 * Convert multiple choice letter to the actual option value
 * @param answer The answer from the API (could be "A", "B", "C", "D" or the actual answer text)
 * @param options The options array
 * @returns The normalized answer identifier
 */
function normalizeAnswer(answer: string, options: string[]): string {
  // If answer is already a letter (A, B, C, D), return it
  if (/^[A-D]$/.test(answer)) {
    return answer;
  }

  // Otherwise, find which option matches the answer text
  const index = options.findIndex(opt => opt.toLowerCase() === answer.toLowerCase());
  
  if (index !== -1) {
    return String.fromCharCode(65 + index); // A=65, B=66, C=67, D=68
  }

  // Fallback to first option if not found
  console.warn(`Answer "${answer}" not found in options. Using first option as fallback.`);
  return 'A';
}

function normalizeAnswerFromIndex(answerIndex?: number): string | null {
  if (typeof answerIndex !== 'number' || Number.isNaN(answerIndex)) {
    return null;
  }

  if (answerIndex < 0 || answerIndex > 3) {
    return null;
  }

  return String.fromCharCode(65 + answerIndex);
}

/**
 * Transform Current Affairs API response to normalized quiz format
 * @param data Raw response from Current Affairs API
 * @returns Normalized quiz response ready for exam player
 */
function transformCurrentAffairsResponse(
  data: CurrentAffairsResponse,
  requestedQuestions: number
): NormalizedQuizResponse {
  const numQuestions = Math.min(data.questions.length, requestedQuestions);
  
  const questions: NormalizedQuestion[] = data.questions
    .slice(0, numQuestions)
    .map((q, index) => {
      const options = q.options || [];
      const normalizedAnswer =
        normalizeAnswerFromIndex(q.answer_index) ||
        normalizeAnswer(q.answer || '', options);

      return {
        id: q.id || `ca-${index + 1}`,
        questionText: q.question,
        optionA: options[0] || '',
        optionB: options[1] || '',
        optionC: options[2] || '',
        optionD: options[3] || '',
        correctOption: normalizedAnswer,
        explanation: q.explanation || '',
        timeToSolveSeconds: 60,
        subject: 'Current Affairs',
      };
    });

  if (questions.length === 0) {
    throw new Error('Current Affairs API returned no questions');
  }

  const generatedId = `ca-quick-${Date.now()}`;

  return {
    message: 'Quiz generated successfully',
    test: {
      id: generatedId,
      title: `Current Affairs Quiz`,
      subject: 'Current Affairs',
      difficulty: data.questions[0]?.difficulty || 'moderate',
      numQuestions: questions.length,
      durationMinutes: 8, // 8 minutes for 15 questions (30 seconds per question)
      questions,
    },
  };
}

/**
 * Fetch current affairs quiz from the API
 * @param numQuestions Number of questions to request (default: 15)
 * @returns Normalized quiz response
 */
export async function fetchCurrentAffairsQuiz(numQuestions: number = 15): Promise<NormalizedQuizResponse> {
  const CURRENT_AFFAIRS_API_ENDPOINT =
    import.meta.env.VITE_CURRENT_AFFAIRS_API_ENDPOINT ||
    'https://mock-test-2-6jva.onrender.com/api/v1/questions/generate';
  
  // Generate unique request identifiers to prevent caching and force fresh questions
  const timestamp = Date.now();
  const requestNonce = `${timestamp}-${Math.floor(Math.random() * 1_000_000_000)}`;

  try {
    console.log('Calling Current Affairs API with:', {
      endpoint: CURRENT_AFFAIRS_API_ENDPOINT,
      requestNonce,
      count: numQuestions,
    });

    const response = await axios.get<CurrentAffairsResponse>(CURRENT_AFFAIRS_API_ENDPOINT, {
      timeout: 240000, // 240 second timeout
      params: {
        count: numQuestions,
        _: requestNonce, // Cache buster
        t: timestamp, // Additional timestamp param
      },
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    const normalized = transformCurrentAffairsResponse(response.data, numQuestions);
    console.log('Current Affairs API Response (normalized):', normalized);
    return normalized;
  } catch (error: any) {
    console.error('Current Affairs API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}
