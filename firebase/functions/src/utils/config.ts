import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Export environment variables for use in other files
export const config = {
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
  if (!config.openai.apiKey) {
    console.warn('⚠️ OPENAI_API_KEY is not set. AI question generation will fail.');
  }
}

// Run validation at startup
validateConfig();