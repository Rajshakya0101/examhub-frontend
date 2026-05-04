import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Tabs,
  Tab,
  Stack,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { formatTimestamp } from '@/lib/firestore';

import ChartCard from '@/components/charts/ChartCard';
import QuestionCard from '@/components/exam/QuestionCard';

// Recharts imports
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Types
interface AttemptItem {
  id: string;
  selectedIdx: number | null;
  timeSpentMs: number;
  correctBool?: boolean;
}

interface Question {
  id: string;
  section: string;
  topic: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface Attempt {
  id: string;
  userId: string;
  examId: string;
  status: 'started' | 'submitted';
  startedAt: Date;
  submittedAt?: Date;
  timeLeftSec: number;
  score?: {
    raw: number;
    percentile?: number;
  };
}

export default function Analysis() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  // Get attempt data
  const { data: attempt, isLoading: attemptLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      if (!attemptId) return null;

      const docRef = doc(db, 'attempts', attemptId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Attempt not found');
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startedAt: data.startedAt?.toDate(),
        submittedAt: data.submittedAt?.toDate(),
      } as Attempt;
    },
    enabled: !!attemptId,
  });

  // Get attempt items (answers)
  const { data: attemptItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['attempt-items', attemptId],
    queryFn: async () => {
      if (!attemptId) return [];

      // Try older 'attempt_items' collection first
      const itemsRef = collection(db, `attempt_items/${attemptId}/items`);
      let querySnap = await getDocs(itemsRef);

      if (querySnap.empty) {
        // Fallback: answers stored under attempts/{attemptId}/answers
        const answersRef = collection(db, `attempts/${attemptId}/answers`);
        querySnap = await getDocs(answersRef);
      }

      return querySnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as AttemptItem[];
    },
    enabled: !!attemptId,
  });

  // Get exam questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['exam-questions', attempt?.examId],
    queryFn: async () => {
      if (!attempt?.examId) return [];

      // Fetch the test document to obtain question IDs
      const testDoc = await getDoc(doc(db, 'tests', attempt.examId));
      if (!testDoc.exists()) return [];

      const testData: any = testDoc.data();
      const questionIds: string[] = testData.questionIds || testData.questions || [];

      if (!questionIds || questionIds.length === 0) return [];

      // Fetch each question document
      const questionsPromises = questionIds.map((qId: string) => getDoc(doc(db, 'questions', qId)));
      const questionDocs = await Promise.all(questionsPromises);

      const loaded = questionDocs
        .filter(qDoc => qDoc.exists())
        .map(qDoc => {
          const qData: any = qDoc.data();
          return {
            id: qDoc.id,
            section: qData.topic || qData.section || 'General',
            topic: qData.topic || qData.subject || 'General',
            stem: qData.stem || qData.question || qData.questionText || 'Question not available',
            options: qData.options || qData.choices || [qData.optionA, qData.optionB, qData.optionC, qData.optionD].filter(Boolean),
            correctIndex: qData.correctIndex ?? qData.correctOptionIndex ?? 0,
            explanation: qData.explanation || qData.expl || '',
          } as Question;
        });

      return loaded;
    },
    enabled: !!attempt?.examId,
  });

  // Merge questions with answers
  const questionsWithAnswers = questions && attemptItems
    ? questions.map(q => {
        const answer = attemptItems.find(a => a.id === q.id);
        return {
          ...q,
          selectedIdx: answer?.selectedIdx ?? null,
          timeSpentMs: answer?.timeSpentMs ?? 0,
          correctBool: answer?.selectedIdx === q.correctIndex,
        };
      })
    : [];

  // Calculate statistics
  const stats = {
    correct: questionsWithAnswers.filter(q => q.selectedIdx === q.correctIndex).length,
    incorrect: questionsWithAnswers.filter(q => q.selectedIdx !== null && q.selectedIdx !== q.correctIndex).length,
    unanswered: questionsWithAnswers.filter(q => q.selectedIdx === null).length,
    total: questionsWithAnswers.length,
  };

  // Data for charts
  const pieData = [
    { name: 'Correct', value: stats.correct, color: '#22c55e' },
    { name: 'Incorrect', value: stats.incorrect, color: '#ef4444' },
    { name: 'Unanswered', value: stats.unanswered, color: '#94a3b8' },
  ];

  const COLORS = ['#22c55e', '#ef4444', '#94a3b8'];

  // Section performance data
  const sectionPerformance = questionsWithAnswers.reduce((acc: any, q) => {
    if (!acc[q.section]) {
      acc[q.section] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
    }
    
    if (q.selectedIdx === q.correctIndex) {
      acc[q.section].correct += 1;
    } else if (q.selectedIdx !== null) {
      acc[q.section].incorrect += 1;
    } else {
      acc[q.section].unanswered += 1;
    }
    
    acc[q.section].total += 1;
    
    return acc;
  }, {});
  
  const sectionData = Object.keys(sectionPerformance).map(section => ({
    name: section,
    correct: sectionPerformance[section].correct,
    incorrect: sectionPerformance[section].incorrect,
    unanswered: sectionPerformance[section].unanswered,
    accuracy: Math.round((sectionPerformance[section].correct / sectionPerformance[section].total) * 100),
  }));
  
  // Get unique sections for tab filtering
  const sectionsList = Object.keys(sectionPerformance);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (attemptLoading || itemsLoading || questionsLoading) {
    return <LinearProgress />;
  }
  return (
    <Container>
      {/* Report Header */}
      <Box className="mb-8">
        <Box className="flex items-center gap-3 mb-6">
          <IconButton 
            aria-label="back" 
            onClick={() => navigate(-1)}
            sx={{
              color: '#374151',
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
              {attempt?.examTitle || attempt?.examId || 'Performance Report'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', marginTop: '4px' }}>
              Attempted on {attempt ? formatTimestamp(attempt.submittedAt) : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              {attempt?.score?.raw != null ? `${attempt.score.raw}/${(stats.total || 0) * 2}` : '—'}
            </Typography>
            {attempt?.score?.percentile && (
              <Typography variant="subtitle2" sx={{ color: '#3b82f6', fontWeight: 600, marginTop: '8px' }}>
                {attempt.score.percentile} Percentile
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} className="mb-10">
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            className="rounded-xl"
            sx={{
              padding: '24px 16px',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fafbfc',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f9fafb',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                borderColor: '#d1d5db',
              }
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <HelpOutlineIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography 
              sx={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                fontWeight: 500,
                marginBottom: '8px'
              }}
            >
              Total Questions
            </Typography>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
              {stats.total}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            className="rounded-xl"
            sx={{
              padding: '24px 16px',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fafbfc',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f9fafb',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                borderColor: '#d1d5db',
              }
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircleIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography 
              sx={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                fontWeight: 500,
                marginBottom: '8px'
              }}
            >
              Correct
            </Typography>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
              {stats.correct}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            className="rounded-xl"
            sx={{
              padding: '24px 16px',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fafbfc',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f9fafb',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                borderColor: '#d1d5db',
              }
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              <CancelIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography 
              sx={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                fontWeight: 500,
                marginBottom: '8px'
              }}
            >
              Incorrect
            </Typography>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
              {stats.incorrect}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            className="rounded-xl"
            sx={{
              padding: '24px 16px',
              textAlign: 'center',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fafbfc',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f9fafb',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                borderColor: '#d1d5db',
              }
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
            >
              <HelpOutlineIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography 
              sx={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                fontWeight: 500,
                marginBottom: '8px'
              }}
            >
              Unanswered
            </Typography>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
              {stats.unanswered}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}

      <Grid container spacing={4} className="mb-6">
        <Grid item xs={12} md={6}>
          <ChartCard title="Performance Summary" height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ChartCard title="Section Performance" height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectionData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" name="Correct" fill="#22c55e" />
                <Bar dataKey="incorrect" name="Incorrect" fill="#ef4444" />
                <Bar dataKey="unanswered" name="Unanswered" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Questions Review Section */}
      <Paper className="p-6">
        <Typography variant="h5" className="font-bold mb-4">
          Question Analysis
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          className="mb-4"
        >
          <Tab label="All Questions" />
          <Tab label="Correct" />
          <Tab label="Incorrect" />
          <Tab label="Unanswered" />
          {sectionsList.map((section: string) => (
            <Tab key={section} label={section} />
          ))}
        </Tabs>

        {/* Filter questions based on selected tab */}
        {(() => {
          let filteredQuestions = questionsWithAnswers;
          
          // Filter by status
          if (tabValue === 1) {
            filteredQuestions = questionsWithAnswers.filter(q => q.selectedIdx === q.correctIndex);
          } else if (tabValue === 2) {
            filteredQuestions = questionsWithAnswers.filter(q => q.selectedIdx !== null && q.selectedIdx !== q.correctIndex);
          } else if (tabValue === 3) {
            filteredQuestions = questionsWithAnswers.filter(q => q.selectedIdx === null);
          }
          // Filter by section
          else if (tabValue > 3 && sectionsList[tabValue - 4]) {
            filteredQuestions = questionsWithAnswers.filter(q => q.section === sectionsList[tabValue - 4]);
          }
          
          return (
            <Box>
              {filteredQuestions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  questionNumber={idx + 1}
                  question={{
                    id: q.id,
                    stem: q.stem,
                    options: q.options,
                    selectedIdx: q.selectedIdx,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation,
                  }}
                  showAnswers={true}
                />
              ))}
              
              {filteredQuestions.length === 0 && (
                <Box className="text-center py-8">
                  <Typography variant="h6" color="text.secondary">
                    No questions in this category
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })()}
      </Paper>
    </Container>
  );
}