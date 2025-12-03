#!/bin/bash

# Deploy Firebase Functions Script
# This script helps deploy your Firebase Functions with proper configuration

echo "🚀 Firebase Functions Deployment Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the firebase/functions directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found."
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your API keys before deploying."
    echo ""
    read -p "Press Enter to open .env file for editing (or Ctrl+C to cancel)..."
    ${EDITOR:-nano} .env
fi

# Check for Gemini or OpenAI API key
if grep -q "your-gemini-api-key" .env && grep -q "your-openai-api-key" .env; then
    echo "❌ Error: Neither Gemini nor OpenAI API key configured in .env file."
    echo ""
    echo "✨ Recommended: Use FREE Gemini API"
    echo "   Get your free key at: https://makersuite.google.com/app/apikey"
    echo "   Then set GEMINI_API_KEY in .env file"
    echo ""
    echo "📖 For detailed setup guide, see GEMINI_SETUP.md"
    exit 1
fi

if grep -qE "GEMINI_API_KEY=\w+" .env && ! grep -q "your-gemini-api-key" .env; then
    echo "✅ Using FREE Google Gemini API (Recommended)"
elif grep -qE "OPENAI_API_KEY=\w+" .env && ! grep -q "your-openai-api-key" .env; then
    echo "ℹ️ Using OpenAI API (Paid service)"
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Ask which functions to deploy
echo "Select deployment option:"
echo "1) Deploy all functions"
echo "2) Deploy only AI functions (generateQuestions, generateGuestQuiz)"
echo "3) Deploy specific function"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying all functions..."
        firebase deploy --only functions
        ;;
    2)
        echo ""
        echo "🚀 Deploying AI functions..."
        firebase deploy --only functions:generateQuestions,functions:generateGuestQuiz,functions:generateExamPaper
        ;;
    3)
        echo ""
        echo "Available functions:"
        echo "- generateQuestions"
        echo "- generateGuestQuiz"
        echo "- generateExamPaper"
        echo "- scoreExamAttempt"
        echo "- analyzeExamAttempt"
        echo ""
        read -p "Enter function name: " function_name
        echo ""
        echo "🚀 Deploying $function_name..."
        firebase deploy --only functions:$function_name
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 View logs:"
    echo "   firebase functions:log"
    echo ""
    echo "🔍 Test your functions:"
    echo "   - Open your app and try creating a test"
    echo "   - Check Firebase Console for function invocations"
    echo "   - Monitor OpenAI API usage at https://platform.openai.com/usage"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
