# AI Test Generation Integration Setup

This guide will help you set up the AI-powered test generation feature in your exam platform.

## Prerequisites

1. OpenAI API Key
2. Firebase Functions deployed
3. Firebase Firestore configured

## Step 1: Configure OpenAI API Key

### Backend Configuration (Firebase Functions)

1. Navigate to your Firebase Functions directory:
```bash
cd firebase/functions
```

2. Create or update the `.env` file:
```bash
# Copy the example file
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. Update `src/utils/config.ts` if needed to ensure it's reading the API key:
```typescript
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
};
```

## Step 2: Deploy Firebase Functions

Deploy the updated functions to Firebase:

```bash
cd firebase/functions
npm run build
firebase deploy --only functions
```

This will deploy:
- `generateQuestions` - Generate questions by topic
- `generateGuestQuiz` - Generate quick practice quizzes
- `generateExamPaper` - Generate full exam papers

## Step 3: Configure Firebase Security Rules

Update your Firestore security rules to allow reading/writing tests and questions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tests collection
    match /tests/{testId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Questions collection
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## Step 4: Frontend Configuration

The frontend is already configured to use the AI generation features. No additional setup needed.

## How to Use

### Creating a New Test with AI

1. Navigate to "Create Test" page
2. Select a template (SSC CGL, IBPS PO, etc.)
3. Fill in test details (title, description, difficulty)
4. In the "Configure Sections" step:
   - Click "Generate AI Questions" for each section
   - Select a topic from the dropdown
   - Choose the number of questions (1-20)
   - Click "Generate"
5. Review and create the test

### How It Works

1. **Question Generation**:
   - User selects topic, count, and difficulty
   - Frontend calls `generateQuestions` Cloud Function
   - Function uses OpenAI GPT-4 to generate questions
   - Questions are stored in Firestore with unique IDs
   - Frontend receives question IDs and displays count

2. **Test Creation**:
   - User completes all sections
   - Test document is created in Firestore
   - Test includes references to all generated questions
   - Test appears in the Tests list immediately

3. **Test Display**:
   - Tests page fetches from Firestore
   - Combines AI-generated tests with mock data
   - Users can start tests and view questions

## API Limits and Costs

### OpenAI API Usage

- Model: GPT-4-turbo
- Approximate cost per test (100 questions): $0.50 - $1.00
- Rate limit: 500 requests/minute (varies by tier)

### Recommendations

1. **Cache Questions**: Store generated questions in Firestore
2. **Batch Generation**: Generate multiple questions per API call
3. **Reuse Questions**: Build a question bank to avoid regenerating
4. **Set Limits**: Limit questions per user per day

## Monitoring

### Check Firebase Functions Logs

```bash
firebase functions:log
```

### Monitor OpenAI Usage

Visit: https://platform.openai.com/usage

## Troubleshooting

### Issue: "Failed to generate questions"

**Solutions**:
1. Check OpenAI API key is set correctly
2. Verify API key has sufficient credits
3. Check Firebase Functions logs for detailed errors
4. Ensure functions are deployed: `firebase deploy --only functions`

### Issue: Questions not appearing in test

**Solutions**:
1. Check Firestore rules allow read/write
2. Verify questions were saved to Firestore
3. Check browser console for errors
4. Verify user is authenticated

### Issue: "Invalid response from AI service"

**Solutions**:
1. OpenAI API may have returned unexpected format
2. Check Firebase Functions logs for the exact response
3. Try reducing the number of questions
4. Try a different topic or difficulty level

## Advanced Configuration

### Customize Question Format

Edit `firebase/functions/src/services/openai.ts`:

```typescript
const prompt = `
Generate ${count} multiple choice questions for ${examId} exam on "${topic}".

// Customize your prompt here
Requirements:
- Add specific instructions
- Change difficulty parameters
- Adjust question format
`;
```

### Add New Exam Types

1. Add template in `apps/web/src/routes/CreateTest.tsx`:
```typescript
const examTemplates = [
  {
    id: 'your-exam',
    name: 'Your Exam Name',
    description: 'Description',
    sections: [...],
    duration: 60,
    totalQuestions: 100,
  },
];
```

2. Add topics for sections:
```typescript
const topicsBySection: Record<string, string[]> = {
  'Your Section': ['Topic 1', 'Topic 2', ...],
};
```

## Security Best Practices

1. **Never expose OpenAI API key** in frontend code
2. **Use Firebase Functions** for all AI API calls
3. **Implement rate limiting** to prevent abuse
4. **Validate user input** before generating questions
5. **Monitor API usage** regularly

## Next Steps

1. Test the integration with a small number of questions
2. Monitor costs and adjust usage as needed
3. Build up a question bank to reduce API calls
4. Implement caching strategies
5. Add analytics to track question quality

## Support

For issues or questions:
- Check Firebase Functions logs
- Review OpenAI API documentation
- Check Firestore security rules
- Verify environment variables are set

Happy testing! 🎉
