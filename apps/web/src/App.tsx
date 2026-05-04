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
import { GuestProvider } from './lib/guestContext';
import { NotificationProvider } from './lib/notifications/notificationContext';

// Import route components
import Landing from './routes/Landing';
import SignIn from './routes/SignIn';
import Dashboard from './routes/Dashboard';
import Practice from './routes/Practice';
import Tests from './routes/Tests';
import QuizCategories from './routes/QuizCategories';
import StudyContent from './routes/StudyContent';
import CurrentAffairs from './routes/CurrentAffairs';
import CreateTest from './routes/CreateTest';
import Attempt from './routes/Attempt';
import Analysis from './routes/Analysis';
import Leaderboard from './routes/Leaderboard';
import Profile from './routes/Profile';
import Settings from './routes/Settings';
import NotFound from './routes/NotFound';
import QuickQuiz from './routes/QuickQuiz';
import QuickQuizPlayer from './routes/QuickQuizPlayer';
import FullMock from './routes/FullMock';
import SectionalMock from './routes/SectionalMock';
import TopicWiseMock from './routes/TopicWiseMock';
import FirestoreTest from './routes/FirestoreTest';
import AttemptedTests from './routes/AttemptedTests';
import UnderDevelopment from './routes/UnderDevelopment';

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
    element: <Layout allowGuest><Practice /></Layout>,
  },
  {
    path: '/quizzes',
    element: <Layout allowGuest><QuizCategories /></Layout>,
  },
  {
    path: '/study-content',
    element: <Layout allowGuest><StudyContent /></Layout>,
  },
  {
    path: '/current-affairs',
    element: <Layout allowGuest><CurrentAffairs /></Layout>,
  },
  {
    path: '/tests',
    element: <Layout allowGuest><Tests /></Layout>,
  },
  {
    path: '/tests/full-mock',
    element: <Layout requireAuth={false}><FullMock /></Layout>,
  },
  {
    path: '/tests/sectional-mock',
    element: <Layout requireAuth={false}><SectionalMock /></Layout>,
  },
  {
    path: '/tests/topic-wise-mock',
    element: <Layout requireAuth={false}><TopicWiseMock /></Layout>,
  },
  {
    path: '/tests/create',
    element: <Layout><CreateTest /></Layout>,
  },
  {
    path: '/tests/:examId/attempt/:attemptId',
    element: <Layout allowGuest><Attempt /></Layout>,
  },
  {
    path: '/analysis/:attemptId',
    element: <Layout><Analysis /></Layout>,
  },
  {
    path: '/attempts',
    element: <Layout><AttemptedTests /></Layout>,
  },
  {
    path: '/leaderboard',
    element: <Layout allowGuest><Leaderboard /></Layout>,
  },
  {
    path: '/quick-quiz',
    element: <Layout requireAuth={false}><QuickQuiz /></Layout>,
  },
  {
    path: '/quick-quiz/:quizId',
    element: <Layout requireAuth={false}><QuickQuizPlayer /></Layout>,
  },
  {
    path: '/full-mock',
    element: <Layout requireAuth={false}><FullMock /></Layout>,
  },
  {
    path: '/sectional-mock',
    element: <Layout requireAuth={false}><SectionalMock /></Layout>,
  },
  {
    path: '/topic-wise-mock',
    element: <Layout requireAuth={false}><TopicWiseMock /></Layout>,
  },
  {
    path: '/profile',
    element: <Layout><Profile /></Layout>,
  },
  {
    path: '/notes',
    element: <Layout><UnderDevelopment /></Layout>,
  },
  {
    path: '/bookmarks',
    element: <Layout><UnderDevelopment /></Layout>,
  },
  {
    path: '/premium',
    element: <Layout><UnderDevelopment /></Layout>,
  },
  {
    path: '/settings',
    element: <Layout><Settings /></Layout>,
  },
  {
    path: '/firestore-test',
    element: <Layout requireAuth={false}><FirestoreTest /></Layout>,
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
            <GuestProvider>
              <NotificationProvider>
                <FirebaseAuthErrorHandler>
                  <RouterProvider router={router} />
                </FirebaseAuthErrorHandler>
              </NotificationProvider>
            </GuestProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}