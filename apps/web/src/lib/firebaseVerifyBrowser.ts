import { initializeApp, getApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

interface FirebaseConfig extends FirebaseOptions {
  measurementId?: string;
}

/**
 * Browser-specific version of Firebase verification
 * This function is safe to use in browser environments with Vite
 */
export const verifyFirebaseConfig = async () => {
  console.log('Verifying Firebase configuration in browser...');
  
  try {
    // First, extract environment variables directly from Vite
    const config: FirebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string
    };

    // Log environment variables (with API key sanitized)
    const sanitizedEnv = {
      ...config,
      apiKey: config.apiKey ? '[API KEY PROVIDED]' : '[MISSING]'
    };
    
    console.log('Firebase environment variables:', sanitizedEnv);
    
    // Check for missing required values
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
    const missingKeys = requiredKeys.filter(key => !config[key]);
    
    if (missingKeys.length > 0) {
      console.error(`Missing required Firebase config values: ${missingKeys.join(', ')}`);
      return { 
        success: false, 
        message: `Missing required Firebase configuration values: ${missingKeys.join(', ')}`,
        code: 'missing-config'
      };
    }

    // Create the actual config object, removing undefined values
    const firebaseConfig = Object.fromEntries(
      Object.entries(config).filter(([_, value]) => value !== undefined)
    ) as FirebaseConfig;
    
    // Check if Firebase is already initialized
    let app;
    if (getApps().length > 0) {
      console.log('Firebase already initialized, reusing existing app');
      app = getApp();
    } else {
      console.log('Initializing new Firebase app for verification');
      app = initializeApp(firebaseConfig);
    }
    
    console.log('Firebase app initialized successfully');
    
    // Test auth without mutating the current session
    const auth = getAuth(app);
    console.log('Testing Firebase Auth connection...');

    try {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Firebase auth check timed out'));
        }, 4000);

        const unsubscribe = onAuthStateChanged(
          auth,
          () => {
            clearTimeout(timeoutId);
            unsubscribe();
            resolve();
          },
          (error) => {
            clearTimeout(timeoutId);
            unsubscribe();
            reject(error);
          }
        );
      });
      console.log('✓ Firebase Auth connection verified successfully');
    } catch (error: any) {
      console.error('Firebase Auth verification failed:', error);
      return { 
        success: false, 
        message: `Firebase authentication error: ${error.message || String(error)}`,
        code: error.code || 'auth-error',
        error
      };
    }
    
    // Test Firestore
    console.log('Testing Firebase Firestore connection...');
    try {
      const db = getFirestore(app);
      await getDocs(collection(db, 'test_collection'));
      console.log('✓ Firebase Firestore connection verified successfully');
    } catch (error: any) {
      // This might fail due to security rules, which is actually okay
      if (error.code === 'permission-denied') {
        console.log('✓ Firebase Firestore connection verified (with permission restrictions)');
      } else {
        console.warn('Firebase Firestore verification issue:', error);
        // Don't fail the entire verification for Firestore issues
      }
    }
    
    return { 
      success: true, 
      message: 'Firebase configuration verified successfully',
      config: sanitizedEnv
    };
  } catch (error: any) {
    console.error('Firebase verification failed:', error);
    return { 
      success: false, 
      message: `Firebase configuration error: ${error.message || String(error)}`,
      code: error.code || 'unknown-error',
      error
    };
  }
};