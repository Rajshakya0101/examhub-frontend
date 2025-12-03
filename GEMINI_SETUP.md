# 🎉 Google Gemini API Setup Guide (FREE!)

Google Gemini offers a generous **FREE tier** with no credit card required! Perfect for your exam platform.

## ✅ Why Gemini?

- **FREE Tier**: 60 requests per minute, 1500 requests per day (Gemini 1.5 Flash)
- **No Credit Card**: Get started immediately without billing setup
- **High Quality**: Comparable to GPT-4 for question generation
- **Fast**: Low latency responses
- **Generous Limits**: Perfect for development and small-scale production

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your FREE API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Click "Create API Key"
3. Select your Google Cloud project (or create a new one)
4. Copy your API key

**That's it!** No credit card, no billing setup required.

### Step 2: Add to Your Project

1. Navigate to your functions directory:
```bash
cd firebase/functions
```

2. Create `.env` file (if not exists):
```bash
cp .env.example .env
```

3. Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install `@google/generative-ai` package.

### Step 4: Deploy

```bash
npm run build
firebase deploy --only functions
```

**Done!** Your platform now uses FREE Gemini API! 🎉

## 📊 FREE Tier Limits

### Gemini 1.5 Flash (What We Use):
- **RPM (Requests Per Minute)**: 15 (free tier)
- **RPD (Requests Per Day)**: 1,500 (free tier)
- **TPM (Tokens Per Minute)**: 1 million (free tier)

### What This Means:
- **~1,500 test generations per day** (FREE!)
- **15 tests can be created per minute**
- More than enough for development and small-scale production

### Paid Tier (If Needed Later):
- **$0.075 per 1M input tokens**
- **$0.30 per 1M output tokens**
- Still **20x cheaper** than GPT-4!

## 🆚 Comparison: Gemini vs OpenAI

| Feature | Gemini 1.5 Flash (FREE) | GPT-4 Turbo (PAID) |
|---------|------------------------|-------------------|
| **Cost** | FREE (1,500 req/day) | $0.01-0.03 per 1K tokens |
| **Speed** | Fast | Fast |
| **Quality** | Excellent | Excellent |
| **Context** | 1M tokens | 128K tokens |
| **Free Tier** | ✅ Yes | ❌ No |
| **Setup** | No credit card | Credit card required |

## 🎯 Usage Examples

### 100-Question Test:
- **Gemini (FREE)**: $0.00
- **GPT-4**: $0.50-1.00

### 1,000 Questions/Month:
- **Gemini (FREE)**: $0.00
- **GPT-4**: $5-10

### 10,000 Questions/Month:
- **Gemini (Paid)**: ~$0.50
- **GPT-4**: $50-100

## 🔧 What's Been Updated

All backend functions now use Gemini:

1. **generateQuestions** - Topic-based question generation
2. **generateGuestQuiz** - Quick practice quizzes
3. **generateExamPaper** - Full exam papers
4. **generateExplanation** - Detailed answer explanations

## ✅ Verification

After deployment, test your setup:

1. Open your app
2. Go to "Create Test"
3. Select a template
4. Click "Generate AI Questions"
5. Select topic and count
6. Click "Generate"

Check Firebase Functions logs:
```bash
firebase functions:log
```

You should see: "✅ Using Google Gemini for AI generation (Free tier available)"

## 📈 Monitoring Usage

Monitor your Gemini API usage:
- Visit: https://aistudio.google.com/app/apikey
- Click on your API key
- View usage statistics

Set up alerts if you approach limits (optional).

## 🔒 Security Best Practices

1. **Never expose API key** in frontend code (already secured in functions)
2. **Use environment variables** (already configured)
3. **Monitor usage** regularly
4. **Rotate keys** periodically (good practice)

## 🚨 Troubleshooting

### "GEMINI_API_KEY is not set"
- Check `.env` file exists in `firebase/functions/`
- Verify API key is on new line without quotes
- Run `npm run build` and redeploy

### "Failed to generate questions"
- Check API key is valid at https://aistudio.google.com
- Verify free tier limits not exceeded
- Check Firebase Functions logs: `firebase functions:log`

### Rate Limit Errors
- Free tier: 15 requests/minute, 1,500/day
- Implement retry logic (already built-in)
- Consider caching questions (recommended)

## 🎓 Best Practices

1. **Cache Questions**: Store generated questions in Firestore to avoid regeneration
2. **Batch Generation**: Generate multiple questions per request (already implemented)
3. **Reuse Questions**: Build a question bank over time
4. **Monitor Usage**: Check daily usage to stay within free tier

## 📚 Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **API Dashboard**: https://aistudio.google.com
- **Support**: https://ai.google.dev/support

## 💡 Pro Tips

1. **Stay in Free Tier**: 
   - Generate questions in bulk (5-20 at a time)
   - Cache frequently used questions
   - Reuse questions across tests

2. **Quality Optimization**:
   - Use specific topics for better questions
   - Adjust temperature (0.7 is optimal)
   - Provide clear context in prompts

3. **Cost Optimization** (if you go paid):
   - Use Gemini 1.5 Flash (cheapest, fastest)
   - Cache responses
   - Implement rate limiting

## 🎉 Success!

You're now using **FREE AI-powered question generation**! 

No credit card, no monthly fees, just free, high-quality exam questions powered by Google Gemini.

---

**Questions?** Check the main `AI_INTEGRATION_SETUP.md` or `IMPLEMENTATION_SUMMARY.md`

**Last Updated**: November 23, 2025
