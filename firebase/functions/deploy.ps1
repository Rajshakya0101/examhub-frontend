# Deploy Firebase Functions Script (PowerShell)
# This script helps deploy your Firebase Functions with proper configuration

Write-Host "🚀 Firebase Functions Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the firebase/functions directory." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found." -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please edit it with your API keys before deploying." -ForegroundColor Green
    Write-Host ""
    $response = Read-Host "Press Enter to open .env file for editing (or Ctrl+C to cancel)"
    notepad .env
}

# Check for Gemini or OpenAI API key
$envContent = Get-Content ".env" -Raw
if ($envContent -match "your-gemini-api-key" -and $envContent -match "your-openai-api-key") {
    Write-Host "❌ Error: Neither Gemini nor OpenAI API key configured in .env file." -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "✨ Recommended: Use FREE Gemini API" -ForegroundColor Cyan
    Write-Host "   Get your free key at: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
    Write-Host "   Then set GEMINI_API_KEY in .env file" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Cyan
    Write-Host "📖 For detailed setup guide, see GEMINI_SETUP.md" -ForegroundColor Yellow
    exit 1
}

if ($envContent -match "GEMINI_API_KEY=\w+" -and $envContent -notmatch "your-gemini-api-key") {
    Write-Host "✅ Using FREE Google Gemini API (Recommended)" -ForegroundColor Green
} elseif ($envContent -match "OPENAI_API_KEY=\w+" -and $envContent -notmatch "your-openai-api-key") {
    Write-Host "ℹ️ Using OpenAI API (Paid service)" -ForegroundColor Yellow
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "🔨 Building TypeScript..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Ask which functions to deploy
Write-Host "Select deployment option:" -ForegroundColor Cyan
Write-Host "1) Deploy all functions"
Write-Host "2) Deploy only AI functions (generateQuestions, generateGuestQuiz)"
Write-Host "3) Deploy specific function"
Write-Host ""
$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying all functions..." -ForegroundColor Cyan
        firebase deploy --only functions
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying AI functions..." -ForegroundColor Cyan
        firebase deploy --only functions:generateQuestions,functions:generateGuestQuiz,functions:generateExamPaper
    }
    "3" {
        Write-Host ""
        Write-Host "Available functions:" -ForegroundColor Cyan
        Write-Host "- generateQuestions"
        Write-Host "- generateGuestQuiz"
        Write-Host "- generateExamPaper"
        Write-Host "- scoreExamAttempt"
        Write-Host "- analyzeExamAttempt"
        Write-Host ""
        $functionName = Read-Host "Enter function name"
        Write-Host ""
        Write-Host "🚀 Deploying $functionName..." -ForegroundColor Cyan
        firebase deploy --only functions:$functionName
    }
    default {
        Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Cyan
    Write-Host "   firebase functions:log"
    Write-Host ""
    Write-Host "🔍 Test your functions:" -ForegroundColor Cyan
    Write-Host "   - Open your app and try creating a test"
    Write-Host "   - Check Firebase Console for function invocations"
    Write-Host "   - Monitor OpenAI API usage at https://platform.openai.com/usage"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
