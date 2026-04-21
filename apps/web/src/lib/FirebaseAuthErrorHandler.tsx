import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, Alert, AlertTitle, Typography, Button } from '@mui/material';

/**
 * Error codes that can be handled automatically
 */
const FIREBASE_ERROR_SOLUTIONS: Record<string, string> = {
  'auth/configuration-not-found': 
    'Firebase configuration is invalid. This usually means the API key is incorrect or Firebase Authentication is not enabled in the Firebase Console.',
  'auth/invalid-api-key': 
    'The provided API key is invalid. Please check your environment variables.',
  'auth/app-deleted': 
    'The Firebase app instance has been deleted. Refresh the page to reinitialize.',
  'auth/invalid-credential': 
    'The provided credential is malformed or has expired.',
  'auth/operation-not-allowed': 
    'The requested authentication provider is not enabled in the Firebase Console.',
  'auth/requires-recent-login': 
    'This operation is sensitive and requires recent authentication. Please log in again.',
  'auth/user-disabled': 
    'The user account has been disabled by an administrator.',
  'auth/user-token-expired': 
    'Your login session has expired. Please log in again.',
  'auth/web-storage-unsupported': 
    'Web storage is not supported or is disabled on this browser.'
};

/**
 * Component that monitors Firebase auth state and shows errors if they occur
 */
export const FirebaseAuthErrorHandler: React.FC = () => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      () => {
        // Auth initialized successfully
      },
      (error) => {
        console.error('Firebase auth error:', error);
        setError(error);
      }
    );

    return () => unsubscribe();
  }, []);

  // If no error, don't render anything
  if (!error) return null;

  // Get the error code and message
  const errorCode = (error as any).code || 'unknown-error';
  const errorMessage = error.message;

  // Check if we have a solution for this error
  const solution = FIREBASE_ERROR_SOLUTIONS[errorCode];

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, maxWidth: 400, zIndex: 9999 }}>
      <Alert 
        severity="error"
        variant="filled"
        onClose={() => setError(null)}
        sx={{ mb: 2 }}
      >
        <AlertTitle>Firebase Error</AlertTitle>
        <Typography variant="body2" gutterBottom>
          {errorMessage}
        </Typography>
        {solution && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Possible solution:</strong> {solution}
          </Typography>
        )}
        <Button 
          color="inherit" 
          size="small" 
          onClick={() => window.location.reload()} 
          sx={{ mt: 1 }}
        >
          Reload App
        </Button>
      </Alert>
    </Box>
  );
};

export default FirebaseAuthErrorHandler;