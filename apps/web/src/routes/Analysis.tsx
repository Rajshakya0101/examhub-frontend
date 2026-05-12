import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Avatar,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Tabs,
  Tab,
  Chip,
  Stack,
  IconButton,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// Removed unused CancelIcon import
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { formatTimestamp } from '@/lib/firestore';

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
  timeSpentSec?: number;
  maxMarks?: number;
  examTitle?: string;
  attempts?: any[];
  questionStats?: {
    total?: number;
    totalQuestions?: number;
    questions?: number;
    correct?: number;
    correctCount?: number;
    incorrect?: number;
    incorrectCount?: number;
    skipped?: number;
    unanswered?: number;
    attempted?: number;
    questionsAttempted?: number;
  };
  score?: {
    raw: number;
    percentile?: number;
    percentage?: number;
  };
}

const isRRBNTPC = (examId?: string, examTitle?: string) => {
  const source = `${examId || ''} ${examTitle || ''}`.toLowerCase();
  return /rrb\s*ntpc|rrb-?ntpc/.test(source);
};

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
      
      const data: any = docSnap.data();

      const attemptEntries = Array.isArray(data.attempts) ? data.attempts : [];
      const activeAttempt = attemptEntries.length > 0
        ? attemptEntries.reduce((latest: any, current: any) => {
            const latestTime = latest?.submittedAt?.toMillis?.() || latest?.completedAt?.toMillis?.() || latest?.createdAt?.toMillis?.() || latest?.startedAt?.toMillis?.() || 0;
            const currentTime = current?.submittedAt?.toMillis?.() || current?.completedAt?.toMillis?.() || current?.createdAt?.toMillis?.() || current?.startedAt?.toMillis?.() || 0;
            return currentTime > latestTime ? current : latest;
          })
        : data;

      const merged = {
        ...data,
        ...activeAttempt,
      };

      // Normalize attempt fields to handle historical schema differences.
      const examId = merged.examId ?? merged.testId ?? merged.test?.id ?? merged.test_id ?? null;
      const examTitle = merged.examTitle ?? merged.testTitle ?? merged.test?.title ?? null;

      return {
        id: docSnap.id,
        ...merged,
        examId,
        examTitle,
        startedAt: merged.startedAt?.toDate?.() ?? merged.startedAt ?? data.startedAt?.toDate?.(),
        submittedAt: merged.submittedAt?.toDate?.() ?? merged.submittedAt ?? data.submittedAt?.toDate?.(),
        questionStats: merged.questionStats ?? data.questionStats ?? null,
        score: merged.score ?? data.score ?? null,
        maxMarks: merged.maxMarks ?? data.maxMarks ?? null,
        timeSpentSec: merged.timeSpentSec ?? data.timeSpentSec ?? 0,
        attempts: attemptEntries,
      } as Attempt & { examTitle?: string };
    },
    enabled: !!attemptId,
  });

  // Get attempt items (answers)
  const { data: attemptItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['attempt-items', attemptId, Boolean((attempt as any)?.answers)],
    queryFn: async () => {
      if (!attemptId) return [];

      // Primary source: answers embedded directly in attempt document.
      const embeddedAnswers = (attempt as any)?.answers;
      if (Array.isArray(embeddedAnswers) && embeddedAnswers.length > 0) {
        return embeddedAnswers.map((data: any, idx: number) => {
          const questionId = data.questionId ?? data.qid ?? data.question_id ?? data.id ?? String(idx);
          const selectedOption = data.selectedOption ?? data.selected ?? null;
          const selectedIdx = data.selectedIdx ?? data.selectedIndex ?? data.answerIndex ?? data.choiceIndex
            ?? (typeof selectedOption === 'string'
              ? ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number | undefined>)[selectedOption.toUpperCase()] ?? null
              : null);
          const timeSpentMs = data.timeSpentMs ?? data.timeSpent ?? data.durationMs ?? data.duration ?? 0;

          return {
            id: data.id ?? `embedded-${idx}`,
            questionId,
            selectedIdx,
            timeSpentMs,
            _raw: data,
          } as AttemptItem & { questionId: string };
        });
      }

      if (embeddedAnswers && !Array.isArray(embeddedAnswers) && typeof embeddedAnswers === 'object') {
        return Object.entries(embeddedAnswers).map(([qid, value]: [string, any], idx: number) => {
          const data: any = value || {};
          const selectedOption = data.selectedOption ?? data.selected ?? null;
          const selectedIdx = data.selectedIdx ?? data.selectedIndex ?? data.answerIndex ?? data.choiceIndex
            ?? (typeof selectedOption === 'string'
              ? ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number | undefined>)[selectedOption.toUpperCase()] ?? null
              : null);

          return {
            id: data.id ?? `embedded-${idx}`,
            questionId: data.questionId ?? data.qid ?? data.question_id ?? qid,
            selectedIdx,
            timeSpentMs: data.timeSpentMs ?? data.timeSpent ?? data.durationMs ?? data.duration ?? 0,
            _raw: data,
          } as AttemptItem & { questionId: string };
        });
      }

      // Try older 'attempt_items' collection first
      const itemsRef = collection(db, `attempt_items/${attemptId}/items`);
      let querySnap = await getDocs(itemsRef);

      if (querySnap.empty) {
        // Fallback: answers stored under attempts/{attemptId}/answers
        const answersRef = collection(db, `attempts/${attemptId}/answers`);
        querySnap = await getDocs(answersRef);
      }

      // If still empty, attempt answers might be embedded in the attempt document itself
      if (querySnap.empty) {
        const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
        if (attemptDoc.exists()) {
          const ad = attemptDoc.data() as any;
          const embedded = ad.answers || ad.attempt_items || ad.items || ad.responses || null;
          if (embedded && !Array.isArray(embedded) && typeof embedded === 'object') {
            return Object.entries(embedded).map(([qid, value]: [string, any], idx: number) => {
              const data: any = value || {};
              const selectedOption = data.selectedOption ?? data.selected ?? null;
              const selectedIdx = data.selectedIdx ?? data.selectedIndex ?? data.answerIndex ?? data.choiceIndex
                ?? (typeof selectedOption === 'string'
                  ? ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number | undefined>)[selectedOption.toUpperCase()] ?? null
                  : null);

              return {
                id: data.id ?? `embedded-${idx}`,
                questionId: data.questionId ?? data.qid ?? data.question_id ?? qid,
                selectedIdx,
                timeSpentMs: data.timeSpentMs ?? data.timeSpent ?? data.durationMs ?? data.duration ?? 0,
                _raw: data,
              } as AttemptItem & { questionId: string };
            });
          }

          if (Array.isArray(embedded) && embedded.length > 0) {
            return embedded.map((data: any, idx: number) => {
              const questionId = data.questionId ?? data.qid ?? data.question_id ?? data.q ?? data.qid ?? data.id ?? null;
              const selectedOption = data.selectedOption ?? data.selected ?? null;
              const selectedIdx = data.selectedIdx ?? data.selectedIndex ?? data.answerIndex ?? data.choiceIndex
                ?? (typeof selectedOption === 'string'
                  ? ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number | undefined>)[selectedOption.toUpperCase()] ?? null
                  : null);
              const timeSpentMs = data.timeSpentMs ?? data.timeSpent ?? data.durationMs ?? data.duration ?? 0;
              return {
                id: data.id ?? `embedded-${idx}`,
                questionId: questionId ?? String(data.id ?? idx),
                selectedIdx,
                timeSpentMs,
                _raw: data,
              } as AttemptItem & { questionId: string };
            });
          }
        }
      }

      // Normalize answer documents to a consistent shape so we can match them
      // against question IDs regardless of field naming differences across versions.
      return querySnap.docs.map(d => {
        const data: any = d.data();
        const questionId = data.questionId ?? data.qid ?? data.question_id ?? d.id;
        const selectedIdx = data.selectedIdx ?? data.selectedIndex ?? data.selected ?? data.answerIndex ?? data.choiceIndex ?? null;
        const timeSpentMs = data.timeSpentMs ?? data.timeSpent ?? data.durationMs ?? data.duration ?? 0;

        return {
          id: d.id,
          questionId,
          selectedIdx,
          timeSpentMs,
          // include raw data in case downstream logic needs it
          _raw: data,
        } as AttemptItem & { questionId: string };
      });
    },
    enabled: !!attemptId,
  });

  // Get exam questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['exam-questions', attempt?.examId, Boolean((attempt as any)?.questionSnapshots)],
    queryFn: async () => {
      if (!attempt?.examId) return [];

      // Primary source: snapshots embedded directly in attempt document.
      const embeddedFromAttempt = (attempt as any)?.questionSnapshots;
      if (Array.isArray(embeddedFromAttempt) && embeddedFromAttempt.length > 0) {
        return embeddedFromAttempt.map((qData: any, idx: number) => ({
          id: qData.id ?? qData.questionId ?? qData.qid ?? `embedded-q-${idx}`,
          section: qData.section || qData.subject || qData.topic || 'General',
          topic: qData.topic || qData.subject || qData.section || 'General',
          stem: qData.stem || qData.question || qData.questionText || 'Question not available',
          options: qData.options || qData.choices || [qData.optionA, qData.optionB, qData.optionC, qData.optionD].filter(Boolean),
          correctIndex: qData.correctIndex ?? qData.correctOptionIndex ?? qData.answerIndex
            ?? (typeof qData.correctOption === 'string'
              ? ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number | undefined>)[qData.correctOption.toUpperCase()] ?? 0
              : 0),
          explanation: qData.explanation || qData.expl || '',
        } as Question));
      }

      // Fetch the test document to obtain question IDs
      const testDoc = await getDoc(doc(db, 'tests', attempt.examId));
      const testData: any = testDoc.exists() ? testDoc.data() : {};
      // Try multiple shapes for question id list or embedded questions
      const questionIds: string[] = testData.questionIds || testData.questions || [];

      // If test doc is missing/doesn't contain question ids, use embedded snapshots from attempt
      if ((!questionIds || questionIds.length === 0) && attempt) {
        const attemptDoc = await getDoc(doc(db, 'attempts', attempt.id));
        if (attemptDoc.exists()) {
          const ad: any = attemptDoc.data();
          const embeddedQs = ad.questions || ad.questionSnapshots || ad.questionSnapshot || ad.items || null;
          if (Array.isArray(embeddedQs) && embeddedQs.length > 0) {
            return embeddedQs.map((qData: any, idx: number) => ({
              id: qData.id ?? qData.questionId ?? qData.qid ?? `embedded-q-${idx}`,
              section: qData.section || qData.subject || qData.topic || 'General',
              topic: qData.topic || qData.subject || 'General',
              stem: qData.stem || qData.question || qData.questionText || 'Question not available',
              options: qData.options || qData.choices || [qData.optionA, qData.optionB, qData.optionC, qData.optionD].filter(Boolean),
              correctIndex: qData.correctIndex ?? qData.correctOptionIndex ?? qData.answerIndex
                ?? (typeof qData.correctOption === 'string'
                  ? ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number | undefined>)[qData.correctOption.toUpperCase()] ?? 0
                  : 0),
              explanation: qData.explanation || qData.expl || '',
            } as Question));
          }
        }
      }

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
        const answer = attemptItems.find(a => a.questionId === q.id || a.id === q.id);
        return {
          ...q,
          selectedIdx: answer?.selectedIdx ?? null,
          timeSpentMs: answer?.timeSpentMs ?? 0,
          correctBool: answer?.selectedIdx === q.correctIndex,
        };
      })
    : [];

  // Calculate statistics from joined data
  const computedStats = {
    correct: questionsWithAnswers.filter(q => q.selectedIdx === q.correctIndex).length,
    incorrect: questionsWithAnswers.filter(q => q.selectedIdx !== null && q.selectedIdx !== q.correctIndex).length,
    unanswered: questionsWithAnswers.filter(q => q.selectedIdx === null).length,
    total: questionsWithAnswers.length,
  };

  const storedQuestionStats = attempt?.questionStats
    ? {
        total: attempt.questionStats.total ?? attempt.questionStats.questions ?? attempt.questionStats.totalQuestions ?? 0,
        correct: attempt.questionStats.correct ?? attempt.questionStats.correctCount ?? 0,
        incorrect: attempt.questionStats.incorrect ?? attempt.questionStats.incorrectCount ?? 0,
        skipped: attempt.questionStats.skipped ?? attempt.questionStats.unanswered ?? 0,
        unanswered: attempt.questionStats.skipped ?? attempt.questionStats.unanswered ?? 0,
        attempted: attempt.questionStats.attempted ?? attempt.questionStats.questionsAttempted ?? 0,
      }
    : null;

  // Fallback to stored attempt summary fields when computed data is empty
  const attemptRaw: any = attempt ?? {};
  const fbTotal =
    attemptRaw.totalQuestions ??
    attemptRaw.total ??
    attemptRaw.questionCount ??
    attemptRaw.numQuestions ??
    attemptRaw.questionsTotal ??
    attemptRaw.stats?.total ??
    attemptRaw.summary?.totalQuestions ??
    attemptRaw.metrics?.total ??
    0;
  const fbCorrect =
    attemptRaw.correct ??
    attemptRaw.correctCount ??
    attemptRaw.numCorrect ??
    attemptRaw.stats?.correct ??
    attemptRaw.metrics?.correct ??
    attemptRaw.summary?.correct ??
    0;
  const fbIncorrect =
    attemptRaw.incorrect ??
    attemptRaw.incorrectCount ??
    attemptRaw.numIncorrect ??
    attemptRaw.stats?.incorrect ??
    attemptRaw.metrics?.incorrect ??
    attemptRaw.summary?.incorrect ??
    0;

  const fallbackStats = {
    total: fbTotal,
    correct: fbCorrect,
    incorrect: fbIncorrect,
    unanswered: Math.max(0, (fbTotal || 0) - (fbCorrect || 0) - (fbIncorrect || 0)),
  };

  const stats = storedQuestionStats ?? {
    total: computedStats.total > 0 ? computedStats.total : fallbackStats.total,
    correct: computedStats.total > 0 ? computedStats.correct : fallbackStats.correct,
    incorrect: computedStats.total > 0 ? computedStats.incorrect : fallbackStats.incorrect,
    unanswered: computedStats.total > 0 ? computedStats.unanswered : fallbackStats.unanswered,
    skipped: computedStats.total > 0 ? computedStats.unanswered : fallbackStats.unanswered,
    attempted: computedStats.total > 0 ? computedStats.correct + computedStats.incorrect : fallbackStats.correct + fallbackStats.incorrect,
  };

  const attempted = stats.attempted ?? ((stats.correct || 0) + (stats.incorrect || 0));
  const accuracy = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;
  const attemptRate = stats.total > 0 ? Math.round((attempted / stats.total) * 100) : 0;

  // Compute score: prefer stored attempt.score.raw when available
  const storedScore =
    typeof attemptRaw.score?.raw === 'number' ? attemptRaw.score.raw
      : typeof attemptRaw.score === 'number' ? attemptRaw.score
      : typeof attemptRaw.scoreValue === 'number' ? attemptRaw.scoreValue
      : typeof attemptRaw.score_value === 'number' ? attemptRaw.score_value
      : typeof attemptRaw.rawScore === 'number' ? attemptRaw.rawScore
      : typeof attemptRaw.metrics?.score === 'number' ? attemptRaw.metrics.score
      : null;

  const useRRBNTPCScheme = isRRBNTPC(attemptRaw.examId, attemptRaw.examTitle);
  const marksPerCorrect = useRRBNTPCScheme ? 1 : 2;
  const marksPerWrong = useRRBNTPCScheme ? (1 / 3) : 0.5;

  const maxScore = attemptRaw.maxMarks ?? (stats.total || 0) * marksPerCorrect;
  const computedObtainedRaw = (stats.correct || 0) * marksPerCorrect - (stats.incorrect || 0) * marksPerWrong;
  const computedObtained = Number.isFinite(computedObtainedRaw) ? Math.max(0, Number(computedObtainedRaw.toFixed(1))) : null;
  const obtainedScore = storedScore != null ? storedScore : computedObtained;
  // Dev helper: print raw payloads to console to diagnose missing fields (only non-prod)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('Analysis debug:', { attempt: attemptRaw, attemptItems, questions, stats, fallbackStats, storedScore });
  }

  // Data for charts
  const pieData = [
    { name: 'Correct', value: stats.correct, color: '#22c55e' },
    { name: 'Incorrect', value: stats.incorrect, color: '#ef4444' },
    { name: 'Unanswered', value: stats.unanswered, color: '#94a3b8' },
  ];

  // COLORS removed (pie uses entry.color directly)

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
    accuracy: sectionPerformance[section].correct + sectionPerformance[section].incorrect > 0
      ? Math.round((sectionPerformance[section].correct / (sectionPerformance[section].correct + sectionPerformance[section].incorrect)) * 100)
      : 0,
  }));
  
  // Get unique sections for tab filtering
  const sectionsList = Object.keys(sectionPerformance);
  const sectionCount = sectionsList.length;

  const metricCards = [
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      caption: `${stats.correct} correct out of ${stats.total || 0}`,
      icon: <CheckCircleIcon />,
      tint: '#0f766e',
      background: 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(34,197,94,0.08))',
    },
    {
      label: 'Attempt Rate',
      value: `${attemptRate}%`,
      caption: `${attempted} attempted, ${stats.unanswered} skipped`,
      icon: <TrendingUpIcon />,
      tint: '#2563eb',
      background: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(96,165,250,0.08))',
    },
    {
      label: 'Sections',
      value: `${sectionCount}`,
      caption: sectionCount > 0 ? 'Performance grouped by topic' : 'No section data found',
      icon: <HelpOutlineIcon />,
      tint: '#7c3aed',
      background: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(168,85,247,0.08))',
    },
    {
      label: 'Score',
      value: obtainedScore != null ? `${obtainedScore.toFixed(2)}/${maxScore.toFixed(2)}` : '—',
      caption: attempt?.score?.percentile ? `${attempt.score.percentile} percentile` : 'Score summary',
      icon: <EmojiEventsIcon />,
      tint: '#f59e0b',
      background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(251,191,36,0.08))',
    },
  ];

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (attemptLoading || itemsLoading || questionsLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', py: 4 }}>
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid rgba(148,163,184,0.18)',
              bgcolor: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Loading analysis...
            </Typography>
            <LinearProgress sx={{ borderRadius: 999 }} />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', py: 4 }}>
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 5,
            p: { xs: 3, md: 4 },
            mb: 4,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #7c3aed 100%)',
            color: '#fff',
            boxShadow: '0 24px 80px rgba(15,23,42,0.25)',
            '&:before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.16), transparent 35%), radial-gradient(circle at bottom left, rgba(255,255,255,0.10), transparent 30%)',
              pointerEvents: 'none',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <IconButton
                aria-label="back"
                onClick={() => navigate('/attempts', { replace: true })}
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.85, fontWeight: 700 }}>
                  Analysis Report
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15, mt: 0.5 }}>
                  {attempt?.examTitle || attempt?.examId || 'Performance Report'}
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={3} alignItems="stretch">
              <Grid item xs={12} lg={8}>
                <Stack direction="row" flexWrap="wrap" spacing={1.2} sx={{ mb: 3 }}>
                  <Chip
                    label={attempt?.submittedAt ? `Submitted ${formatTimestamp(attempt.submittedAt)}` : 'Submission date unavailable'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600 }}
                  />
                  <Chip
                    label={`${stats.total} Questions`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600 }}
                  />
                  <Chip
                    label={`${stats.correct} Correct`}
                    sx={{ bgcolor: 'rgba(34,197,94,0.2)', color: '#fff', fontWeight: 600 }}
                  />
                  <Chip
                    label={`${stats.incorrect} Wrong`}
                    sx={{ bgcolor: 'rgba(239,68,68,0.2)', color: '#fff', fontWeight: 600 }}
                  />
                  <Chip
                    label={`${stats.unanswered} Skipped`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600 }}
                  />
                </Stack>

                <Typography variant="body1" sx={{ maxWidth: 760, opacity: 0.92, mb: 4, fontSize: '1.02rem' }}>
                  Review your score, question distribution, and topic performance in one polished view.
                  The report highlights accuracy, attempt rate, and section-level strengths so you can plan the next revision cycle quickly.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/attempts', { replace: true })}
                    sx={{
                      bgcolor: '#fff',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      px: 3,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' }
                    }}
                  >
                    Back to Attempts
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setTabValue(0)}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.45)',
                      color: '#fff',
                      fontWeight: 700,
                      px: 3,
                      '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' }
                    }}
                  >
                    Review Questions
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700 }}>
                      Score Overview
                    </Typography>
                    <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1, mt: 1 }}>
                      {obtainedScore != null ? `${obtainedScore.toFixed(2)}` : (attempt?.score?.raw != null ? `${attempt.score.raw.toFixed(2)}` : '—')}
                      <Typography component="span" sx={{ fontSize: '1.1rem', opacity: 0.75, ml: 1 }}>
                        / {maxScore.toFixed(2)}
                      </Typography>
                    </Typography>
                    {attempt?.score?.percentile != null && (
                      <Chip
                        label={`${attempt.score.percentile} Percentile`}
                        sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }}
                      />
                    )}
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ opacity: 0.82, mb: 1 }}>
                      Accuracy
                    </Typography>
                    <Box sx={{ height: 12, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
                      <Box sx={{ width: `${accuracy}%`, height: '100%', borderRadius: 999, bgcolor: '#fff' }} />
                    </Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25 }}>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        {accuracy}% accuracy
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        {attemptRate}% attempted
                      </Typography>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricCards.map(card => (
            <Grid item xs={12} sm={6} lg={3} key={card.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: card.background,
                  boxShadow: '0 12px 28px rgba(15,23,42,0.06)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 18px 36px rgba(15,23,42,0.10)',
                  }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: card.tint, width: 52, height: 52, boxShadow: `0 10px 20px ${alpha(card.tint, 0.28)}` }}>
                    {card.icon}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1, mt: 0.5 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {card.caption}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={5}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid rgba(148,163,184,0.18)',
                bgcolor: '#fff',
                boxShadow: '0 12px 28px rgba(15,23,42,0.06)'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Performance Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Correct, incorrect, and unanswered distribution.
                  </Typography>
                </Box>
                <Chip label={`${accuracy}% accuracy`} sx={{ fontWeight: 700 }} />
              </Stack>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid rgba(148,163,184,0.18)',
                bgcolor: '#fff',
                boxShadow: '0 12px 28px rgba(15,23,42,0.06)'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Section Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy and answer quality by section.
                  </Typography>
                </Box>
                <Chip label={`${sectionCount} sections`} sx={{ fontWeight: 700 }} />
              </Stack>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={sectionData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name="Correct" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="incorrect" name="Incorrect" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="unanswered" name="Unanswered" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 5,
            border: '1px solid rgba(148,163,184,0.18)',
            bgcolor: '#fff',
            boxShadow: '0 12px 28px rgba(15,23,42,0.06)'
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Question Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Explore every question by result type or section.
              </Typography>
            </Box>
            <Chip label={`${stats.total} questions reviewed`} sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, fontWeight: 700 }} />
          </Stack>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              minHeight: 48,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 999,
              },
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 700,
                color: '#64748b',
                px: 2,
                '&.Mui-selected': {
                  color: '#0f172a',
                },
              },
            }}
          >
            <Tab label={`All Questions (${stats.total})`} />
            <Tab label={`Correct (${stats.correct})`} />
            <Tab label={`Incorrect (${stats.incorrect})`} />
            <Tab label={`Unanswered (${stats.unanswered})`} />
            {sectionsList.map((section: string) => (
              <Tab key={section} label={section} />
            ))}
          </Tabs>

          {(() => {
            let filteredQuestions = questionsWithAnswers;

            if (tabValue === 1) {
              filteredQuestions = questionsWithAnswers.filter(q => q.selectedIdx === q.correctIndex);
            } else if (tabValue === 2) {
              filteredQuestions = questionsWithAnswers.filter(q => q.selectedIdx !== null && q.selectedIdx !== q.correctIndex);
            } else if (tabValue === 3) {
              filteredQuestions = questionsWithAnswers.filter(q => q.selectedIdx === null);
            } else if (tabValue > 3 && sectionsList[tabValue - 4]) {
              filteredQuestions = questionsWithAnswers.filter(q => q.section === sectionsList[tabValue - 4]);
            }

            return (
              <Box>
                {filteredQuestions.length > 0 ? (
                  <Stack spacing={2.5}>
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
                  </Stack>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      py: 8,
                      px: 3,
                      textAlign: 'center',
                      borderStyle: 'dashed',
                      borderColor: 'rgba(148,163,184,0.35)',
                      bgcolor: alpha('#f8fafc', 0.9),
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      No questions in this category
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Try a different tab or section to inspect more answers.
                    </Typography>
                  </Paper>
                )}
              </Box>
            );
          })()}
        </Paper>
      </Container>
    </Box>
  );
}