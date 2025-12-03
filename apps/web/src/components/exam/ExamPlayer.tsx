import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Drawer,
  FormControlLabel,
  Radio,
  RadioGroup,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { useTimerStore } from '@/lib/store';
import { submitAttempt, saveAnswer } from '@/lib/firestoreAttempts';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/auth';

// Types
interface Question {
  id: string;
  section: string;
  stem: string;
  options: string[];
  correctIndex?: number; // Only available after submission
}

interface QuestionWithAnswer extends Question {
  selectedIdx: number | null;
  timeSpentMs: number;
  correctBool?: boolean; // Only available after submission
}

// Format time remaining in MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function ExamPlayer() {
  const { examId, attemptId } = useParams<{ examId: string, attemptId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const user = useAuthState();
  
  // Timer state from Zustand
  const { timeLeft, startTimer, pauseTimer } = useTimerStore();
  
  // Local state
  const [isPaletteOpen, setIsPaletteOpen] = useState(!isMobile);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [attemptDocId, setAttemptDocId] = useState<string | null>(null);
  
  // Get current question
  const currentQuestion = questions[currentQuestionIdx];

  // Load questions and exam data from Firestore
  useEffect(() => {
    const loadExam = async () => {
      if (!examId || !user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch test document
        const testDoc = await getDoc(doc(db, 'tests', examId));
        
        if (!testDoc.exists()) {
          setError('Test not found');
          return;
        }
        
        const testData = testDoc.data();
        const questionIds = testData.questionIds || [];
        
        if (questionIds.length === 0) {
          setError('No questions found for this test');
          return;
        }
        
        // Fetch all questions
        const questionsPromises = questionIds.map((qId: string) =>
          getDoc(doc(db, 'questions', qId))
        );
        
        const questionDocs = await Promise.all(questionsPromises);
        
        const loadedQuestions: QuestionWithAnswer[] = questionDocs
          .filter(qDoc => qDoc.exists())
          .map(qDoc => {
            const qData = qDoc.data();
            return {
              id: qDoc.id,
              section: qData.topic || 'General',
              stem: qData.stem || qData.question || 'Question not available',
              options: qData.options || [],
              correctIndex: qData.correctIndex,
              selectedIdx: null,
              timeSpentMs: 0
            };
          });
        
        if (loadedQuestions.length === 0) {
          setError('No valid questions found');
          return;
        }
        
        setQuestions(loadedQuestions);
        
        // Extract unique sections
        const uniqueSections = [...new Set(loadedQuestions.map(q => q.section))];
        setSections(uniqueSections);
        setCurrentSection(uniqueSections[0]);
        
        // Create attempt document if new attempt
        if (attemptId === 'new') {
          const attemptData = {
            testId: examId,
            userId: user.uid,
            startedAt: Timestamp.now(),
            status: 'in-progress',
            answers: {},
            timeSpent: 0
          };
          
          const attemptRef = await addDoc(collection(db, 'attempts'), attemptData);
          setAttemptDocId(attemptRef.id);
        } else {
          setAttemptDocId(attemptId || null);
        }
        
        // Start timer with test duration (convert minutes to seconds)
        const duration = testData.durationMinutes || 60;
        startTimer(duration * 60);
        
      } catch (error) {
        console.error('Error loading exam:', error);
        setError(error instanceof Error ? error.message : 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    
    loadExam();
    
    // Setup keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-4 for options
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        handleSelectOption(optionIdx);
      }
      
      // N for next, P for previous
      if (e.key === 'n' || e.key === 'N') {
        handleNextQuestion();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrevQuestion();
      }
      
      // S for submit
      if (e.key === 's' || e.key === 'S') {
        handleSubmitConfirm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [attemptId, examId, startTimer]);

  // Handler for selecting an option
  const handleSelectOption = useCallback(async (optionIdx: number) => {
    if (!currentQuestion || !attemptDocId) return;
    
    setQuestions(prevQuestions => 
      prevQuestions.map((q, idx) => 
        idx === currentQuestionIdx
          ? { ...q, selectedIdx: optionIdx, timeSpentMs: q.timeSpentMs + 1000 }
          : q
      )
    );
    
    // Save answer to Firestore
    try {
      await saveAnswer(attemptDocId, currentQuestion.id, {
        selectedIdx: optionIdx,
        timeSpentMs: currentQuestion.timeSpentMs + 1000,
        questionId: currentQuestion.id
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  }, [currentQuestion, currentQuestionIdx, attemptDocId]);

  // Navigation handlers
  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  // Submit handlers
  const handleSubmitConfirm = () => {
    setConfirmSubmit(true);
  };

  const handleSubmit = async () => {
    if (!attemptDocId) return;
    
    pauseTimer();
    
    try {
      // Submit attempt to Firestore
      await submitAttempt(attemptDocId, timeLeft, questions);
      
      // Navigate to results page
      navigate(`/analysis/${attemptDocId}`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      setError('Failed to submit exam. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading exam...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">{error}</Typography>
        </Alert>
        <Button variant="contained" onClick={() => navigate('/tests')}>
          Back to Tests
        </Button>
      </Container>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          <Typography variant="h6">No questions available for this test</Typography>
        </Alert>
        <Button variant="contained" onClick={() => navigate('/tests')} sx={{ mt: 2 }}>
          Back to Tests
        </Button>
      </Container>
    );
  }

  // Question palette - shows all questions with their status
  const renderQuestionPalette = () => (
    <Box className="p-4">
      <Typography variant="h6" className="mb-4 font-bold">
        Questions
      </Typography>
      
      {sections.map(section => (
        <Box key={section} className="mb-6">
          <Typography variant="subtitle1" className="mb-2 font-medium">
            {section}
          </Typography>
          <Grid container spacing={1}>
            {questions
              .filter(q => q.section === section)
              .map(q => {
                const questionNumber = questions.findIndex(question => question.id === q.id) + 1;
                const isActive = currentQuestion?.id === q.id;
                const isAnswered = q.selectedIdx !== null;
                
                return (
                  <Grid item key={q.id}>
                    <Button
                      variant={isActive ? "contained" : "outlined"}
                      color={isAnswered ? "success" : "primary"}
                      onClick={() => setCurrentQuestionIdx(questionNumber - 1)}
                      className="min-w-10 h-10"
                    >
                      {questionNumber}
                    </Button>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      ))}
      
      <Box className="mt-4">
        <Typography variant="subtitle2" className="mb-2">
          Legend:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box className="flex items-center">
              <Box className="w-4 h-4 bg-success rounded mr-2"></Box>
              <Typography variant="body2">Answered</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box className="flex items-center">
              <Box className="w-4 h-4 border border-primary rounded mr-2"></Box>
              <Typography variant="body2">Unanswered</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  return (
    <>
      <Box className="h-[calc(100vh-64px)] flex flex-col">
        {/* Timer Bar */}
        <Paper className="p-2 mb-4 flex justify-between items-center sticky top-0 z-10">
          <Typography variant="subtitle1" className="font-medium">
            {examId} - {attemptId}
          </Typography>
          <Box className="flex items-center">
            <Typography variant={timeLeft < 300 ? "h6" : "subtitle1"} color={timeLeft < 300 ? "error" : "inherit"} className="font-bold">
              Time: {formatTime(timeLeft)}
            </Typography>
            
            <Button 
              variant="contained" 
              color="error" 
              className="ml-4"
              onClick={handleSubmitConfirm}
            >
              Submit
            </Button>
          </Box>
        </Paper>

        {/* Main Content */}
        <Grid container spacing={2} className="flex-grow">
          {/* Sections - Desktop Only */}
          {!isTablet && (
            <Grid item xs={2}>
              <Paper className="p-4 h-full">
                <Typography variant="h6" className="mb-4 font-bold">
                  Sections
                </Typography>
                {sections.map(section => (
                  <Button
                    key={section}
                    fullWidth
                    variant={currentSection === section ? "contained" : "text"}
                    color="primary"
                    className="justify-start mb-2"
                    onClick={() => setCurrentSection(section)}
                  >
                    {section}
                  </Button>
                ))}
              </Paper>
            </Grid>
          )}

          {/* Question Display */}
          <Grid item xs={isTablet ? (isPaletteOpen ? 8 : 12) : 7}>
            <Paper className="p-6 h-full flex flex-col">
              <Box className="flex justify-between mb-4">
                <Typography variant="subtitle1" className="font-medium">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </Typography>
                <Typography variant="subtitle1" className="font-medium">
                  {currentQuestion?.section}
                </Typography>
              </Box>

              <Typography variant="h6" className="mb-6">
                {currentQuestion?.stem}
              </Typography>

              <RadioGroup 
                value={currentQuestion?.selectedIdx ?? ''} 
                onChange={(e) => handleSelectOption(parseInt(e.target.value))}
                className="flex-grow mb-6"
              >
                {currentQuestion?.options.map((option, idx) => (
                  <FormControlLabel
                    key={idx}
                    value={idx}
                    control={<Radio />}
                    label={option}
                    className="mb-3 p-2 hover:bg-surface-dark rounded"
                  />
                ))}
              </RadioGroup>

              <Box className="flex justify-between">
                <Button 
                  variant="outlined" 
                  disabled={currentQuestionIdx === 0}
                  onClick={handlePrevQuestion}
                >
                  Previous
                </Button>
                
                <Button 
                  variant="outlined" 
                  disabled={currentQuestionIdx === questions.length - 1}
                  onClick={handleNextQuestion}
                >
                  Next
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Question Palette - Desktop & Tablet */}
          {!isMobile && isPaletteOpen && (
            <Grid item xs={3}>
              <Paper className="h-full overflow-auto">
                {renderQuestionPalette()}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Mobile Palette Drawer */}
      {isMobile && (
        <>
          <Button
            variant="contained"
            color="primary"
            className="fixed bottom-4 right-4 z-10"
            onClick={() => setIsPaletteOpen(true)}
          >
            Questions
          </Button>
          
          <Drawer
            anchor="bottom"
            open={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
          >
            <Box className="h-[60vh] overflow-auto">
              {renderQuestionPalette()}
            </Box>
          </Drawer>
        </>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
      >
        <DialogTitle>Submit Exam?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your exam? You won't be able to change your answers after submission.
          </DialogContentText>
          <Box className="mt-4">
            <Typography variant="subtitle2">
              Answered: {questions.filter(q => q.selectedIdx !== null).length}/{questions.length}
            </Typography>
            <Typography variant="subtitle2">
              Unanswered: {questions.filter(q => q.selectedIdx === null).length}/{questions.length}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}