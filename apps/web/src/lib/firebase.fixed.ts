import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Extended Firebase config type with optional fields
interface ExtendedFirebaseConfig extends FirebaseOptions {
  databaseURL?: string;
  measurementId?: string;
}

// Function to get Firebase config with validation
function getValidatedFirebaseConfig(): ExtendedFirebaseConfig {
  const config: ExtendedFirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Add optional configuration if available
  if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    config.databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  }
  
  if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
  }
  
  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    console.error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
    throw new Error(`Firebase initialization failed: Missing ${missingFields.join(', ')}`);
  }
  
  return config;
}

// Initialize Firebase with validated config
const firebaseConfig = getValidatedFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(
  app,
  import.meta.env.VITE_FIREBASE_REGION || undefined
);

// Connect to emulators in development if enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

export { app, auth, db, storage, functions };

// Re-export Firebase types for convenience
export type { User } from 'firebase/auth';
export type { DocumentReference, DocumentData, Timestamp } from 'firebase/firestore';