# Exam Platform Firebase Functions

This directory contains the Firebase Functions for the Exam Platform application. These serverless functions power the backend logic for exam generation, scoring, and analysis.

## Available Functions

### HTTP Callable Functions

- **generateExamPaper**: Generates AI-powered exam papers with customizable topics and difficulty
- **scoreExamAttempt**: Scores completed exam attempts and calculates detailed analytics
- **generateAttemptReport**: Creates PDF reports for exam attempts with visualizations

### Scheduled Functions

- **dailyQuizScheduler**: Generates the daily quiz every day at midnight (IST)

### Firestore Triggers

- **leaderboardUpdater**: Updates leaderboards when a new attempt is submitted

## Project Structure

- `/src/index.ts`: Main entry point that exports all functions
- `/src/exams/`: Exam generation and scoring functionality
- `/src/jobs/`: Scheduled jobs like daily quiz generation
- `/src/reports/`: PDF report generation
- `/src/analytics/`: Leaderboard and analytics functions
- `/src/services/`: External services (OpenAI, Pinecone)
- `/src/utils/`: Shared utility functions
- `/src/shared/`: Shared types and schemas

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

3. Run locally with Firebase emulators:

```bash
npm run serve
```

4. Deploy to Firebase:

```bash
npm run deploy
```

## Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: API key for OpenAI (required for question generation)
- `GCS_BUCKET`: Google Cloud Storage bucket name (default: your-project-id.appspot.com)

Optional variables:

- `PINECONE_API_KEY`: API key for Pinecone vector database
- `PINECONE_ENVIRONMENT`: Pinecone environment name
- `PINECONE_INDEX`: Pinecone index name
- `PDF_QUALITY`: PDF quality setting (default: 100)
- `PDF_PAGE_SIZE`: PDF page size (default: A4)
- `SENTIMENT_ANALYSIS_ENABLED`: Enable sentiment analysis for feedback (default: false)

## Development Workflow

1. Make changes to the functions
2. Build the project with `npm run build`
3. Test locally with `npm run serve`
4. Deploy with `npm run deploy`

## Documentation

For more information on Firebase Functions, see the [official documentation](https://firebase.google.com/docs/functions).