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
  CircularProgress,
  Alert,
  Paper,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
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
  Timer as TimerIcon,
  Assessment as AssessmentIcon,
  Topic as TopicIcon,
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

// Exam options with their subjects and topics
const quantTopics = [
  'algebra',
  'arithmetic',
  'average',
  'coordinate geometry',
  'data interpretation',
  'geometry',
  'mensuration',
  'number system',
  'percentage',
  'profit and loss',
  'ratio and proportion',
  'simple and compound interest',
  'simplification',
  'statistics',
  'time and work',
  'time, speed and distance',
  'trigonometry',
];

const reasoningTopics = [
  'analogy',
  'blood_relation',
  'coding_decoding',
  'direction_distance',
  'misc_reasoning',
  'puzzle',
  'ranking_order',
  'seating_arrangement',
  'series',
  'syllogism',
];

const englishTopics = [
  'antonyms',
  'articles',
  'idioms and phrases',
  'modals and conditionals',
  'noun',
  'one-word substitution',
  'phrasal verbs',
  'prepositions',
  'pronoun and determiners',
  'subject-verb agreement',
  'synonyms',
  'tenses',
  'verb',
  'voice and narration',
];

const gkTopics = [
  'art_culture',
  'computer',
  'current_affairs',
  'economics',
  'environment',
  'geography',
  'history',
  'polity',
  'science',
  'static_gk',
];

const examOptions = [
  {
    value: 'SSC Combined Graduate Level',
    label: 'SSC CGL',
    subjects: {
      'Quantitative Aptitude': quantTopics,
      'Reasoning': reasoningTopics,
      'English Language': englishTopics,
      'General Awareness': gkTopics,
    },
  },
  {
    value: 'SSC CHSL',
    label: 'SSC CHSL',
    subjects: {
      'Quantitative Aptitude': quantTopics,
      'Reasoning': reasoningTopics,
      'English Language': englishTopics,
      'General Awareness': gkTopics,
    },
  },
  {
    value: 'Railway RRB NTPC',
    label: 'Railway RRB NTPC',
    subjects: {
      'Mathematics': quantTopics,
      'Reasoning': reasoningTopics,
      'General Awareness': gkTopics,
    },
  },
];

interface TopicWiseMockResponse {
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

export default function TopicWiseMock() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState('SSC Combined Graduate Level');
  const [selectedSubject, setSelectedSubject] = useState('Quantitative Aptitude');
  const [selectedTopic, setSelectedTopic] = useState('algebra');
  const [numQuestions, setNumQuestions] = useState(25);
  const [showInstructions, setShowInstructions] = useState(false);

  const selectedExamInfo = examOptions.find((e) => e.value === selectedExam);
  const availableSubjects = selectedExamInfo ? Object.keys(selectedExamInfo.subjects) : [];
  const availableTopics = selectedExamInfo && selectedSubject 
    ? selectedExamInfo.subjects[selectedSubject as keyof typeof selectedExamInfo.subjects] || []
    : [];

  // Update subject and topic when exam changes
  const handleExamChange = (exam: string) => {
    setSelectedExam(exam);
    const examInfo = examOptions.find((e) => e.value === exam);
    if (examInfo) {
      const subjects = Object.keys(examInfo.subjects);
      if (subjects.length > 0) {
        const firstSubject = subjects[0];
        setSelectedSubject(firstSubject);
        const topics = examInfo.subjects[firstSubject as keyof typeof examInfo.subjects];
        if (topics && topics.length > 0) {
          setSelectedTopic(topics[0]);
        }
      }
    }
  };

  // Update topic when subject changes
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    const examInfo = examOptions.find((e) => e.value === selectedExam);
    if (examInfo) {
      const topics = examInfo.subjects[subject as keyof typeof examInfo.subjects];
      if (topics && topics.length > 0) {
        setSelectedTopic(topics[0]);
      }
    }
  };

  // Mutation to generate topic-wise mock test
  const generateMockMutation = useMutation({
    mutationFn: async () => {
      console.log('Calling Topic-wise Mock API with:', {
        exam: selectedExam,
        subject: selectedSubject,
        topic: selectedTopic,
        numQuestions,
      });

      try {
        const response = await axios.post<TopicWiseMockResponse>(
          'https://examhub-2.onrender.com/api/v2/generate-topic-wise-mock',
          {
            exam: selectedExam,
            subject: selectedSubject,
            topic: selectedTopic,
            numQuestions,
          },
          {
            timeout: 300000, // 5 minute timeout
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Topic-wise Mock Response:', response.data);
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

      // Store test data in sessionStorage
      sessionStorage.setItem('topicWiseMockTest', JSON.stringify(data.test));

      // Show instructions modal instead of navigating directly
      setShowInstructions(true);
    },
    onError: (error: any) => {
      console.error('Topic-wise mock generation failed:', error);

      let errorMessage = 'Unable to generate topic-wise mock test. Please try again.';

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
    const storedTest = sessionStorage.getItem('topicWiseMockTest');
    if (storedTest) {
      const test = JSON.parse(storedTest);
      navigate(`/quick-quiz/${test.id}`);
    }
  };

  // Calculate duration based on subject
  const calculateDuration = () => {
    const subjectLower = selectedSubject.toLowerCase();
    if (subjectLower.includes('quantitative') || subjectLower.includes('mathematics')) {
      return Math.ceil(numQuestions * 1);
    } else if (subjectLower.includes('reasoning')) {
      return Math.ceil(numQuestions * 0.8);
    } else if (subjectLower.includes('english')) {
      return Math.ceil(numQuestions * 0.48);
    } else if (subjectLower.includes('general') || subjectLower.includes('awareness')) {
      return Math.ceil(numQuestions * 0.2);
    } else {
      // Default for other subjects
      return Math.ceil(numQuestions * 1);
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
            Topic-wise Mock Tests
          </Typography>

          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
            Master individual topics with focused practice sessions
          </Typography>

          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <TopicIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              </Grid>
              <Grid item xs>
                <Typography variant="body1" fontWeight={500}>
                  🎯 Topic-Specific Deep Dive • ⚡ AI-Generated • 🔧 Fully Customizable • 🆓 Free
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Perfect for mastering specific concepts and strengthening weak topics
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
              Generating your topic-wise mock test...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take 2-3 Minutes. Please wait.
            </Typography>
          </Paper>
        )}

        {/* Configuration Card */}
        {!generateMockMutation.isPending && (
          <Card sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Configure Your Topic Test
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
                      onChange={(e) => handleSubjectChange(e.target.value)}
                    >
                      {availableSubjects.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Topic Selection */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Topic</InputLabel>
                    <Select
                      value={selectedTopic}
                      label="Select Topic"
                      onChange={(e) => setSelectedTopic(e.target.value)}
                    >
                      {availableTopics.map((topic) => (
                        <MenuItem key={topic} value={topic}>
                          {topic}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Number of Questions */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Questions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.max(5, Math.min(25, parseInt(e.target.value) || 25)))}
                    inputProps={{ min: 5, max: 25 }}
                    helperText="Choose between 5 to 25 questions"
                  />
                </Grid>

              </Grid>

              {/* Test Info Display */}
              <Box sx={{ mt: 4, p: 3, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AssessmentIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        {numQuestions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Questions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <TimerIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        {calculateDuration()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Minutes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <TopicIcon sx={{ fontSize: 32, color: theme.palette.success.main }} />
                      <Typography variant="h6" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                        {selectedTopic}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Topic Focus
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
