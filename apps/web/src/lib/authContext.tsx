import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { useGuestMode } from './guestContext';

// Create auth context
const AuthContext = createContext<User | null>(null);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log('Auth state changed:', authUser ? 'User logged in' : 'User logged out');
      
      // If it's an anonymous user, sign them out
      if (authUser?.isAnonymous) {
        console.log('Detected anonymous user, signing out');
        auth.signOut();
        setUser(null);
      } else {
        setUser(authUser);
      }
      
      if (initializing) {
        setInitializing(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [initializing]);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

// React hook for auth state
export function useAuthState() {
  const user = useContext(AuthContext);
  return user;
}

// Sign in with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// Sign out
export function signOut() {
  return auth.signOut();
}

// Auth guard component for protected routes
interface AuthGuardProps {
  children: ReactNode;
  allowAnonymous?: boolean;
  allowGuest?: boolean;
}

export function AuthGuard({ children, allowAnonymous = false, allowGuest = false }: AuthGuardProps) {
  const user = useAuthState();
  const { isGuestMode } = useGuestMode();
  const location = useLocation();

  // Allow access if:
  // 1. User is authenticated OR
  // 2. Route allows anonymous access OR
  // 3. Route allows guest access AND user is in guest mode
  if (!user && !allowAnonymous && !(allowGuest && isGuestMode)) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}