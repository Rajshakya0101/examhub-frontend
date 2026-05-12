import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Cancel as WrongIcon,
  ArrowForward as NextIcon,
  ArrowBack as PrevIcon,
  Flag as FlagIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useUpdateUserStats } from '@/hooks/useUserStats';
import { useUpdateLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthState } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { saveTestAttempt, type Achievement } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import { AchievementModal } from '@/components/common/AchievementModal';

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  timeToSolveSeconds: number;
  subject?: string; // Add subject field for section-wise organization
  section?: string;
}

interface QuizData {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  numQuestions: number;
  durationMinutes: number;
  questions: Question[];
}

const isRRBNTPCExam = (quiz?: QuizData | null) => {
  if (!quiz) return false;
  const source = `${quiz.title || ''} ${quiz.id || ''}`.toLowerCase();
  return /rrb\s*ntpc|rrb-?ntpc/.test(source);
};

export default function QuickQuizPlayer() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const updateStats = useUpdateUserStats();
  const updateLeaderboard = useUpdateLeaderboard();
  const queryClient = useQueryClient();
  const user = useAuthState();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState<number>(Date.now()); // Track when quiz started
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(false);

  // Group questions by subject for full mock tests
  const questionsBySection = quizData?.questions.reduce((acc, question, index) => {
    const subject = question.subject || question.section || 'General';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push({ ...question, originalIndex: index });
    return acc;
  }, {} as Record<string, Array<Question & { originalIndex: number }>>);

  const sections = questionsBySection ? Object.keys(questionsBySection) : [];
  const isFullMock = sections.length > 1; // If multiple subjects, it's a full mock

  // Load quiz from sessionStorage
  useEffect(() => {
    // Try all storage keys (quickQuiz, fullMockTest, sectionalMockTest, topicWiseMockTest)
    const storedQuickQuiz = sessionStorage.getItem('quickQuiz');
    const storedFullMock = sessionStorage.getItem('fullMockTest');
    const storedSectionalMock = sessionStorage.getItem('sectionalMockTest');
    const storedTopicWiseMock = sessionStorage.getItem('topicWiseMockTest');
    
    const storedQuiz = storedQuickQuiz || storedFullMock || storedSectionalMock || storedTopicWiseMock;
    
    if (storedQuiz) {
      const quiz = JSON.parse(storedQuiz) as QuizData;
      setQuizData(quiz);
      
      // Load persisted quiz state if available
      const stateKey = `quizState_${quiz.id}`;
      const storedState = sessionStorage.getItem(stateKey);
      
      if (storedState) {
        const state = JSON.parse(storedState);
        setAnswers(state.answers || {});
        setTimeLeft(state.timeLeft || quiz.durationMinutes * 60);
        setCurrentIndex(state.currentIndex || 0);
        setShowResults(state.showResults || false);
        setCurrentSection(state.currentSection || (quiz.questions[0]?.subject || quiz.questions[0]?.section || null));
        setIsPaused(state.isPaused || false);
      } else {
        // Initialize fresh state
        setTimeLeft(quiz.durationMinutes * 60);
        
        // Set initial section for full mock
        if (quiz.questions.length > 0) {
          setCurrentSection(quiz.questions[0].subject || quiz.questions[0].section || null);
        }
      }
    } else {
      navigate('/quick-quiz');
    }
  }, [quizId, navigate]);

  // Determine which page to return to based on test type
  const getReturnPath = () => {
    const storedFullMock = sessionStorage.getItem('fullMockTest');
    const storedSectionalMock = sessionStorage.getItem('sectionalMockTest');
    const storedQuickQuizOrigin = sessionStorage.getItem('quickQuizOrigin');
    
    if (storedFullMock || storedSectionalMock) {
      return '/tests'; // Return to Tests page for mock tests
    }
    if (storedQuickQuizOrigin === 'practice') {
      return '/practice';
    }
    return '/quick-quiz';
  };

  // Get button text based on test type
  const getReturnButtonText = () => {
    const storedFullMock = sessionStorage.getItem('fullMockTest');
    const storedSectionalMock = sessionStorage.getItem('sectionalMockTest');
    const storedQuickQuizOrigin = sessionStorage.getItem('quickQuizOrigin');
    
    if (storedFullMock || storedSectionalMock) {
      return 'Try Another Test'; // For mock tests from Tests page
    }
    if (storedQuickQuizOrigin === 'practice') {
      return 'Try Another Practice Quiz';
    }
    return 'Try Another Quiz'; // For quick quizzes from Practice page
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || showResults || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults, isPaused]);

  const currentQuestion = quizData?.questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion || showResults) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  // Persist quiz state to sessionStorage whenever it changes
  useEffect(() => {
    if (!quizData) return;
    
    const stateKey = `quizState_${quizData.id}`;
    const state = {
      answers,
      timeLeft,
      currentIndex,
      showResults,
      currentSection,
      isPaused,
    };
    
    sessionStorage.setItem(stateKey, JSON.stringify(state));
  }, [quizData, answers, timeLeft, currentIndex, showResults, currentSection, isPaused]);

  const handleNext = () => {
    if (quizData && currentIndex < quizData.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      delete nextAnswers[currentQuestion.id];
      return nextAnswers;
    });
  };

  const optionToIndex = (option?: string | null) => {
    if (!option) return null;
    const normalized = option.trim().toUpperCase();
    if (normalized === 'A') return 0;
    if (normalized === 'B') return 1;
    if (normalized === 'C') return 2;
    if (normalized === 'D') return 3;
    return null;
  };

  const handleSubmit = async () => {
    setConfirmSubmit(false);

    // Calculate time spent on quiz
    const timeSpentSec = Math.floor((Date.now() - startTime) / 1000);

    // Calculate score details
    const scoreData = calculateScore();

    if (!quizData || !user) {
      // Fallback path for unauthenticated sessions.
      setShowResults(true);
      return;
    }

    const isFullMock = Boolean(sessionStorage.getItem('fullMockTest'));
    const isSectionalMock = Boolean(sessionStorage.getItem('sectionalMockTest'));
    const isTopicWiseMock = Boolean(sessionStorage.getItem('topicWiseMockTest'));
    const isQuickPractice = sessionStorage.getItem('quickQuizOrigin') === 'practice';
    const attemptTestType = isFullMock
      ? 'full-mock'
      : isSectionalMock
        ? 'sectional-mock'
        : isTopicWiseMock
          ? 'topic-wise-mock'
          : isQuickPractice
            ? 'quick-practice'
            : 'quick-quiz';

    updateStats.mutate({
      testId: quizData.id,
      questionsAnswered: scoreData.correct + scoreData.incorrect,
      correctAnswers: scoreData.correct,
      incorrectAnswers: scoreData.incorrect,
      skippedQuestions: scoreData.unanswered,
      timeSpentSec: timeSpentSec,
      score: scoreData.percentage,
    }, {
      onSuccess: (result) => {
        if (result && result.newAchievements.length > 0) {
          setNewAchievements(result.newAchievements);
          setStreakMilestone(result.streakMilestone);
          setShowAchievements(true);
        } else if (result && result.streakMilestone) {
          setStreakMilestone(true);
          setShowAchievements(true);
        }

        updateLeaderboard.mutate();
      }
    });

    try {
      const questionSnapshots = quizData.questions.map((q) => ({
        id: q.id,
        section: q.section || q.subject || 'General',
        subject: q.subject || q.section || 'General',
        topic: q.subject || q.section || 'General',
        stem: q.questionText,
        questionText: q.questionText,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctIndex: optionToIndex(q.correctOption) ?? 0,
        correctOption: q.correctOption,
        explanation: q.explanation,
      }));

      const answerEntries = quizData.questions.map((q) => {
        const selectedOption = answers[q.id] ?? null;
        return {
          questionId: q.id,
          selectedIdx: optionToIndex(selectedOption),
          selectedOption,
          timeSpentMs: 0,
        };
      });

      const attemptId = await saveTestAttempt({
        userId: user.uid,
        examId: quizData.id,
        examTitle: quizData.title,
        status: 'completed',
        testType: attemptTestType,
        startedAt: Timestamp.fromMillis(startTime),
        submittedAt: Timestamp.now(),
        timeSpentSec: timeSpentSec,
        score: {
          raw: Number(Number(scoreData.rawMarks).toFixed(2)),
          percentage: Number(Number(scoreData.percentage).toFixed(2)),
        },
        maxMarks: quizData.questions.length * (isRRBNTPCExam(quizData) ? 1 : 2),
        questionStats: {
          total: quizData.questions.length,
          attempted: scoreData.correct + scoreData.incorrect,
          correct: scoreData.correct,
          incorrect: scoreData.incorrect,
          skipped: scoreData.unanswered,
        },
        questionSnapshots,
        answers: answerEntries,
      });

      queryClient.invalidateQueries({ queryKey: ['attempts', user.uid] });
      queryClient.invalidateQueries({ queryKey: ['attempts', user.uid, 'recent'] });

      navigate(`/analysis/${attemptId}`, { replace: true });
    } catch (error) {
      console.error('Error saving attempt:', error);
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, incorrect: 0, unanswered: 0, rawMarks: 0, percentage: 0 };

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    quizData.questions.forEach((q) => {
      const answer = answers[q.id];
      if (!answer) {
        unanswered++;
      } else if (answer === q.correctOption) {
        correct++;
      } else {
        incorrect++;
      }
    });

    // Exam-specific marking scheme
    // RRB NTPC: +1, -1/3, 0
    // Others (CGL/CHSL/default): +2, -0.5, 0
    const isRRBNTPC = isRRBNTPCExam(quizData);
    const MARKS_PER_CORRECT = isRRBNTPC ? 1 : 2;
    const MARKS_PER_WRONG = isRRBNTPC ? -(1 / 3) : -0.5;
    const MARKS_PER_UNATTEMPTED = 0;

    const totalMarks = (correct * MARKS_PER_CORRECT) + (incorrect * MARKS_PER_WRONG) + (unanswered * MARKS_PER_UNATTEMPTED);
    const maxMarks = quizData.questions.length * MARKS_PER_CORRECT;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    return { correct, incorrect, unanswered, rawMarks: totalMarks, percentage };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Quiz not found. Please start a new quiz.</Alert>
        <Button variant="contained" onClick={() => navigate('/quick-quiz')} sx={{ mt: 2 }}>
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  const score = calculateScore();

  // Results View
  if (showResults) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Score Card */}
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {score.percentage.toFixed(2)}%
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Marks: {score.rawMarks.toFixed(2)} / {(quizData.questions.length * 2).toFixed(2)}
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {score.percentage >= 80 ? '🎉 Excellent!' : score.percentage >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <CardContent>
                  <CheckIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
                  <Typography variant="h4" fontWeight={600}>{score.correct}</Typography>
                  <Typography variant="body2" color="text.secondary">Correct</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                <CardContent>
                  <WrongIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
                  <Typography variant="h4" fontWeight={600}>{score.incorrect}</Typography>
                  <Typography variant="body2" color="text.secondary">Incorrect</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <CardContent>
                  <FlagIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
                  <Typography variant="h4" fontWeight={600}>{score.unanswered}</Typography>
                  <Typography variant="body2" color="text.secondary">Unanswered</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(getReturnPath())}
            >
              {getReturnButtonText()}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowResults(false)}
            >
              Review Answers
            </Button>
          </Box>
        </Paper>

        {/* Question Review */}
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Review Your Answers
        </Typography>

        {isFullMock && sections.length > 1 ? (
          // Section-wise review for full mock
          sections.map((section) => {
            const sectionQuestions = questionsBySection![section];
            const sectionScore = sectionQuestions.reduce((acc, q) => {
              const answer = answers[q.id];
              if (answer === q.correctOption) acc.correct++;
              else if (answer) acc.incorrect++;
              else acc.unanswered++;
              return acc;
            }, { correct: 0, incorrect: 0, unanswered: 0 });

            return (
              <Box key={section} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <Typography variant="h6" fontWeight={600}>
                    {section}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Chip label={`✓ ${sectionScore.correct}`} color="success" size="small" />
                    <Chip label={`✗ ${sectionScore.incorrect}`} color="error" size="small" />
                    <Chip label={`- ${sectionScore.unanswered}`} color="default" size="small" />
                  </Box>
                </Paper>

                {sectionQuestions.map((question) => {
                  const userAnswer = answers[question.id];
                  const isCorrect = userAnswer === question.correctOption;
                  const wasAnswered = !!userAnswer;
                  const index = question.originalIndex;

                  return (
                    <Paper key={question.id} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip
                          label={`Q${index + 1}`}
                          sx={{ mr: 2 }}
                          color={!wasAnswered ? 'default' : isCorrect ? 'success' : 'error'}
                        />
                        {isCorrect && <CheckIcon color="success" />}
                        {wasAnswered && !isCorrect && <WrongIcon color="error" />}
                      </Box>

                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {question.questionText}
                      </Typography>

                      <RadioGroup value={userAnswer || ''}>
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const optionKey = `option${option}` as keyof Question;
                          const isUserAnswer = userAnswer === option;
                          const isCorrectAnswer = question.correctOption === option;

                          return (
                            <FormControlLabel
                              key={option}
                              value={option}
                              control={<Radio disabled />}
                              label={question[optionKey] as string}
                              sx={{
                                bgcolor: isCorrectAnswer
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : isUserAnswer
                                  ? alpha(theme.palette.error.main, 0.1)
                                  : 'transparent',
                                borderRadius: 1,
                                px: 2,
                                py: 0.5,
                                mb: 1,
                              }}
                            />
                          );
                        })}
                      </RadioGroup>

                      {/* Always show explanation and correct answer */}
                      <Alert severity={isCorrect ? 'success' : wasAnswered ? 'error' : 'info'} sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {isCorrect ? '✓ Correct!' : wasAnswered ? `✗ Your answer: ${userAnswer}. Correct answer: ${question.correctOption}` : `Correct answer: ${question.correctOption}`}
                        </Typography>
                        {question.explanation && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Explanation:</strong> {question.explanation}
                          </Typography>
                        )}
                      </Alert>
                    </Paper>
                  );
                })}
              </Box>
            );
          })
        ) : (
          // Regular review for quick quiz
          quizData.questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer === question.correctOption;
          const wasAnswered = !!userAnswer;

          return (
            <Paper key={question.id} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={`Q${index + 1}`}
                  sx={{ mr: 2 }}
                  color={!wasAnswered ? 'default' : isCorrect ? 'success' : 'error'}
                />
                {isCorrect && <CheckIcon color="success" />}
                {wasAnswered && !isCorrect && <WrongIcon color="error" />}
              </Box>

              <Typography variant="body1" fontWeight={500} gutterBottom>
                {question.questionText}
              </Typography>

              <RadioGroup value={userAnswer || ''}>
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionKey = `option${option}` as keyof Question;
                  const isUserAnswer = userAnswer === option;
                  const isCorrectAnswer = question.correctOption === option;

                  return (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio disabled />}
                      label={question[optionKey] as string}
                      sx={{
                        bgcolor: isCorrectAnswer
                          ? alpha(theme.palette.success.main, 0.1)
                          : isUserAnswer
                          ? alpha(theme.palette.error.main, 0.1)
                          : 'transparent',
                        borderRadius: 1,
                        px: 2,
                        py: 0.5,
                        mb: 1,
                      }}
                    />
                  );
                })}
              </RadioGroup>

              {/* Always show explanation and correct answer */}
              <Alert severity={isCorrect ? 'success' : wasAnswered ? 'error' : 'info'} sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  {isCorrect ? '✓ Correct!' : wasAnswered ? `✗ Your answer: ${userAnswer}. Correct answer: ${question.correctOption}` : `Correct answer: ${question.correctOption}`}
                </Typography>
                {question.explanation && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Explanation:</strong> {question.explanation}
                  </Typography>
                )}
              </Alert>
            </Paper>
          );
        })
      )}
      </Container>
    );
  }

  // Quiz Player View
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs>
              <Typography variant="h6" fontWeight={600}>
                {quizData.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Question {currentIndex + 1} of {quizData.questions.length}
                {isFullMock && (currentQuestion?.subject || currentQuestion?.section) && (
                  <Chip 
                    label={currentQuestion.subject || currentQuestion.section} 
                    size="small" 
                    sx={{ ml: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<TimerIcon />}
                  label={formatTime(timeLeft)}
                  color={timeLeft < 60 ? 'error' : 'primary'}
                  sx={{ fontWeight: 600, fontSize: '1rem', px: 2 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsPaused(!isPaused)}
                  startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
                  color={isPaused ? 'success' : 'primary'}
                  sx={{ minWidth: '100px' }}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </Box>
            </Grid>
          </Grid>
          <LinearProgress
            variant="determinate"
            value={(currentIndex / quizData.questions.length) * 100}
            sx={{ mt: 2, height: 6, borderRadius: 3 }}
          />
        </Container>
      </Paper>

      {/* Section Navigation for Full Mock */}
      {isFullMock && sections.length > 1 && (
        <Container maxWidth="lg" sx={{ mb: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Sections:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {sections.map((section) => {
                const sectionQuestions = questionsBySection![section];
                const sectionAnswered = sectionQuestions.filter(q => answers[q.id]).length;
                const isCurrentSection = (currentQuestion?.subject || currentQuestion?.section) === section;
                
                return (
                  <Chip
                    key={section}
                    label={`${section} (${sectionAnswered}/${sectionQuestions.length})`}
                    onClick={() => {
                      const firstQuestionIndex = sectionQuestions[0].originalIndex;
                      setCurrentIndex(firstQuestionIndex);
                      setCurrentSection(section);
                    }}
                    color={isCurrentSection ? 'primary' : 'default'}
                    variant={isCurrentSection ? 'filled' : 'outlined'}
                    sx={{ fontWeight: isCurrentSection ? 600 : 400 }}
                  />
                );
              })}
            </Box>
          </Paper>
        </Container>
      )}

      {/* Main Content Area with Sidebar */}
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {/* Left Sidebar - Question Palette */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 80, maxHeight: '70vh', overflow: 'auto' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Question Palette
              </Typography>
              
              {isFullMock && sections.length > 1 ? (
                // Section-wise palette for full mock
                <Box>
                  {sections.map((section) => {
                    const sectionQuestions = questionsBySection![section];
                    return (
                      <Box key={section} sx={{ mb: 2 }}>
                        <Typography 
                          variant="caption" 
                          fontWeight={600} 
                          color="text.secondary"
                          sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}
                        >
                          {section}
                        </Typography>
                        <Grid container spacing={0.5}>
                          {sectionQuestions.map((q) => {
                            const idx = q.originalIndex;
                            return (
                              <Grid item xs={3} key={q.id}>
                                <Button
                                  variant={idx === currentIndex ? 'contained' : 'outlined'}
                                  color={answers[q.id] ? 'success' : 'primary'}
                                  onClick={() => setCurrentIndex(idx)}
                                  size="small"
                                  sx={{ 
                                    minWidth: 32, 
                                    height: 32, 
                                    width: '100%',
                                    fontSize: '0.7rem',
                                    p: 0,
                                  }}
                                >
                                  {idx + 1}
                                </Button>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                // Flat palette for quick/topic-wise quizzes
                <Grid container spacing={1}>
                  {quizData.questions.map((q, idx) => (
                    <Grid item xs={3} key={q.id}>
                      <Button
                        variant={idx === currentIndex ? 'contained' : 'outlined'}
                        color={answers[q.id] ? 'success' : 'primary'}
                        onClick={() => setCurrentIndex(idx)}
                        sx={{ minWidth: 40, height: 40, width: '100%' }}
                      >
                        {idx + 1}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Right Content - Question and Navigation */}
          <Grid item xs={12} md={9}>
            {/* Question Content */}
            <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" fontWeight={300} gutterBottom>
                {currentQuestion?.questionText}
              </Typography>

              <RadioGroup value={selectedAnswer || ''} onChange={(e) => handleSelectAnswer(e.target.value)}>
                {currentQuestion &&
                  ['A', 'B', 'C', 'D'].map((option) => {
                    const optionKey = `option${option}` as keyof Question;
                    return (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio />}
                        label={currentQuestion[optionKey] as string}
                        sx={{
                          border: `2px solid ${
                            selectedAnswer === option ? theme.palette.primary.main : 'transparent'
                          }`,
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          mb: 1,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      />
                    );
                  })}
              </RadioGroup>
            </Paper>

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<PrevIcon />}
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              <Button
                variant="outlined"
                color="warning"
                onClick={handleClearResponse}
                disabled={!selectedAnswer}
              >
                Clear Response
              </Button>

              <Button variant="contained" color="error" onClick={() => setConfirmSubmit(true)}>
                Submit Quiz
              </Button>

              <Button
                variant="outlined"
                endIcon={<NextIcon />}
                onClick={handleNext}
                disabled={currentIndex === quizData.questions.length - 1}
              >
                Next
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Confirm Submit Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Submit Quiz?</DialogTitle>
        <DialogContent>
          <Typography>
            You have answered {Object.keys(answers).length} out of {quizData.questions.length}{' '}
            questions. Are you sure you want to submit?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="error">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Achievement Modal */}
      <AchievementModal
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        achievements={newAchievements}
        streakMilestone={streakMilestone}
      />
    </Box>
  );
}
