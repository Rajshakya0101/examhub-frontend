import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Theme state
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  
  // Auth state
  isAuthenticated: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher' | 'admin';
}

// Create store with persistence
const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme state - default to system
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
      
      // Auth state - default to not authenticated
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Loading state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'exam-platform-storage',
      partialize: (state) => ({
        // Only persist these fields
        themeMode: state.themeMode,
        user: state.user,
      }),
    }
  )
);

export default useStore;