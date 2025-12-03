import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Language as LanguageIcon,
  Calculate as CalculateIcon,
  Public as PublicIcon,
  Computer as ComputerIcon,
  Translate as TranslateIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  Help as HelpIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

// Quiz presets matching the API
const quizPresets = [
  {
    subject: 'Current Affairs',
    difficulty: 'moderate',
    numQuestions: 15,
    icon: <PublicIcon fontSize="large" />,
    color: '#2563eb',
    description: 'Latest news, events, and government schemes',
  },
  {
    subject: 'Mathematics',
    difficulty: 'hard',
    numQuestions: 10,
    icon: <CalculateIcon fontSize="large" />,
    color: '#7c3aed',
    description: 'Challenging mathematical problems',
  },
  {
    subject: 'General Knowledge',
    difficulty: 'easy',
    numQuestions: 15,
    icon: <SchoolIcon fontSize="large" />,
    color: '#10b981',
    description: 'Basic GK questions for practice',
  },
  {
    subject: 'English',
    difficulty: 'moderate',
    numQuestions: 12,
    icon: <LanguageIcon fontSize="large" />,
    color: '#f59e0b',
    description: 'Grammar, vocabulary, and comprehension',
  },
  {
    subject: 'Reasoning',
    difficulty: 'moderate',
    numQuestions: 15,
    icon: <PsychologyIcon fontSize="large" />,
    color: '#ec4899',
    description: 'Logical reasoning and analytical ability',
  },
  {
    subject: 'Hindi',
    difficulty: 'moderate',
    numQuestions: 10,
    icon: <TranslateIcon fontSize="large" />,
    color: '#14b8a6',
    description: 'Hindi grammar and comprehension',
  },
  {
    subject: 'Computer Knowledge',
    difficulty: 'easy',
    numQuestions: 15,
    icon: <ComputerIcon fontSize="large" />,
    color: '#3b82f6',
    description: 'Basic computer awareness',
  },
];

