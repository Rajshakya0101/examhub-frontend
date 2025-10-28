import { CallableRequest } from 'firebase-functions/v2/https';
import { db, handleError, validateAuth } from '../utils/firebase';
import { config } from '../utils/config';
import { openai } from '../services/openai';
import * as logger from 'firebase-functions/logger';

interface SubmitFeedbackRequest {
  rating: number;
  text: string;
  category: string;
  attemptId?: string;
  examId?: string;
}

/**
 * Function to process user feedback with sentiment analysis
 */
export async function processFeedback(request: CallableRequest<SubmitFeedbackRequest>) {
  try {
    // Validate authentication
    const uid = validateAuth(request.auth || {});
    
    // Get request data
    const { rating, text, category, attemptId, examId } = request.data;
    
    if (rating === undefined || !text || !category) {
      throw new Error('Rating, text and category are required');
    }
    
    // Prepare feedback document
    const feedbackData: Record<string, any> = {
      userId: uid,
      rating,
      text,
      category,
      createdAt: new Date()
    };
    
    // Add optional fields if provided
    if (attemptId) {
      feedbackData.attemptId = attemptId;
    }
    
    if (examId) {
      feedbackData.examId = examId;
    }
    
    // Perform sentiment analysis if enabled
    if (config.features.sentimentAnalysis && text.length > 5) {
      try {
        const sentiment = await analyzeSentiment(text);
        feedbackData.sentiment = sentiment;
      } catch (error) {
        logger.warn('Sentiment analysis failed:', error);
        // Continue even if sentiment analysis fails
      }
    }
    
    // Store feedback in Firestore
    const feedbackRef = db.collection('feedback').doc();
    await feedbackRef.set(feedbackData);
    
    // If feedback is a bug report with low rating, create an issue
    if (category === 'bug' && rating <= 2) {
      await createIssueFromFeedback(feedbackData);
    }
    
    return {
      success: true,
      feedbackId: feedbackRef.id
    };
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Analyze sentiment of text using OpenAI
 */
async function analyzeSentiment(text: string): Promise<{
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `
            You are a sentiment analysis system that analyzes user feedback.
            Return a JSON object with:
            1. score: a number from -1 to 1 (negative to positive)
            2. label: one of "positive", "neutral", or "negative"
            3. keywords: an array of up to 5 important keywords from the text
            Do not include any explanation, just return the JSON object.
          `
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    
    const responseText = response.choices[0].message.content || '';
    const sentimentData = JSON.parse(responseText);
    
    return {
      score: sentimentData.score,
      label: sentimentData.label,
      keywords: sentimentData.keywords || []
    };
  } catch (error) {
    logger.error('Sentiment analysis error:', error);
    throw new Error('Sentiment analysis failed');
  }
}

/**
 * Create an issue from negative feedback
 */
async function createIssueFromFeedback(feedback: Record<string, any>): Promise<void> {
  try {
    const issueRef = db.collection('issues').doc();
    
    await issueRef.set({
      title: `Bug Report: ${feedback.text.substring(0, 50)}${feedback.text.length > 50 ? '...' : ''}`,
      description: feedback.text,
      category: feedback.category,
      status: 'new',
      priority: feedback.rating <= 1 ? 'high' : 'medium',
      feedbackId: feedback.id,
      userId: feedback.userId,
      createdAt: new Date(),
      assignedTo: null
    });
    
    logger.info(`Created issue ${issueRef.id} from feedback`);
  } catch (error) {
    logger.error('Error creating issue from feedback:', error);
    // Don't throw - this is a secondary operation
  }
}