import { StrictMode } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from './lib/theme';
import { useThemeStore } from './lib/store';
import useStore from './store/useStore';
import Layout from './components/layout/Layout';
import FirebaseAuthErrorHandler from './components/common/FirebaseAuthErrorHandler';
import { AuthProvider } from './lib/authContext';
import { NotificationProvider } from './lib/notifications/notificationContext';
import SessionTimeoutHandler from './components/common/SessionTimeoutHandler';

// Import route components
import Landing from './routes/Landing';
import SignIn from './routes/SignIn';
import Dashboard from './routes/Dashboard';
import Practice from './routes/Practice';
import Tests from './routes/Tests';
import CreateTest from './routes/CreateTest';
import Attempt from './routes/Attempt';
import Analysis from './routes/Analysis';
import Leaderboard from './routes/Leaderboard';
import Profile from './routes/Profile';
import Settings from './routes/Settings';
import NotFound from './routes/NotFound';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout requireAuth={false}><Landing /></Layout>,
  },
  {
    path: '/signin',
    element: <Layout requireAuth={false}><SignIn /></Layout>,
  },
  {
    path: '/dashboard',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/practice',
    element: <Layout><Practice /></Layout>,
  },
  {
    path: '/tests',
    element: <Layout><Tests /></Layout>,
  },
  {
    path: '/tests/create',
    element: <Layout><CreateTest /></Layout>,
  },
  {
    path: '/tests/:examId/attempt/:attemptId',
    element: <Layout><Attempt /></Layout>,
  },
  {
    path: '/analysis/:attemptId',
    element: <Layout><Analysis /></Layout>,
  },
  {
    path: '/leaderboard',
    element: <Layout><Leaderboard /></Layout>,
  },
  {
    path: '/profile',
    element: <Layout><Profile /></Layout>,
  },
  {
    path: '/settings',
    element: <Layout><Settings /></Layout>,
  },
  {
    path: '*',
    element: <Layout requireAuth={false}><NotFound /></Layout>,
  },
]);

export default function App() {
  // Get theme preference from the theme store
  const { themePreference } = useThemeStore();
  // For backward compatibility, also update the old store
  const themeMode = useStore((state: any) => state.themeMode || 'light');
  // Use theme store preference, fall back to the old store if needed
  const currentTheme = themePreference || themeMode;

  // Convert 'system' to either 'light' or 'dark' based on system preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveTheme = currentTheme === 'system' 
    ? (prefersDarkMode ? 'dark' : 'light') 
    : (currentTheme as 'light' | 'dark');
    
  // Create theme once to prevent unnecessary re-renders
  const theme = createAppTheme(effectiveTheme);

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <NotificationProvider>
              <FirebaseAuthErrorHandler>
                <SessionTimeoutHandler />
                <RouterProvider router={router} />
              </FirebaseAuthErrorHandler>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}