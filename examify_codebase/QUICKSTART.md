# Firebase Functions Quick Start Guide

This guide will help you get started with the Firebase Functions for the Exam Platform.

## Prerequisites

- Node.js 20.x or later
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project created on the [Firebase Console](https://console.firebase.google.com/)

## Setup Instructions

### Option 1: Using the setup script (Recommended)

1. Run the setup script appropriate for your OS:

   **Windows (PowerShell):**
   ```powershell
   .\setup.ps1
   ```

   **Linux/macOS (Bash):**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. Update the `.env` files with your actual API keys.

### Option 2: Manual setup

1. Install dependencies in the functions directory:
   ```
   cd firebase/functions
   npm install
   ```

2. Create a `.env` file in the `firebase/functions` directory with:
   ```
   OPENAI_API_KEY=your-openai-api-key
   GCS_BUCKET=your-project-id.appspot.com
   PDF_QUALITY=90
   PDF_PAGE_SIZE=A4
   SENTIMENT_ANALYSIS_ENABLED=false
   ```

3. Build the TypeScript code:
   ```
   npm run build
   ```

## Development Workflow

1. Run functions locally:
   ```
   npm run serve
   ```

2. Deploy functions to Firebase:
   ```
   npm run deploy
   ```

## Available Firebase Functions

### Callable Functions (Client SDK)

- `generateExamPaper`: Generate AI-powered exam papers
- `scoreExamAttempt`: Score and analyze exam attempts
- `analyzeExamAttempt`: Generate detailed performance insights
- `generateAttemptReport`: Create PDF reports
- `getFileUploadUrl`: Generate signed URLs for file uploads
- `submitFeedback`: Process user feedback with sentiment analysis
- `seedInitialData`: (Admin only) Seed initial data for testing

### Scheduled Jobs

- `dailyQuizScheduler`: Generates daily quiz questions (runs at midnight IST)

### Firestore Triggers

- `leaderboardUpdater`: Updates leaderboards when attempts are submitted

## Troubleshooting

If you encounter any issues:

1. Check the Firebase Functions logs:
   ```
   firebase functions:log
   ```

2. Make sure your environment variables are set correctly in the Firebase console or `.env` file.

3. Verify that you have the required API permissions for OpenAI and Firebase services.

## Modifying Functions

1. Make your changes in the relevant files under `src/`
2. Rebuild with `npm run build`
3. Test locally with `npm run serve`
4. Deploy with `npm run deploy`

## Type Synchronization

To sync Firebase Function types with the frontend:
```
npm run sync-types
```
This will update `apps/web/src/types/firebase-schema.ts` with the latest types.