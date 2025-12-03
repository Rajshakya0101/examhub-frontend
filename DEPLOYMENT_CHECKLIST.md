# AI Test Generation - Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

## ✅ Pre-Deployment Checklist

### 1. OpenAI Configuration
- [ ] Created OpenAI account at https://platform.openai.com
- [ ] Generated API key
- [ ] Added API key to `firebase/functions/.env` file
- [ ] Verified API key has credits available
- [ ] Set up billing alerts (recommended)

### 2. Firebase Setup
- [ ] Firebase project created
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged in to Firebase CLI (`firebase login`)
- [ ] Project initialized in correct directory
- [ ] Firestore database created
- [ ] Firebase Functions enabled
- [ ] Billing account linked (required for external API calls)

### 3. Backend Configuration
- [ ] Navigated to `firebase/functions` directory
- [ ] Ran `npm install` to install dependencies
- [ ] Created `.env` file from `.env.example`
- [ ] Set `OPENAI_API_KEY` in `.env` file
- [ ] Ran `npm run build` successfully
- [ ] No TypeScript errors in build output

### 4. Firestore Security Rules
- [ ] Updated security rules in `firestore.rules`
- [ ] Added rules for `tests` collection
- [ ] Added rules for `questions` collection
- [ ] Deployed rules: `firebase deploy --only firestore:rules`
- [ ] Verified rules in Firebase Console

### 5. Function Deployment
- [ ] Deployed functions: `firebase deploy --only functions` OR
- [ ] Used deployment script: `.\deploy.ps1` (Windows) or `./deploy.sh` (Linux/Mac)
- [ ] All functions deployed successfully:
  - [ ] generateQuestions
  - [ ] generateGuestQuiz
  - [ ] generateExamPaper
- [ ] Checked deployment status in Firebase Console
- [ ] Verified no errors in Functions logs

### 6. Frontend Configuration
- [ ] Navigated to `apps/web` directory
- [ ] Ran `npm install` to install dependencies
- [ ] Created `.env.local` file with Firebase config
- [ ] Verified all Firebase environment variables are set:
  - [ ] VITE_FIREBASE_API_KEY
  - [ ] VITE_FIREBASE_AUTH_DOMAIN
  - [ ] VITE_FIREBASE_PROJECT_ID
  - [ ] VITE_FIREBASE_STORAGE_BUCKET
  - [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
  - [ ] VITE_FIREBASE_APP_ID
- [ ] Started dev server: `npm run dev`
- [ ] App loads without errors

## ✅ Testing Checklist

### 7. Authentication Testing
- [ ] User can sign up
- [ ] User can sign in
- [ ] User stays logged in after page refresh (NOT logged out)
- [ ] User can sign out manually
- [ ] Authentication state persists across tabs

### 8. Test Creation Testing
- [ ] "Create Test" page loads
- [ ] Can select exam template (SSC CGL, IBPS PO, RRB NTPC)
- [ ] Can enter test details
- [ ] Can select difficulty level
- [ ] Can navigate between wizard steps
- [ ] "Configure Sections" step shows all sections

### 9. AI Question Generation Testing
- [ ] Click "Generate AI Questions" button
- [ ] Topic dropdown shows relevant topics
- [ ] Can select number of questions (1-20)
- [ ] Click "Generate" button
- [ ] Loading state shows
- [ ] Success message appears
- [ ] Question count updates (e.g., "10 of 25 questions")
- [ ] Can generate multiple times for same section
- [ ] Question count accumulates correctly

### 10. Test Completion Testing
- [ ] All sections show "Complete" badge when enough questions added
- [ ] Can proceed to "Review & Create" step
- [ ] Review page shows all test details correctly
- [ ] Click "Create Test" button
- [ ] Test creation succeeds
- [ ] Redirected to Tests page
- [ ] New test appears in the list

### 11. Test Display Testing
- [ ] Tests page loads
- [ ] AI-generated test appears in list
- [ ] Test shows correct:
  - [ ] Title
  - [ ] Description
  - [ ] Question count
  - [ ] Duration
  - [ ] Difficulty level
  - [ ] Category
- [ ] Can filter tests by type
- [ ] Can view test details
- [ ] Can start test (button is clickable)

### 12. Error Handling Testing
- [ ] Try generating without selecting topic → Shows error
- [ ] Try creating test without questions → Shows error
- [ ] Network error during generation → Shows error message
- [ ] Invalid API key → Shows appropriate error
- [ ] Rate limit exceeded → Shows error message

## ✅ Production Readiness Checklist

### 13. Security Verification
- [ ] API key NOT visible in browser dev tools
- [ ] API key NOT in any frontend code
- [ ] API key NOT committed to Git
- [ ] Firestore rules tested and working
- [ ] User authentication required for all operations
- [ ] User can only access their own tests
- [ ] Environment variables secured

### 14. Performance Optimization
- [ ] Questions cached in Firestore (not regenerated unnecessarily)
- [ ] Test list loads quickly
- [ ] Question generation completes within reasonable time (<30 seconds)
- [ ] No memory leaks in frontend
- [ ] Functions have appropriate timeout settings

### 15. Monitoring Setup
- [ ] Firebase Functions logs accessible
- [ ] OpenAI API usage dashboard accessible
- [ ] Firestore usage monitoring enabled
- [ ] Error reporting configured (Sentry/similar)
- [ ] Analytics tracking working

### 16. Cost Management
- [ ] Set up OpenAI usage alerts
- [ ] Set up Firebase budget alerts
- [ ] Implemented rate limiting if needed
- [ ] Documented expected costs per test
- [ ] Plan for question reuse/caching

### 17. Documentation
- [ ] Read `AI_INTEGRATION_SETUP.md`
- [ ] Read `IMPLEMENTATION_SUMMARY.md`
- [ ] Deployment process documented
- [ ] Troubleshooting guide reviewed
- [ ] Team members trained (if applicable)

## ✅ Post-Deployment Checklist

### 18. First Production Test
- [ ] Create a real test in production
- [ ] Generate small number of questions first (5-10)
- [ ] Verify question quality
- [ ] Check OpenAI API usage
- [ ] Monitor Firebase costs
- [ ] Test from different devices/browsers

### 19. User Acceptance Testing
- [ ] Have real users test the flow
- [ ] Collect feedback on question quality
- [ ] Verify UX is intuitive
- [ ] Check performance under real usage
- [ ] Monitor for any errors

### 20. Monitoring and Maintenance
- [ ] Set up daily/weekly monitoring routine
- [ ] Check Firebase Functions logs regularly
- [ ] Monitor OpenAI API costs
- [ ] Review question quality periodically
- [ ] Update documentation as needed

## 🎯 Quick Start Command Reference

```bash
# Backend Deployment
cd firebase/functions
cp .env.example .env
# Edit .env with your OpenAI API key
npm install
npm run build
firebase deploy --only functions

# Frontend Development
cd apps/web
npm install
npm run dev

# View Logs
firebase functions:log

# Deploy Firestore Rules
firebase deploy --only firestore:rules
```

## 📞 Support Resources

- **OpenAI Documentation**: https://platform.openai.com/docs
- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Functions Logs**: `firebase functions:log`
- **OpenAI Usage Dashboard**: https://platform.openai.com/usage
- **Firebase Console**: https://console.firebase.google.com

## ✅ Final Verification

Once all items are checked:
- [ ] System is ready for production use
- [ ] All tests passed successfully
- [ ] Documentation is complete
- [ ] Team is trained
- [ ] Monitoring is active

---

**Congratulations!** Your AI-powered exam platform is ready to go! 🎉

Last Updated: November 23, 2025
