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

const QUIZ_API_BASE_URL = import.meta.env.VITE_QUIZ_API_BASE_URL || 'https://examhub-2.onrender.com/api/v2';
const DEFAULT_QUIZ_API_PATH = '/generate-quiz';
const MATHEMATICS_QUIZ_API_ENDPOINT =
  import.meta.env.VITE_MATHEMATICS_QUIZ_API_ENDPOINT ||
  'https://pranova-new-mcq-api.hf.space/generate_mock';
const MATHEMATICS_QUIZ_SEED_OVERRIDE = import.meta.env.VITE_MATHEMATICS_QUIZ_SEED;

interface QuizPreset {
  subject: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  numQuestions: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  apiPath?: string;
  apiSubject?: string;
  apiProvider?: 'default' | 'hf-mcq';
  apiEndpoint?: string;
  hfSection?: 'quant' | 'reasoning' | 'english' | 'polity';
}

const FIXED_QUESTIONS_PER_SUBJECT = 15;
const STANDARD_MAX_DURATION_MINUTES = 8;
const EXTENDED_DURATION_SUBJECTS = new Set(['Mathematics', 'Reasoning']);

// Quiz presets matching the API
const quizPresets: QuizPreset[] = [
  {
    subject: 'Current Affairs',
    difficulty: 'moderate',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
    icon: <PublicIcon fontSize="large" />,
    color: '#2563eb',
    description: 'Latest news, events, and government schemes',
  },
  {
    subject: 'Mathematics',
    difficulty: 'hard',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
    icon: <CalculateIcon fontSize="large" />,
    color: '#7c3aed',
    description: 'Challenging mathematical problems',
    apiProvider: 'hf-mcq',
    apiEndpoint: MATHEMATICS_QUIZ_API_ENDPOINT,
    apiSubject: 'Mathematics',
    hfSection: 'quant',
  },
  {
    subject: 'General Knowledge',
    difficulty: 'easy',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
    icon: <SchoolIcon fontSize="large" />,
    color: '#10b981',
    description: 'Basic GK questions for practice',
  },
  {
    subject: 'English',
    difficulty: 'moderate',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
    icon: <LanguageIcon fontSize="large" />,
    color: '#f59e0b',
    description: 'Grammar, vocabulary, and comprehension',
    apiProvider: 'hf-mcq',
    apiEndpoint: MATHEMATICS_QUIZ_API_ENDPOINT,
    apiSubject: 'English',
    hfSection: 'english',
  },
  {
    subject: 'Reasoning',
    difficulty: 'moderate',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
    icon: <PsychologyIcon fontSize="large" />,
    color: '#ec4899',
    description: 'Logical reasoning and analytical ability',
    apiProvider: 'hf-mcq',
    apiEndpoint: MATHEMATICS_QUIZ_API_ENDPOINT,
    apiSubject: 'Reasoning',
    hfSection: 'reasoning',
  },
  {
    subject: 'Hindi',
    difficulty: 'moderate',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
    icon: <TranslateIcon fontSize="large" />,
    color: '#14b8a6',
    description: 'Hindi grammar and comprehension',
  },
  {
    subject: 'Computer Knowledge',
    difficulty: 'easy',
    numQuestions: FIXED_QUESTIONS_PER_SUBJECT,
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

interface HfMathQuestion {
  section: string;
  question: string;
  options: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  answer?: string;
}

interface HfMathResponse {
  count: number;
  seed: number;
  mix: string;
  questions: HfMathQuestion[];
}

const buildHfMix = (section: 'quant' | 'reasoning' | 'english' | 'polity', count: number) => {
  const counts = {
    quant: 0,
    reasoning: 0,
    english: 0,
    polity: 0,
  };

  counts[section] = count;

  return `quant:${counts.quant},reasoning:${counts.reasoning},english:${counts.english},polity:${counts.polity}`;
};

let lastGeneratedSeed: number | null = null;
let seedRequestCounter = 0;

const generateUniqueSeed = () => {
  const overrideBase = MATHEMATICS_QUIZ_SEED_OVERRIDE ? Number(MATHEMATICS_QUIZ_SEED_OVERRIDE) : NaN;
  const base = Number.isFinite(overrideBase) ? overrideBase : Math.floor(Math.random() * 1_000_000_000);

  seedRequestCounter = (seedRequestCounter + 1) % 1_000_000_000;

  let seed = Math.floor((base + Date.now() + seedRequestCounter) % 1_000_000_000);

  if (seed === lastGeneratedSeed) {
    seed = (seed + 1) % 1_000_000_000;
  }

  lastGeneratedSeed = seed;
  return seed;
};

const createRequestNonce = () => `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;

const getQuizDurationMinutes = (preset: Pick<QuizPreset, 'subject' | 'numQuestions'>) => {
  if (EXTENDED_DURATION_SUBJECTS.has(preset.subject)) {
    return preset.numQuestions;
  }

  return Math.min(STANDARD_MAX_DURATION_MINUTES, preset.numQuestions);
};

const mapMathResponseToQuiz = (preset: QuizPreset, data: HfMathResponse): QuizResponse => {
  const questions = (data.questions || []).slice(0, preset.numQuestions).map((q, index) => ({
    id: `math-${index + 1}`,
    questionText: q.question,
    optionA: q.options?.A || '',
    optionB: q.options?.B || '',
    optionC: q.options?.C || '',
    optionD: q.options?.D || '',
    correctOption: q.answer || '',
    explanation: '',
    timeToSolveSeconds: 60,
  }));

  if (questions.length === 0) {
    throw new Error('Mathematics API returned no questions');
  }

  const generatedId = `math-quick-${Date.now()}`;

  return {
    message: 'Quiz generated successfully',
    test: {
      id: generatedId,
      title: `${preset.subject} Quick Quiz`,
      subject: preset.subject,
      difficulty: preset.difficulty,
      numQuestions: questions.length,
      durationMinutes: getQuizDurationMinutes(preset),
      questions,
    },
  };
};

export default function QuickQuiz() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedQuizzes, setBookmarkedQuizzes] = useState<number[]>([]);
  const [likedQuizzes, setLikedQuizzes] = useState<number[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  // Mutation to generate quiz - Direct API call
  const generateQuizMutation = useMutation({
    mutationFn: async (preset: QuizPreset) => {
      if (preset.apiProvider === 'hf-mcq') {
        const endpoint = preset.apiEndpoint || MATHEMATICS_QUIZ_API_ENDPOINT;
        const section = preset.hfSection || 'quant';
        const seed = generateUniqueSeed();
        const requestNonce = createRequestNonce();
        const mathPayload = {
          count: preset.numQuestions,
          mix: buildHfMix(section, preset.numQuestions),
          seed,
          include_answers: true,
        };

        console.log('Calling Mathematics API with:', {
          endpoint,
          requestNonce,
          ...mathPayload,
        });

        const mathResponse = await axios.post<HfMathResponse>(endpoint, mathPayload, {
          timeout: 240000,
          params: {
            _: requestNonce,
          },
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        const normalized = mapMathResponseToQuiz(preset, mathResponse.data);
        console.log('Mathematics API Response (normalized):', normalized);
        return normalized;
      }

      const apiPath = preset.apiPath || DEFAULT_QUIZ_API_PATH;
      const endpoint = `${QUIZ_API_BASE_URL}${apiPath}`;
      const subjectForApi = preset.apiSubject || preset.subject;
      const requestNonce = createRequestNonce();

      console.log('Calling external API directly with:', {
        endpoint,
        requestNonce,
        subject: subjectForApi,
        difficulty: preset.difficulty,
        numQuestions: preset.numQuestions,
      });
      
      try {
        const response = await axios.post<QuizResponse>(
          endpoint,
          {
            subject: subjectForApi,
            difficulty: preset.difficulty,
            numQuestions: preset.numQuestions,
          },
          {
            timeout: 240000, // 240 second timeout
            params: {
              _: requestNonce,
            },
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        );

        if (Array.isArray(response.data?.test?.questions)) {
          response.data.test.questions = response.data.test.questions.slice(0, preset.numQuestions);
          response.data.test.numQuestions = response.data.test.questions.length;
        }
        response.data.test.durationMinutes = getQuizDurationMinutes(preset);
        
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

  const handleStartQuiz = (preset: QuizPreset) => {
    setError(null);
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
            Quick Practice Quizzes
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
            No login required! Start practicing instantly with AI-generated quizzes
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
              This may take up to a few seconds. Please wait.
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
                          {getQuizDurationMinutes(preset)} Minutes
                        </Typography>
                      </Box>
                    </Box>

                    {/* Topic Tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {['Quick Practice', 'Core', '+1'].map((tag, i) => (
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
            Why Quick Quizzes?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                ⚡ Instant Start
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No sign-up required. Click and start practicing immediately.
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
