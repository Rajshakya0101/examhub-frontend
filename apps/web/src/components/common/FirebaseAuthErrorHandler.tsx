import { useState, useEffect, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle, CircularProgress } from '@mui/material';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { verifyFirebaseConfig } from '../../lib/firebaseVerifyBrowser';

// Firebase error codes and their user-friendly solutions
const FIREBASE_ERROR_SOLUTIONS: Record<string, string> = {
  'auth/configuration-not-found': 
    'Firebase Authentication is not properly configured. Check that Authentication is enabled in your Firebase Console.',
  'auth/invalid-api-key': 
    'The API key is invalid. Check your .env.local file and ensure the VITE_FIREBASE_API_KEY is correct.',
  'auth/operation-not-allowed': 
    'The authentication method is not enabled in Firebase Console. Enable it in the Authentication section.',
  'auth/requires-recent-login': 
    'This operation requires a recent login. Please log out and log in again.',
  'auth/user-disabled': 
    'This user account has been disabled by an administrator.',
  'auth/user-token-expired': 
    'Your login session has expired. Please log in again.'
};

/**
 * Firebase Authentication Error Handler
 * This component provides a fallback UI when Firebase auth fails
 */
export default function FirebaseAuthErrorHandler({ children }: { children: ReactNode }) {
  const [authError, setAuthError] = useState<Error | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Safely wrap Firebase verification to handle any errors
    const verifyFirebase = async () => {
      setIsVerifying(true);
      try {
        // Attempt to verify Firebase configuration
        const result = await verifyFirebaseConfig();
        
        if (!result.success) {
          console.error('Firebase verification failed:', result.message);
          setAuthError(new Error(result.message));
        } else {
          // If verification succeeds, check if Firebase auth is working
          unsubscribe = onAuthStateChanged(
            auth,
            () => {
              setHasChecked(true);
            },
            (error) => {
              console.error('Firebase Auth Error:', error);
              setAuthError(error);
              setHasChecked(true);
            }
          );
        }
      } catch (error) {
        console.error('Error during Firebase verification:', error);
        setAuthError(error instanceof Error ? error : new Error('Firebase verification failed'));
      } finally {
        setIsVerifying(false);
        setHasChecked(true);
      }
    };

    // Run the verification
    verifyFirebase();

    // Clean up the auth listener
    return () => unsubscribe();
  }, []);

  // If still checking, show loading indicator
  if (!hasChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        {isVerifying && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2 }}>Verifying Firebase configuration...</Typography>
          </Box>
        )}
      </Box>
    );
  }

  // If auth error, show error screen
  if (authError) {
    // Get the error code from the error object
    const errorCode = (authError as any).code || 'unknown-error';
    const errorMessage = authError.message || 'An unknown error occurred';
    
    // Check if we have a solution for this error
    const solution = FIREBASE_ERROR_SOLUTIONS[errorCode] || 'Check your Firebase configuration in the .env.local file.';
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 600 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Firebase Authentication Error</AlertTitle>
            <Typography variant="body2" gutterBottom>
              Error code: {errorCode}
            </Typography>
            <Typography variant="body2">
              {errorMessage}
            </Typography>
          </Alert>
          
          <Typography variant="h5" gutterBottom>
            Demo Mode Active
          </Typography>
          
          <Typography paragraph>
            The application is running in demo mode with limited functionality. 
            Some features requiring Firebase authentication will not work.
          </Typography>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Suggested solution:
          </Typography>
          <Typography paragraph>
            {solution}
          </Typography>
          
          <Typography paragraph>
            To fix this issue, you need to:
          </Typography>
          
          <ol>
            <li>Create a Firebase project at the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
            <li>Enable Authentication in your Firebase project</li>
            <li>Copy your Firebase configuration</li>
            <li>Update your <code>.env.local</code> file with the proper configuration values</li>
            <li>Restart the development server</li>
          </ol>
          
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // No error, render children normally
  return children;
}