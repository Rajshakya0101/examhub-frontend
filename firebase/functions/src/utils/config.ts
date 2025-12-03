import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
// In production, __dirname is lib/utils, so we need to go up two levels to reach the root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Export environment variables for use in other files
export const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || '',
    index: process.env.PINECONE_INDEX || '',
  },
  pdf: {
    quality: parseInt(process.env.PDF_QUALITY || '100', 10),
    pageSize: process.env.PDF_PAGE_SIZE || 'A4',
  },
  storage: {
    bucket: process.env.GCS_BUCKET || '',
  },
  features: {
    sentimentAnalysis: process.env.SENTIMENT_ANALYSIS_ENABLED === 'true',
  },
};

// Validate required configuration
function validateConfig() {
  if (!config.gemini.apiKey && !config.openai.apiKey) {
    console.warn('⚠️ Neither GEMINI_API_KEY nor OPENAI_API_KEY is set. AI question generation will fail.');
  }
  if (config.gemini.apiKey) {
    console.log('✅ Using Google Gemini for AI generation (Free tier available)');
  } else if (config.openai.apiKey) {
    console.log('ℹ️ Using OpenAI for AI generation (Paid service)');
  }
}

// Run validation at startup
validateConfig();