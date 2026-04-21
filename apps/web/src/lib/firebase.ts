import { initializeApp, FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Extended Firebase config type
interface ExtendedFirebaseConfig extends FirebaseOptions {
  databaseURL?: string;
  measurementId?: string;
}

/**
 * Configure and initialize Firebase services
 * This makes sure all configuration values are available
 */
function initializeFirebase() {
  console.log('Initializing Firebase...');

  try {
    // Construct Firebase configuration from environment variables
    const firebaseConfig: ExtendedFirebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Add optional Firebase database URL if available
    if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
      firebaseConfig.databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    }

    // Add optional measurement ID if available
    if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      firebaseConfig.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    }

    // Validate required configuration values
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
    const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
    }

    // Initialize Firebase with validated config
    const app = initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    
    // Initialize Functions based on environment
    let functions;
    if (import.meta.env.DEV) {
      // In development, create functions without region and connect to emulator
      functions = getFunctions(app);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('✅ Connected to Functions emulator at localhost:5001');
    } else {
      // In production, use the asia-south1 region
      functions = getFunctions(app, 'asia-south1');
    }

    // Set persistence to keep users logged in across page refreshes
    setPersistence(auth, browserLocalPersistence).then(() => {
      console.log('Firebase auth persistence set to local');
    }).catch(error => {
      console.error('Failed to set auth persistence:', error);
    });

    // Set device language for auth
    auth.useDeviceLanguage();

    // Connect to other emulators in development
    if (import.meta.env.DEV) {
      // Connect other emulators only if explicitly enabled
      if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
        try {
          connectAuthEmulator(auth, 'http://localhost:9099');
          connectFirestoreEmulator(db, 'localhost', 8083);
          connectStorageEmulator(storage, 'localhost', 9199);
          console.log('✅ Connected to all Firebase emulators');
        } catch (error) {
          console.warn('Failed to connect to some emulators:', error);
        }
      }
    }

    return { app, auth, db, storage, functions };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Initialize Firebase and export services
const { app, auth, db, storage, functions } = initializeFirebase();

export { app, auth, db, storage, functions };

// Re-export Firebase types for convenience
export type { User } from 'firebase/auth';
export type { DocumentReference, DocumentData, Timestamp } from 'firebase/firestore';