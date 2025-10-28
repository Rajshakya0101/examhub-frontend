import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
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

      const itemsRef = collection(db, `attempt_items/${attemptId}/items`);
      const querySnap = await getDocs(itemsRef);
      
      return querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AttemptItem[];
    },
    enabled: !!attemptId,
  });

  // Get exam questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['exam-questions', attempt?.examId],
    queryFn: async () => {
      if (!attempt?.examId) return [];

      // This would normally fetch the real questions by ID
      // Mock data for demonstration
      return Array(20).fill(0).map((_, idx) => ({
        id: `q${idx + 1}`,
        section: idx < 10 ? 'General Knowledge' : 'Current Affairs',
        topic: idx % 2 === 0 ? 'History' : 'Geography',
        stem: `This is question ${idx + 1}. What is the correct answer?`,
        options: [
          `Option A for question ${idx + 1}`,
          `Option B for question ${idx + 1}`,
          `Option C for question ${idx + 1}`,
          `Option D for question ${idx + 1}`,
        ],
        correctIndex: idx % 4,
        explanation: `Explanation for question ${idx + 1}. The correct answer is ${String.fromCharCode(65 + (idx % 4))} because...`,
      })) as Question[];
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
      <Paper className="p-6 mb-6">
        <Box className="flex justify-between items-center mb-4">
          <Box>
            <Typography variant="h4" className="font-bold">
              Performance Report
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {attempt?.examId} - Attempted on {attempt ? formatTimestamp(attempt.submittedAt) : ''}
            </Typography>
          </Box>
          <Box className="text-right">
            <Typography variant="h4" className="font-bold">
              {attempt?.score?.raw || 0}/{stats.total}
            </Typography>
            {attempt?.score?.percentile && (
              <Typography variant="subtitle1" color="primary" className="font-medium">
                {attempt.score.percentile} Percentile
              </Typography>
            )}
          </Box>
        </Box>

        <Divider className="my-4" />
        
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Questions
              </Typography>
              <Typography variant="h6" className="font-bold">
                {stats.total}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Correct
              </Typography>
              <Typography variant="h6" className="font-bold text-success">
                {stats.correct}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Incorrect
              </Typography>
              <Typography variant="h6" className="font-bold text-error">
                {stats.incorrect}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Unanswered
              </Typography>
              <Typography variant="h6" className="font-bold">
                {stats.unanswered}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box className="mt-4 flex justify-end">
          <Button variant="contained" color="primary">
            Download PDF Report
          </Button>
        </Box>
      </Paper>

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