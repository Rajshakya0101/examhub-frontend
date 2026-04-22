import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { useGuestMode } from './guestContext';
import { initializeUserStats } from './firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'student' | 'teacher' | 'admin';
}

interface AuthContextValue {
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseUser(firebaseUser: FirebaseUser, role: User['role'] = 'student'): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role,
  };
}

async function createOrLoadUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const userProfile: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      role: 'student',
    };

    await setDoc(userRef, {
      ...userProfile,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      bio: '',
      phone: '',
      location: '',
      education: '',
      profileComplete: false,
    });
    await initializeUserStats(firebaseUser.uid);
    return userProfile;
  }

  await setDoc(userRef, {
    lastLoginAt: new Date(),
  }, { merge: true });

  const profile = userSnap.data() as Partial<User> | undefined;
  return {
    uid: firebaseUser.uid,
    email: profile?.email ?? firebaseUser.email,
    displayName: profile?.displayName ?? firebaseUser.displayName,
    photoURL: profile?.photoURL ?? firebaseUser.photoURL,
    role: profile?.role === 'teacher' || profile?.role === 'admin' ? profile.role : 'student',
  };
}

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      try {
        if (firebaseUser) {
          try {
            const userProfile = await createOrLoadUserProfile(firebaseUser);
            setUser(userProfile);
          } catch (profileError) {
            console.error('Profile sync error, falling back to Firebase user:', profileError);
            setUser(mapFirebaseUser(firebaseUser));
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading: initializing,
    signIn: async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);

      try {
        const userProfile = await createOrLoadUserProfile(result.user);
        setUser(userProfile);
      } catch (profileError) {
        console.error('Profile sync error after Google sign-in, using Firebase user:', profileError);
        setUser(mapFirebaseUser(result.user));
      }
    },
    signUp: async (email: string, password: string, name?: string) => {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(firebaseUser, { displayName: name });
      }

      await createOrLoadUserProfile(firebaseUser);
    },
    signOut: async () => {
      await firebaseSignOut(auth);
    },
    resetPassword: async (email: string) => {
      await sendPasswordResetEmail(auth, email);
    },
    updateUserProfile: async (data: { displayName?: string; photoURL?: string }) => {
      if (!auth.currentUser) {
        return;
      }

      await updateProfile(auth.currentUser, data);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, data, { merge: true });

      const updatedUser = {
        ...mapFirebaseUser(auth.currentUser, user?.role ?? 'student'),
        displayName: data.displayName ?? auth.currentUser.displayName,
        photoURL: data.photoURL ?? auth.currentUser.photoURL,
      };

      setUser(updatedUser);
    },
  }), [initializing, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// React hook for auth state
export function useAuthState() {
  const context = useContext(AuthContext);
  return context?.user ?? null;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Sign in with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({ prompt: 'select_account' });

  return signInWithPopup(auth, provider);
}

// Sign out
export async function signOut() {
  await firebaseSignOut(auth);
}

// Auth guard component for protected routes
interface AuthGuardProps {
  children: ReactNode;
  allowAnonymous?: boolean;
  allowGuest?: boolean;
}

export function AuthGuard({ children, allowAnonymous = false, allowGuest = false }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const { isGuestMode } = useGuestMode();
  const location = useLocation();

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  // Allow access if:
  // 1. User is authenticated OR
  // 2. Route allows anonymous access OR
  // 3. Route allows guest access AND user is in guest mode
  if (!user && !allowAnonymous && !(allowGuest && isGuestMode)) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}