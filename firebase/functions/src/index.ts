import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { generateDailyQuiz } from './jobs/generateDailyQuiz';
import { generatePaper } from './exams/generatePaper';
import { generateQuiz } from './exams/generateQuiz';
import { generateQuestionsByTopic } from './exams/generateQuestions';
// Import scoreAttempt directly using require to bypass TypeScript path resolution issues
const { scoreAttempt } = require('./exams/scoreAttempt');
import { generatePDF } from './reports/generatePDF';
import { updateLeaderboards } from './analytics/updateLeaderboards';
import { analyzeAttempt } from './analytics/analyzeAttempt';
import { recalculateAllLeaderboards } from './analytics/recalculateLeaderboards';
import { aggregateDailyStats } from './analytics/aggregateDailyStats';
import { generateUploadUrl } from './storage/generateUploadUrl';
import { seedData } from './admin/seedData';
import { processFeedback } from './feedback/processFeedback';
import { generateExternalQuiz } from './quiz/generateExternalQuiz';

// Default region for better latency in India
const DEFAULT_REGION = 'asia-south1';

// Callable Functions

/**
 * Generate a quick practice quiz with AI-powered questions
 */
export const generateGuestQuiz = onCall({
  memory: '1GiB',
  timeoutSeconds: 120,
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com']
}, generateQuiz);

/**
 * Generate a mock exam paper with AI-powered questions
 */
export const generateExamPaper = onCall({
  memory: '1GiB',
  timeoutSeconds: 120,
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com']
}, generatePaper);

/**
 * Generate questions for a specific topic with AI
 */
export const generateQuestions = onCall({
  memory: '1GiB',
  timeoutSeconds: 120,
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com']
}, generateQuestionsByTopic);

/**
 * Score an exam attempt and calculate analytics
 */
export const scoreExamAttempt = onCall({
  memory: '512MiB',
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com']
}, scoreAttempt);

/**
 * Generate PDF report for an exam attempt
 */
export const generateAttemptReport = onCall({
  memory: '1GiB',
  timeoutSeconds: 120,
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com']
}, generatePDF);

/**
 * Analyze an exam attempt and provide detailed insights
 */
export const analyzeExamAttempt = onCall({
  memory: '512MiB',
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com'],
}, analyzeAttempt);

/**
 * Generate a signed URL for secure file uploads
 */
export const getFileUploadUrl = onCall({
  memory: '256MiB',
  region: DEFAULT_REGION,
}, generateUploadUrl);

/**
 * Seed initial data for testing (admin only)
 */
export const seedInitialData = onCall({
  memory: '512MiB',
  timeoutSeconds: 300, // 5 minutes
  region: DEFAULT_REGION,
}, seedData);

/**
 * Process user feedback with sentiment analysis
 */
export const submitFeedback = onCall({
  memory: '256MiB',
  region: DEFAULT_REGION,
}, processFeedback);

/**
 * Proxy for external quiz API to avoid CORS issues
 */
export const proxyExternalQuiz = onCall({
  memory: '512MiB',
  timeoutSeconds: 120,
  region: DEFAULT_REGION,
  cors: ['http://localhost:3000', 'https://your-production-domain.com'],
}, generateExternalQuiz);

// Scheduled Jobs

/**
 * Generate the daily quiz questions
 * Runs every day at midnight
 */
export const dailyQuizScheduler = onSchedule({
  schedule: '0 0 * * *', // every day at midnight
  timeZone: 'Asia/Kolkata',
  memory: '1GiB',
  region: DEFAULT_REGION,
}, async (event) => {
  try {
    // Pass event as any to bridge the type incompatibility
    await generateDailyQuiz(event as any);
    logger.info('Daily quiz generation completed successfully');
  } catch (error) {
    logger.error('Daily quiz generation failed:', error);
  }
});

/**
 * Recalculate leaderboard rankings and percentiles
 * Runs every hour to keep rankings fresh
 */
export const leaderboardRecalculation = onSchedule({
  schedule: '0 * * * *', // every hour at minute 0
  timeZone: 'Asia/Kolkata',
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes
  region: DEFAULT_REGION,
}, async (event) => {
  try {
    await recalculateAllLeaderboards();
    logger.info('Leaderboard recalculation completed successfully');
  } catch (error) {
    logger.error('Leaderboard recalculation failed:', error);
  }
});

/**
 * Aggregate daily stats and generate summaries
 * Runs every day at 1:00 AM to process previous day's data
 */
export const dailyStatsAggregation = onSchedule({
  schedule: '0 1 * * *', // every day at 1:00 AM
  timeZone: 'Asia/Kolkata',
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes
  region: DEFAULT_REGION,
}, async (event) => {
  try {
    await aggregateDailyStats();
    logger.info('Daily stats aggregation completed successfully');
  } catch (error) {
    logger.error('Daily stats aggregation failed:', error);
  }
});

// Firestore Triggers

/**
 * Update leaderboards when a new attempt is submitted
 */
export const leaderboardUpdater = onDocumentWritten({
  document: 'attempts/{attemptId}',
  region: DEFAULT_REGION,
  memory: '512MiB',
  minInstances: 0,
  maxInstances: 10,
}, async (event) => {
  try {
    // Skip if there's no data
    if (!event.data) {
      logger.warn('No data available in event, skipping leaderboard update');
      return;
    }
    
    // Convert event data to expected format for the handler
    // Use 'as any' to bridge the type incompatibility
    const change = {
      before: event.data.before,
      after: event.data.after
    };
    
    await updateLeaderboards(change as any, event.params as any);
    logger.info(`Updated leaderboards for attempt: ${event.params?.attemptId}`);
  } catch (error) {
    logger.error(`Failed to update leaderboards: ${error}`);
  }
});

// Debug helper for local development
export const helloWorld = functions.https.onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});