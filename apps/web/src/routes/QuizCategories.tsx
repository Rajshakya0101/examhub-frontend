import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  CircularProgress,
  alpha,
  useTheme,
  Alert
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import PublicIcon from '@mui/icons-material/Public';
import CalculateIcon from '@mui/icons-material/Calculate';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TranslateIcon from '@mui/icons-material/Translate';
import ComputerIcon from '@mui/icons-material/Computer';
import { generateQuiz } from '../lib/functions';

interface QuizCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  subject: string;
}

const quizCategories: QuizCategory[] = [
  {
    id: 'current-affairs',
    title: 'Current Affairs',
    description: 'Stay updated with recent events and developments',
    icon: <PublicIcon fontSize="large" />,
    subject: 'current affairs'
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'Test your numerical and mathematical skills',
    icon: <CalculateIcon fontSize="large" />,
    subject: 'mathematics'
  },
  {
    id: 'gk-gs',
    title: 'General Knowledge',
    description: 'Explore general knowledge and current affairs',
    icon: <AutoStoriesIcon fontSize="large" />,
    subject: 'general knowledge'
  },
  {
    id: 'english',
    title: 'English',
    description: 'Enhance your language and comprehension skills',
    icon: <TranslateIcon fontSize="large" />,
    subject: 'english'
  },
  {
    id: 'reasoning',
    title: 'Reasoning',
    description: 'Challenge your logical thinking abilities',
    icon: <PsychologyIcon fontSize="large" />,
    subject: 'logical reasoning'
  },
  {
    id: 'hindi',
    title: 'Hindi',
    description: 'Test your Hindi language proficiency',
    icon: <TranslateIcon fontSize="large" />,
    subject: 'hindi'
  },
  {
    id: 'computer',
    title: 'Computer Knowledge',
    description: 'Assess your computer and IT knowledge',
    icon: <ComputerIcon fontSize="large" />,
    subject: 'computer science'
  }
];

export default function QuizCategories() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

const handleStartQuiz = async (category: QuizCategory) => {
    try {
      // Clear any previous errors
      setError('');
      // Set loading state for this category
      setLoading(category.id);
      
      console.log('Generating quiz for category:', category.subject);
      
      // Generate quiz using OpenAI
      const quizId = await generateQuiz({
        subject: category.subject,
        numQuestions: 15,
        timeLimit: 10,
        difficulty: 'medium'
      });

      console.log('Quiz generated with ID:', quizId);

      if (!quizId) {
        throw new Error('Failed to generate quiz: No quiz ID returned');
      }

      // Navigate to the quiz attempt page
      navigate(`/tests/${quizId}/attempt/guest`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      
      // Set a user-friendly error message based on the error type
      let errorMessage = 'Unable to generate quiz at this time. Please try again in a few moments.';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'Server connection error. Please try again later.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        }
      }
      
      setError(errorMessage);
      
      // Log the detailed error for debugging
      console.error('Detailed error:', error instanceof Error ? error.stack : error);
    } finally {
      // Clear loading state
      setLoading(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Quick Practice Quizzes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Choose a category to start a 15-question quiz with a 10-minute time limit
        </Typography>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-message': {
                color: theme => theme.palette.error.main
              }
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {quizCategories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme => `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    mx: 'auto'
                  }}
                >
                  {category.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {category.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleStartQuiz(category)}
                  disabled={loading === category.id}
                  startIcon={loading === category.id ? <CircularProgress size={20} /> : <QuizIcon />}
                  sx={{
                    mt: 2,
                    py: 1
                  }}
                >
                  {loading === category.id ? 'Generating Quiz...' : 'Start Quiz'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}