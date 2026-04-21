import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaletteMode } from '@mui/material';

interface ThemeState {
  themePreference: PaletteMode | 'system';
  setThemePreference: (mode: PaletteMode | 'system') => void;
}

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

interface UIState {
  isPaletteOpen: boolean;
  togglePalette: () => void;
}

// Create store with persistence for theme preference
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      setThemePreference: (mode) => set({ themePreference: mode }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Timer state for exam attempts
export const useTimerStore = create<TimerState>()((set, get) => ({
  timeLeft: 0,
  isRunning: false,
  startTimer: (duration) => {
    set({ timeLeft: duration, isRunning: true });
    const interval = setInterval(() => {
      const { timeLeft, isRunning } = get();
      if (isRunning && timeLeft > 0) {
        set({ timeLeft: timeLeft - 1 });
      } else if (timeLeft <= 0) {
        clearInterval(interval);
        set({ isRunning: false });
      }
    }, 1000);
  },
  pauseTimer: () => set({ isRunning: false }),
  resumeTimer: () => set({ isRunning: true }),
  resetTimer: () => set({ timeLeft: 0, isRunning: false }),
}));

// UI state for question palette visibility
export const useUIStore = create<UIState>()((set) => ({
  isPaletteOpen: false,
  togglePalette: () => set((state) => ({ isPaletteOpen: !state.isPaletteOpen })),
}));