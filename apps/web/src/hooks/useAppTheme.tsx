import { useEffect, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useStore from '@/store/useStore';

/**
 * Custom hook to handle theme synchronization between MUI and Tailwind
 */
export const useAppTheme = () => {
  const themeMode = useStore((state: { themeMode: import('@/store/useStore').ThemeMode }) => state.themeMode);
  const setThemeMode = useStore((state: { setThemeMode: (mode: import('@/store/useStore').ThemeMode) => void }) => state.setThemeMode);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Determine the actual theme mode based on system preference when set to 'system'
  const actualTheme = themeMode === 'system' 
    ? prefersDarkMode ? 'dark' : 'light'
    : themeMode;

  // Sync with Tailwind's dark mode using class strategy
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualTheme);
  }, [actualTheme]);
  
  // Create MUI theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: actualTheme === 'dark' ? 'dark' : 'light',
          primary: {
            main: '#5e35b1', // Deep purple
          },
          secondary: {
            main: '#00bcd4', // Cyan
          },
          background: {
            default: actualTheme === 'dark' ? '#121212' : '#f5f5f7',
            paper: actualTheme === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow: actualTheme === 'dark' 
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.24)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              },
            },
          },
        },
      }),
    [actualTheme],
  );

  // Function to toggle theme
  const toggleTheme = () => {
    setThemeMode(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return { theme, actualTheme, toggleTheme, ThemeWrapper };
};

/**
 * Theme Provider component
 */
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppTheme();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;