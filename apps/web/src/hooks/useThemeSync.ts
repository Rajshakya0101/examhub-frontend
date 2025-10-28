import { useEffect } from 'react';
import { useMediaQuery } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { useThemeStore } from '@/lib/store';

// This hook synchronizes:
// 1. MUI theme mode
// 2. Tailwind dark mode class
// 3. User preference in Firestore
// 4. System preference detection

export default function useThemeSync() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { mode, setMode } = useColorScheme();
  const { themePreference, setThemePreference } = useThemeStore();

  // Apply system preference when theme is set to 'system'
  useEffect(() => {
    // Only update if explicitly set to 'system'
    if (themePreference === 'system') {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode, themePreference, setMode]);

  // Sync theme changes to the HTML class for Tailwind
  useEffect(() => {
    const isDark = 
      mode === 'dark' || 
      (mode === 'system' && prefersDarkMode);
    
    document.documentElement.classList.toggle('dark', isDark);
  }, [mode, prefersDarkMode]);

  // Return the theme values and setters
  return {
    mode,
    setMode,
    setThemePreference,
    prefersDarkMode
  };
}