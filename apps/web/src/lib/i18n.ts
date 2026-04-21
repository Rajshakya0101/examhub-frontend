import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for React
    },
    resources: {
      en: {
        translation: {
          // Common
          'app.name': 'Exam Platform',
          'app.tagline': 'Master Your Exams',
          
          // Navigation
          'nav.dashboard': 'Dashboard',
          'nav.practice': 'Practice',
          'nav.tests': 'Tests',
          'nav.leaderboard': 'Leaderboard',
          'nav.profile': 'Profile',
          'nav.settings': 'Settings',
          'nav.signin': 'Sign In',
          'nav.signout': 'Sign Out',
          
          // Auth
          'auth.signin': 'Sign In',
          'auth.signup': 'Sign Up',
          'auth.signin.google': 'Sign in with Google',
          'auth.agree.terms': 'By signing in, you agree to our',
          'auth.terms': 'Terms of Service',
          'auth.privacy': 'Privacy Policy',
          
          // Dashboard
          'dashboard.welcome': 'Welcome back, {{name}}',
          'dashboard.continue': 'Continue your exam preparation journey',
          'dashboard.streak': 'Streak',
          'dashboard.questions': 'Questions Answered',
          'dashboard.accuracy': 'Accuracy',
          'dashboard.timeSpent': 'Time Spent',
          'dashboard.daily': 'Daily Quiz',
          'dashboard.recent': 'Recent Activity',
          'dashboard.actions': 'Quick Actions',
          'dashboard.practice': 'Practice Questions',
          'dashboard.mock': 'Take a Mock Test',
          'dashboard.view.leaderboard': 'View Leaderboard',
          
          // Exam
          'exam.question': 'Question {{number}} of {{total}}',
          'exam.previous': 'Previous',
          'exam.next': 'Next',
          'exam.submit': 'Submit',
          'exam.time': 'Time',
          'exam.sections': 'Sections',
          'exam.questions': 'Questions',
          'exam.answered': 'Answered',
          'exam.unanswered': 'Unanswered',
          'exam.confirm': 'Submit Exam?',
          'exam.confirm.message': 'Are you sure you want to submit your exam? You won\'t be able to change your answers after submission.',
          
          // Analysis
          'analysis.report': 'Performance Report',
          'analysis.attempted': 'Attempted on',
          'analysis.total': 'Total Questions',
          'analysis.correct': 'Correct',
          'analysis.incorrect': 'Incorrect',
          'analysis.unanswered': 'Unanswered',
          'analysis.download': 'Download PDF Report',
          'analysis.summary': 'Performance Summary',
          'analysis.section': 'Section Performance',
          'analysis.questions': 'Question Analysis',
          'analysis.all': 'All Questions',
          
          // Settings
          'settings.theme': 'Theme',
          'settings.theme.light': 'Light',
          'settings.theme.dark': 'Dark',
          'settings.theme.system': 'System',
          'settings.language': 'Language',
          'settings.language.en': 'English',
          'settings.language.hi': 'Hindi',
          'settings.fontScale': 'Font Scale',
        }
      },
      // Hindi translations would be added here (for future)
      hi: {
        translation: {
          'app.name': 'परीक्षा प्लेटफॉर्म',
          // ... more translations would go here
        }
      }
    }
  });

export default i18n;