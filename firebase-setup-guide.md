# Firebase Setup Guide

## Getting Firebase Credentials

To fix the "API key not valid" error, you need to obtain valid Firebase credentials:

1. **Create a Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project" and follow the setup wizard
   - Give your project a name (e.g., "exam-platform")

2. **Register Your Web App**:
   - Once your project is created, click the web icon (</>) on the project overview page
   - Register your app with a nickname (e.g., "exam-platform-web")
   - Firebase will provide you with configuration details that look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA_ACTUAL_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

3. **Update Your Environment File**:
   - Copy the values from the configuration object
   - Replace the placeholders in your `.env.local` file with these values
   - Make sure to include the `VITE_` prefix for each variable

## Implementation Steps

1. Open the `.env.local.new` file I've created for you
2. Replace the placeholder values with your actual Firebase credentials
3. Rename the file to `.env.local` (remove the ".new" suffix)
4. Restart your development server

## Security Note

- Keep your Firebase API keys confidential
- Although client-side API keys are visible in the browser, Firebase uses them along with security rules and domain restrictions
- Set up proper [Firebase Security Rules](https://firebase.google.com/docs/rules) for Firestore, Storage, and other services

## Optional: Enable Firebase Emulators

If you're developing locally and want to use Firebase emulators:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase in your project: `firebase init`
3. Start the emulators: `firebase emulators:start`
4. Set `VITE_USE_FIREBASE_EMULATORS=true` in your `.env.local` file