interface QuizResponse {
  message: string;
  test: {
    id: string;
    title: string;
    subject: string;
    difficulty: string;
    numQuestions: number;
    durationMinutes: number;
    questions: Array<{
      id: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation: string;
      timeToSolveSeconds: number;
    }>;
  };
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '#10b981';
    case 'moderate':
      return '#f59e0b';
    case 'hard':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export default function Practice() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedQuizzes, setBookmarkedQuizzes] = useState<number[]>([]);
  const [likedQuizzes, setLikedQuizzes] = useState<number[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof quizPresets[0] | null>(null);

  // Mutation to generate quiz - Direct API call
  const generateQuizMutation = useMutation({
    mutationFn: async (preset: typeof quizPresets[0]) => {
      console.log('Calling external API directly with:', {
        subject: preset.subject,
        difficulty: preset.difficulty,
        numQuestions: preset.numQuestions,
      });
      
      try {
        const response = await axios.post<QuizResponse>(
          'https://examhub-2.onrender.com/api/v2/generate-quiz',
          {
            subject: preset.subject,
            difficulty: preset.difficulty,
            numQuestions: preset.numQuestions,
          },
          {
            timeout: 240000, // 240 second timeout
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('API Response:', response.data);
        return response.data;
      } catch (err: any) {
        console.error('API Error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        throw err;
      }
    },
    onSuccess: (data) => {
      // Clear any existing quiz data first
      sessionStorage.removeItem('quickQuiz');
      sessionStorage.removeItem('fullMockTest');
      sessionStorage.removeItem('sectionalMockTest');
      sessionStorage.removeItem('topicWiseMockTest');
      
      // Clear any persisted quiz state
      const stateKey = `quizState_${data.test.id}`;
      sessionStorage.removeItem(stateKey);
      
      // Store quiz data in sessionStorage for the exam player
      sessionStorage.setItem('quickQuiz', JSON.stringify(data.test));
      
      // Show instructions modal
      setShowInstructions(true);
    },
    onError: (error: any) => {
      console.error('Quiz generation failed:', error);
      
      let errorMessage = 'Unable to generate quiz at this time. Please try again in a few moments.';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The server may be waking up (free tier). Please try again in 30 seconds.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Quiz service is starting up. Please wait 30 seconds and try again.';
      } else if (error.response) {
        errorMessage = error.response?.data?.message || 
                      `Server error: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Cannot reach the quiz server. Please check your connection.';
      }
      
      setError(errorMessage);
    },
  });

  const handleStartQuiz = (preset: typeof quizPresets[0]) => {
    setError(null);
    setSelectedPreset(preset);
    generateQuizMutation.mutate(preset);
  };

  const handleConfirmStart = () => {
    setShowInstructions(false);
    const storedTest = sessionStorage.getItem('quickQuiz');
    if (storedTest) {
      const test = JSON.parse(storedTest);
      navigate(`/quick-quiz/${test.id}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.palette.success.main;
      case 'moderate':
        return theme.palette.warning.main;
      case 'hard':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const toggleBookmark = (index: number) => {
    setBookmarkedQuizzes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleLike = (index: number) => {
    setLikedQuizzes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <Box sx={{ 
      background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
      minHeight: '100vh',
      pb: 8
    }}>
      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onClose={() => setShowInstructions(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            Quick Quiz Instructions
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            📋 General Instructions
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Read each question carefully before selecting an answer" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• You can navigate between questions using the question palette" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Click 'Submit' when you're done to see your results" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• You can review your answers and see explanations after submission" />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            📊 Marking Scheme
          </Typography>
          <List dense>
            <ListItem>
              <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
              <ListItemText 
                primary="Correct Answer: +2 marks" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
            <ListItem>
              <WrongIcon sx={{ color: 'error.main', mr: 1 }} />
              <ListItemText 
                primary="Wrong Answer: -0.5 marks (Negative Marking)" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
            <ListItem>
              <InfoIcon sx={{ color: 'info.main', mr: 1 }} />
              <ListItemText 
                primary="Unattempted: 0 marks" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Pro Tip:</strong> Answer only when you're confident to avoid negative marking!
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowInstructions(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmStart} 
            variant="contained" 
            size="large"
            sx={{ px: 4 }}
          >
            Start Quiz
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ py: 5, mb: 4 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Quick Practice
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
            Start practicing instantly with AI-generated quizzes
          </Typography>

          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <TrophyIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Grid>
              <Grid item xs>
                <Typography variant="body1" fontWeight={500}>
                  🎯 Instant Access • ⚡ AI-Powered • 🆓 Completely Free
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Practice anytime without creating an account
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {generateQuizMutation.isPending && (
          <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Generating your quiz...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take up to 2-3 minutes. Please wait.
            </Typography>
          </Paper>
        )}

        {/* Quiz Cards Grid */}
        <Grid container spacing={3}>
          {quizPresets.map((preset, index) => {
            const isBookmarked = bookmarkedQuizzes.includes(index);
            const isLiked = likedQuizzes.includes(index);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: theme.palette.background.paper,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}>
                  {/* Color Bar */}
                  <Box sx={{
                    height: 6,
                    width: '100%',
                    bgcolor: preset.color,
                  }} />

                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header with Bookmark */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={preset.subject}
                        size="small"
                        sx={{
                          bgcolor: alpha(preset.color, 0.1),
                          color: preset.color,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(index);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        {isBookmarked ? 
                          <BookmarkIcon fontSize="small" sx={{ color: preset.color }} /> : 
                          <BookmarkBorderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        }
                      </Box>
                    </Box>

                    {/* Title */}
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 1.5 }}>
                      {preset.subject}: Quick Practice
                    </Typography>

                    {/* Description */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        minHeight: 40,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {preset.description}
                    </Typography>

                    {/* Questions and Time */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HelpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {preset.numQuestions} Questions
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {preset.numQuestions} Minutes
                        </Typography>
                      </Box>
                    </Box>

                    {/* Difficulty Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: alpha(getDifficultyColor(preset.difficulty), 0.1),
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: getDifficultyColor(preset.difficulty),
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: getDifficultyColor(preset.difficulty),
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}
                        >
                          {preset.difficulty} Difficulty
                        </Typography>
                      </Box>
                    </Box>

                    {/* Topic Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {['Quick Practice', preset.difficulty === 'easy' ? 'Beginner' : preset.difficulty === 'hard' ? 'Advanced' : 'Intermediate', '+1'].map((tag, i) => (
                        <Chip
                          key={i}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            borderRadius: 1
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(index);
                      }}
                      sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isLiked ? 
                        <FavoriteIcon fontSize="small" sx={{ color: preset.color }} /> : 
                        <FavoriteBorderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      }
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => handleStartQuiz(preset)}
                      disabled={generateQuizMutation.isPending}
                      sx={{
                        bgcolor: preset.color,
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        '&:hover': {
                          bgcolor: alpha(preset.color, 0.9),
                        },
                      }}
                    >
                      Start Practice →
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Info Section */}
        <Paper sx={{ mt: 6, p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Why Quick Practice?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ⚡ Instant Start
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click and start practicing immediately.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                🤖 AI-Generated
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fresh questions every time using advanced AI technology.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                📊 Instant Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get immediate feedback with explanations for each answer.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}