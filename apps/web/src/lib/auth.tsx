import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { initializeUserStats } from './firestore';

// User profile type extending FirebaseUser
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'student' | 'teacher' | 'admin';
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
});

// Create and export user profile on firestore
const createUserProfile = async (user: FirebaseUser) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { uid, email, displayName, photoURL } = user;
    const userProfile = {
      uid,
      email,
      displayName,
      photoURL,
      role: 'student',
      createdAt: new Date(),
    };

    await setDoc(userRef, userProfile);
    
    // Initialize user stats for new user
    await initializeUserStats(uid);
    
    return userProfile;
  }

  return userSnap.data();
};

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user profile in Firestore
          const userProfile = await createUserProfile(firebaseUser);
          
          // Map Firebase user to our User type
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: userProfile?.role || 'student',
          };
          
          setUser(userData);
        } catch (error) {
          console.error("Error setting up user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserProfile(result.user);
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name?: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(firebaseUser, { displayName: name });
    }
    await createUserProfile(firebaseUser);
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, data);
    
    // Update Firestore profile
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, data, { merge: true });
    
    // Update local user state
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        displayName: data.displayName ?? prevUser.displayName,
        photoURL: data.photoURL ?? prevUser.photoURL,
      };
    });
  };

  // Provide auth context
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Auth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth state hook (for simpler state access)
export function useAuthState() {
  const { user } = useAuth();
  return user;
}

// Direct access to sign in/out functions for convenience
// These will be properly initialized when used through hooks
export const signInWithGoogle = async () => {
  const { signInWithGoogle } = useAuth();
  return signInWithGoogle();
};

export const signOut = async () => {
  const { signOut } = useAuth();
  return signOut();
};

// Auth guard component
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}