#!/bin/bash
# Setup script for Firebase Functions

# Step 1: Install Node.js dependencies for functions
echo "Installing Firebase Functions dependencies..."
cd "$(dirname "$0")/firebase/functions"
npm install --no-optional

# Step 2: Build the TypeScript code
echo "Building Firebase Functions..."
npm run build

# Step 3: Setup the web app
echo "Installing Web App dependencies..."
cd "../../apps/web"
npm install --legacy-peer-deps

# Step 4: Create basic .env files
echo "Creating environment files..."

# Create Firebase Functions .env
cat > "$(dirname "$0")/firebase/functions/.env" << EOL
# OpenAI API Key for AI question generation
OPENAI_API_KEY=sk-dummy-key-replace-with-real-one

# Google Cloud Storage settings
GCS_BUCKET=exam-platform.appspot.com

# PDF report generation settings
PDF_QUALITY=90
PDF_PAGE_SIZE=A4

# Optional: Sentiment analysis for user feedback
SENTIMENT_ANALYSIS_ENABLED=false
EOL

# Create web app .env
cat > "$(dirname "$0")/apps/web/.env" << EOL
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_SENTRY_DSN=your-sentry-dsn
EOL

echo "Setup complete! Don't forget to update the .env files with your real API keys."