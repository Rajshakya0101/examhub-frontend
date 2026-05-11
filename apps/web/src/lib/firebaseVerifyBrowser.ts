// Lightweight runtime verifier for Firebase configuration in the browser
// Returns an object with { success, message, code?, error? }
export async function verifyFirebaseConfig() {
  try {
    const required = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    } as Record<string, any>;

    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);

    if (missing.length > 0) {
      return {
        success: false,
        message: `Missing Firebase configuration: ${missing.join(', ')}`,
        code: 'auth/configuration-not-found',
      };
    }

    // Basic sanity check passed
    return { success: true, message: 'Firebase configuration present' };
  } catch (error: any) {
    return {
      success: false,
      message: `Firebase configuration error: ${error?.message || String(error)}`,
      code: error?.code || 'unknown-error',
      error,
    };
  }
}

export default verifyFirebaseConfig;
