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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const NEW_MCQ_API_BASE_URL = 'https://pranova-mcq-new.hf.space';
const NEW_MCQ_API_ENDPOINT = '/generate-test';

interface NewMcqQuestion {
  id: string;
  section: string;
  question: string;
  options: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  topic: string;
  answer: string;
}

interface NewMcqResponse {
  mode: string;
  exam: string;
  requested: {
    mode: string;
    exam: string;
    section: string;
    topic: null | string;
    count: number;
    seed: number;
    include_answers: boolean;
  };
  count: number;
  distribution: Record<string, number>;
  questions: NewMcqQuestion[];
}

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
      subject?: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation: string;
      shortcut: string;
      timeToSolveSeconds: number;
    }>;
  };
  provider: string;
}

const generateSeed = () => {
  return Math.floor(Math.random() * 1_000_000_000);
};

const createRequestNonce = () => `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;

const mapExamToApiFormat = (examValue: string): string => {
  if (examValue === 'SSC Combined Graduate Level') return 'SSC_CGL';
  if (examValue === 'SSC CHSL') return 'SSC_CHSL';
  if (examValue === 'Railway RRB NTPC') return 'RRB_NTPC';
  return 'SSC_CGL';
};

const mapSubjectToApiSection = (examValue: string, subject: string): 'quant' | 'reasoning' | 'english' | 'gk' => {
  if (subject === 'Quantitative Aptitude' || subject === 'Mathematics') return 'quant';
  if (subject === 'Reasoning') return 'reasoning';
  if (subject === 'English Language') return 'english';
  if (subject === 'General Awareness' || subject === 'GK/GS' || subject === 'Science') return 'gk';

  if (examValue === 'Railway RRB NTPC') {
    if (subject === 'GK/GS') return 'gk';
    if (subject === 'Mathematics') return 'quant';
    if (subject === 'Reasoning') return 'reasoning';
  }

  return 'quant';
};

const getSectionConfig = (examValue: string, subject: string) => {
  const section = mapSubjectToApiSection(examValue, subject);

  if (examValue === 'Railway RRB NTPC') {
    return {
      section,
      count: section === 'gk' ? 40 : 30,
    };
  }

  return {
    section,
    count: 25,
  };
};

const getSectionDurationMinutes = (examValue: string, subject: string) => {
  if (examValue === 'Railway RRB NTPC') {
    if (subject === 'Mathematics') return 35;
    if (subject === 'Reasoning') return 30;
    if (subject === 'GK/GS') return 25;
  }

  return 15;
};

const mapNewMcqResponseToQuiz = (examValue: string, subject: string, data: NewMcqResponse): QuizResponse => {
  const questions = (data.questions || []).map((question) => ({
    id: question.id,
    subject,
    questionText: question.question,
    optionA: question.options?.A || '',
    optionB: question.options?.B || '',
    optionC: question.options?.C || '',
    optionD: question.options?.D || '',
    correctOption: question.answer || '',
    explanation: '',
    shortcut: '',
    timeToSolveSeconds: 60,
  }));

  if (questions.length === 0) {
    throw new Error('New MCQ API returned no questions');
  }

  const examLabel = examOptions.find((option) => option.value === examValue)?.label || 'Sectional Mock';

  return {
    message: 'Sectional mock test generated successfully',
    test: {
      id: `sectional-mock-${Date.now()}`,
      title: `${examLabel} - ${subject}`,
      subject,
      difficulty: 'mixed',
      numQuestions: questions.length,
      durationMinutes: getSectionDurationMinutes(examValue, subject),
      questions,
    },
  };
};

// Exam options with their subjects
const examOptions = [
  {
    value: 'SSC Combined Graduate Level',
    label: 'SSC CGL',
    subjects: ['Quantitative Aptitude', 'Reasoning', 'English Language', 'General Awareness'],
  },
  {
    value: 'SSC CHSL',
    label: 'SSC CHSL',
    subjects: ['Quantitative Aptitude', 'Reasoning', 'English Language', 'General Awareness'],
  },
  {
    value: 'Railway RRB NTPC',
    label: 'Railway RRB NTPC',
    subjects: ['Mathematics', 'Reasoning', 'GK/GS'],
  },
];

interface SectionalMockResponse {
  message: string;
  test: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    difficulty: string;
    numQuestions: number;
    durationMinutes: number;
    isAIGenerated: boolean;
    createdAt: string;
    questions: Array<{
      id: string;
      examId: string;
      subject: string;
      topic: string;
      difficulty: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation: string;
      shortcut: string;
      timeToSolveSeconds: number;
    }>;
  };
  provider: string;
}

export default function SectionalMock() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState('SSC Combined Graduate Level');
  const [selectedSubject, setSelectedSubject] = useState('Quantitative Aptitude');
  const [showInstructions, setShowInstructions] = useState(false);

  const selectedExamInfo = examOptions.find((e) => e.value === selectedExam);
  const availableSubjects = selectedExamInfo?.subjects || [];

  // Update subject when exam changes
  const handleExamChange = (exam: string) => {
    setSelectedExam(exam);
    const examInfo = examOptions.find((e) => e.value === exam);
    if (examInfo && examInfo.subjects.length > 0) {
      setSelectedSubject(examInfo.subjects[0]);
    }
  };

  // Mutation to generate sectional mock test
  const generateMockMutation = useMutation({
    mutationFn: async () => {
      const endpoint = `${NEW_MCQ_API_BASE_URL}${NEW_MCQ_API_ENDPOINT}`;
      const apiExam = mapExamToApiFormat(selectedExam);
      const { section, count } = getSectionConfig(selectedExam, selectedSubject);
      const seed = generateSeed();
      const requestNonce = createRequestNonce();

      console.log('Calling Sectional Mock API with:', {
        endpoint,
        requestNonce,
        mode: 'sectional',
        exam: apiExam,
        section,
        count,
        seed,
        include_answers: true,
      });

      try {
        const response = await axios.post<NewMcqResponse>(
          endpoint,
          {
            mode: 'sectional',
            exam: apiExam,
            section,
            count,
            seed,
            include_answers: true,
          },
          {
            timeout: 300000, // 5 minute timeout
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

        const normalized = mapNewMcqResponseToQuiz(selectedExam, selectedSubject, response.data);
        console.log('Sectional Mock Response (normalized):', normalized);
        return normalized;
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

      // Store test data in sessionStorage
      sessionStorage.setItem('sectionalMockTest', JSON.stringify(data.test));

      // Show instructions modal instead of navigating directly
      setShowInstructions(true);
    },
    onError: (error: any) => {
      console.error('Sectional mock generation failed:', error);

      let errorMessage = 'Unable to generate sectional mock test. Please try again.';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Server may be waking up. Please try again in 30 seconds.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service is starting up. Please wait 30 seconds and try again.';
      } else if (error.response) {
        errorMessage = error.response?.data?.message || `Server error: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Cannot reach the server. Please check your connection.';
      }

      setError(errorMessage);
    },
  });

  const handleStartTest = () => {
    setError(null);
    generateMockMutation.mutate();
  };

  const handleConfirmStart = () => {
    setShowInstructions(false);
    // Get the stored test data to navigate with its ID
    const storedTest = sessionStorage.getItem('sectionalMockTest');
    if (storedTest) {
      const test = JSON.parse(storedTest);
      navigate(`/quick-quiz/${test.id}`);
    }
  };

  return (
    <Box
      sx={{
        background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
        minHeight: '100vh',
        pb: 8,
      }}
    >
      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onClose={() => setShowInstructions(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            Mock Test Instructions
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
              <ListItemText primary="• You can navigate between questions using Previous/Next buttons" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Use the question palette to jump to any question directly" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• You can pause the timer if needed" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Submit the test only after reviewing all questions" />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            📊 Marking Scheme
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon sx={{ color: theme.palette.success.main }} />
              </ListItemIcon>
              <ListItemText 
                primary="Correct Answer: +2 Marks" 
                secondary="Each correct answer awards 2 marks"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WrongIcon sx={{ color: theme.palette.error.main }} />
              </ListItemIcon>
              <ListItemText 
                primary="Wrong Answer: -0.5 Marks (Negative Marking)" 
                secondary="One-fourth (1/4) marks will be deducted for each wrong answer"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon sx={{ color: theme.palette.warning.main }} />
              </ListItemIcon>
              <ListItemText 
                primary="Unattempted: 0 Marks" 
                secondary="No marks will be awarded or deducted for unattempted questions"
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tip:</strong> It's better to leave a question unattempted if you're not confident about the answer, to avoid negative marking.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowInstructions(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmStart} variant="contained" size="large">
            I Understand, Start Test
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
              WebkitTextFillColor: 'transparent',
            }}
          >
            Sectional Mock Tests
          </Typography>

          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
            Practice specific subjects with customized question counts
          </Typography>

          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <TrophyIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Grid>
              <Grid item xs>
                <Typography variant="body1" fontWeight={500}>
                  🎯 Subject-Specific Practice • ⚡ AI-Generated • 🔧 Customizable • 🆓 Free
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Focus on individual subjects to strengthen your weak areas
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
        {generateMockMutation.isPending && (
          <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Generating your sectional mock test...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take 2-3 minutes. Please wait.
            </Typography>
          </Paper>
        )}

        {/* Configuration Card */}
        {!generateMockMutation.isPending && (
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Configure Your Sectional Test
              </Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                {/* Exam Selection */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Exam</InputLabel>
                    <Select
                      value={selectedExam}
                      label="Select Exam"
                      onChange={(e) => handleExamChange(e.target.value)}
                    >
                      {examOptions.map((exam) => (
                        <MenuItem key={exam.value} value={exam.value}>
                          {exam.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Subject Selection */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Subject</InputLabel>
                    <Select
                      value={selectedSubject}
                      label="Select Subject"
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      {availableSubjects.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Test Info Display */}
              <Box sx={{ mt: 4, p: 3, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AssessmentIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        {selectedExam.split(' ').slice(0, 2).join(' ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exam
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <SchoolIcon sx={{ fontSize: 32, color: theme.palette.success.main }} />
                      <Typography variant="h6" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                        {selectedSubject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Subject
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <TimerIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        Auto
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>

            <CardActions sx={{ p: 3, pt: 0 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleStartTest}
                disabled={generateMockMutation.isPending}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                Generate & Start Test
              </Button>
            </CardActions>
          </Card>
        )}
      </Container>
    </Box>
  );
}
