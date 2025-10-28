import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

// Load environment variables
config({ path: '.env.local' });

// Simple verification script for Firebase configuration
async function verifyFirebase() {
  console.log('Starting Firebase verification...');
  console.log('Checking environment variables:');
  
  // Check environment variables
  const env = process.env;
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(v => !env[v]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    return;
  }
  
  console.log('✓ All required environment variables are present');
  
  // Construct Firebase config
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  
  if (env.VITE_FIREBASE_DATABASE_URL) {
    firebaseConfig.databaseURL = env.VITE_FIREBASE_DATABASE_URL;
  }
  
  if (env.VITE_FIREBASE_MEASUREMENT_ID) {
    firebaseConfig.measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;
  }
  
  console.log('Firebase Config (sanitized):');
  console.log({
    ...firebaseConfig,
    apiKey: '[API KEY PROVIDED]'
  });
  
  try {
    // Try to initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✓ Firebase app initialized successfully');
    
    // Try to initialize Auth
    const auth = getAuth(app);
    console.log('✓ Firebase Auth initialized successfully');
    
    // Try anonymous sign-in
    try {
      await signInAnonymously(auth);
      console.log('✓ Firebase Auth anonymous sign-in successful');
    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError.message);
      console.error('Error code:', authError.code);
    }
    
    // Try Firestore
    try {
      const db = getFirestore(app);
      await getDocs(collection(db, 'test'));
      console.log('✓ Firebase Firestore connection successful');
    } catch (firestoreError) {
      // This may fail due to security rules, which is actually fine
      if (firestoreError.code === 'permission-denied') {
        console.log('✓ Firebase Firestore connection successful (but access denied due to security rules)');
      } else {
        console.error('❌ Firebase Firestore error:', firestoreError.message);
        console.error('Error code:', firestoreError.code);
      }
    }
    
    console.log('\n✅ Firebase verification completed. If there were any errors, they are listed above.');
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    if (error.code) console.error('Error code:', error.code);
  }
}

verifyFirebase().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});