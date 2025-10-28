# Setup script for Firebase Functions (PowerShell version)

Write-Host "Setting up Firebase Functions and Web App..." -ForegroundColor Green

# Step 1: Install Node.js dependencies for functions
Write-Host "Installing Firebase Functions dependencies..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\firebase\functions"
npm install --no-optional

# Step 2: Build the TypeScript code
Write-Host "Building Firebase Functions..." -ForegroundColor Cyan
npm run build

# Step 3: Setup the web app
Write-Host "Installing Web App dependencies..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\apps\web"
npm install --legacy-peer-deps

# Step 4: Create basic .env files
Write-Host "Creating environment files..." -ForegroundColor Cyan

# Create Firebase Functions .env
$functionsEnv = @"
# OpenAI API Key for AI question generation
OPENAI_API_KEY=sk-dummy-key-replace-with-real-one

# Google Cloud Storage settings
GCS_BUCKET=exam-platform.appspot.com

# PDF report generation settings
PDF_QUALITY=90
PDF_PAGE_SIZE=A4

# Optional: Sentiment analysis for user feedback
SENTIMENT_ANALYSIS_ENABLED=false
"@

Set-Content -Path "$PSScriptRoot\firebase\functions\.env" -Value $functionsEnv

# Create web app .env
$webEnv = @"
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_SENTRY_DSN=your-sentry-dsn
"@

Set-Content -Path "$PSScriptRoot\apps\web\.env" -Value $webEnv

Write-Host "`nSetup complete! Don't forget to update the .env files with your real API keys." -ForegroundColor Green