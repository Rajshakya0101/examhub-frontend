import { useEffect } from 'react';
import { useMediaQuery } from '@mui/material';
import useStore from '@/store/useStore';

/**
 * Custom hook to manage theme preferences
 * Handles system preference detection and theme switching
 */
export default function useTheme() {
  const themeMode = useStore(state => state.themeMode);
  const setThemeMode = useStore(state => state.setThemeMode);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Set body class for Tailwind dark mode
  useEffect(() => {
    const isDark = 
      themeMode === 'dark' || 
      (themeMode === 'system' && prefersDarkMode);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode, prefersDarkMode]);
  
  // Determine the current theme mode
  const currentMode = 
    themeMode === 'system' 
      ? prefersDarkMode ? 'dark' : 'light'
      : themeMode;
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setThemeMode(currentMode === 'light' ? 'dark' : 'light');
  };

  return {
    themeMode,
    setThemeMode,
    currentMode,
    toggleTheme,
    isDarkMode: currentMode === 'dark'
  };
}