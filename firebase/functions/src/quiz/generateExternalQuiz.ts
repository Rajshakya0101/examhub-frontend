import { https } from 'firebase-functions/v2';
import axios from 'axios';

interface QuizRequest {
  subject: string;
  difficulty: string;
  numQuestions: number;
}

/**
 * Proxy endpoint for external quiz API to avoid CORS issues
 * This function calls the external API from the server-side
 */
export async function generateExternalQuiz(request: https.CallableRequest<QuizRequest>) {
  const { subject, difficulty, numQuestions } = request.data;

  // Validate input
  if (!subject || !difficulty || !numQuestions) {
    throw new https.HttpsError(
      'invalid-argument',
      'Subject, difficulty, and numQuestions are required'
    );
  }

  try {
    // Call the external API from server-side (no CORS issues)
    const response = await axios.post(
      'https://examhub-2.onrender.com/api/v2/generate-quiz',
      {
        subject,
        difficulty,
        numQuestions,
      },
      {
        timeout: 150000, // 150 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error calling external quiz API:', error.response?.data || error.message);

    throw new https.HttpsError(
      'internal',
      error.response?.data?.message || 'Failed to generate quiz from external API',
      { 
        status: error.response?.status,
        details: error.response?.data 
      }
    );
  }
}
