import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

// React Query hook for auth state
export function useAuthState() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return user;
}

// Sign in with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  // Add persistence scopes to ensure session persistence
  provider.addScope('profile');
  provider.addScope('email');
  // Set custom parameters for better UX
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign-in successful, user:', result.user.displayName || result.user.email);
    return result;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Sign out
export function signOut() {
  return auth.signOut();
}