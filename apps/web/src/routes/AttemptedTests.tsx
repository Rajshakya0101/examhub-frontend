import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Stack,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AnalyticsOutlined as AnalyticsIcon,
  RestartAlt as RestartIcon,
  MoreVert as MoreVertIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  AccessTime as TimerIcon,
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  Flag as SkipIcon,
  Refresh as RefreshIcon,
  WorkspacePremium as WorkspacePremiumIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/auth';
import { AttemptData } from '@/lib/firestore';
import { useNotifications } from '@/lib/notifications/notificationContext';
import { useUserStatsSummary } from '@/hooks/useUserStats';

type TestType = 'all' | 'quick-practice' | 'sectional-mock' | 'full-mock';

interface DisplayAttempt extends AttemptData {
  id: string;
  testType: TestType;
}

const getTestType = (examId: string): TestType => {
  if (examId.includes('ca-') || examId.includes('quick-')) {
    return 'quick-practice';
  } else if (examId.includes('sectional-') || examId.includes('sm-')) {
    return 'sectional-mock';
  } else if (examId.includes('full-') || examId.includes('fm-')) {
    return 'full-mock';
  }
  return 'all';
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

const getScoreColor = (percentage: number) => {
  if (percentage >= 80) return 'success';
  if (percentage >= 60) return 'warning';
  return 'error';
};

const getScoreLabel = (percentage: number) => {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Good';
  if (percentage >= 40) return 'Average';
  return 'Needs Improvement';
};

// Helper: human-friendly title
const getDisplayTitle = (attempt: any) => {
  if (attempt.examTitle) return attempt.examTitle;
  if (attempt.examId) return attempt.examId.replace(/-/g, ' ').toUpperCase();
  return 'Quiz';
};

// Helper: test type label
const getTestTypeLabel = (examId: string) => {
  const id = (examId || '').toLowerCase();
  if (id.includes('quick') || id.includes('ca-')) return 'Quick Practice';
  if (id.includes('sectional') || id.includes('sm-')) return 'Sectional Mock';
  if (id.includes('full') || id.includes('fm-')) return 'Full Mock';
  return 'Practice';
};

// Helper: display raw score and max based on total questions (2 marks per question)
const getRawAndMax = (attempt: any) => {
  const max = attempt.maxMarks ?? ((attempt.totalQuestions || attempt.questionStats?.total || 50) * 2);
  const raw = attempt.score?.raw != null
    ? attempt.score.raw
    : attempt.score?.percentage != null
    ? Math.round((attempt.score.percentage / 100) * max)
    : null;
  return { raw, max };
};

export default function AttemptedTests() {
  const user = useAuthState();
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification: notify } = useNotifications();

  const [selectedTab, setSelectedTab] = useState<TestType>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'subject'>('recent');
  const [selectedAttempt, setSelectedAttempt] = useState<DisplayAttempt | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
const [showUpcomingFeatureModal, setShowUpcomingFeatureModal] = useState(false);

  // Fetch all attempts for the user
  const { data: allAttempts, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['attempts', user?.uid],
    queryFn: async () => {
      if (!user) return [];

      try {
        const q = query(
          collection(db, 'attempts'),
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          testType: getTestType((doc.data() as any).examId),
        } as DisplayAttempt));
      } catch (error) {
        console.warn('Ordered attempts query failed, falling back to client-side sorting.', error);

        // Fallback: fetch without orderBy and sort client-side
        const fallbackQuery = query(
          collection(db, 'attempts'),
          where('userId', '==', user.uid)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const attempts = fallbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          testType: getTestType((doc.data() as any).examId),
        } as DisplayAttempt));

        // Sort by submittedAt descending
        return attempts.sort((a, b) => {
          const aMillis = (a as any).submittedAt?.toMillis?.() || (a as any).createdAt?.toMillis?.() || 0;
          const bMillis = (b as any).submittedAt?.toMillis?.() || (b as any).createdAt?.toMillis?.() || 0;
          return bMillis - aMillis;
        });
      }
    },
    enabled: !!user,
  });

  // Filter and sort attempts
  const filteredAttempts = useMemo(() => {
    if (!allAttempts) return [];

    let filtered = allAttempts;

    // Filter by type
    if (selectedTab !== 'all') {
      filtered = filtered.filter((a) => a.testType === selectedTab);
    }

    // Sort
    if (sortBy === 'score') {
      filtered.sort((a, b) => (b.score?.percentage || 0) - (a.score?.percentage || 0));
    } else if (sortBy === 'subject') {
      filtered.sort((a, b) => a.examTitle.localeCompare(b.examTitle));
    }
    // 'recent' is already sorted by default (submittedAt desc)

    return filtered;
  }, [allAttempts, selectedTab, sortBy]);

  const stats = useMemo(() => {
    if (!allAttempts) return null;

    const avgScore =
      allAttempts.length > 0
        ? allAttempts.reduce((sum, a) => sum + (a.score?.percentage || 0), 0) / allAttempts.length
        : 0;

    const totalTime = allAttempts.reduce((sum, a) => sum + a.timeSpentSec, 0);
    const totalCorrect = allAttempts.reduce((sum, a) => sum + a.questionStats.correct, 0);
    const totalAttempted = allAttempts.reduce((sum, a) => sum + a.questionStats.attempted, 0);

    return {
      totalAttempts: allAttempts.length,
      avgScore: avgScore.toFixed(2),
      totalTime,
      totalCorrect,
      totalAttempted,
      accuracy: totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(2) : '0.00',
    };
  }, [allAttempts]);

  // Get overall user stats summary (real-time normalized accuracy)
  const { summary: userStatsSummary, isLoading: userStatsLoading } = useUserStatsSummary();

  // Derive latest attempt (most recent submittedAt/createdAt) from allAttempts
  const latestAttemptForOverview = useMemo(() => {
    if (!allAttempts || allAttempts.length === 0) return null;
    return allAttempts.reduce((prev, cur) => {
      const prevMillis = (prev as any).submittedAt?.toMillis?.() || (prev as any).createdAt?.toMillis?.() || 0;
      const curMillis = (cur as any).submittedAt?.toMillis?.() || (cur as any).createdAt?.toMillis?.() || 0;
      return curMillis > prevMillis ? cur : prev;
    }, allAttempts[0] as DisplayAttempt | null);
  }, [allAttempts]);

  const latestAttemptAccuracyOverview = useMemo(() => {
    if (!latestAttemptForOverview) return null;
    if (latestAttemptForOverview.score?.percentage != null) return Number(latestAttemptForOverview.score.percentage);
    const attempted = latestAttemptForOverview.questionStats?.attempted ?? latestAttemptForOverview.questionStats?.total ?? 0;
    if (attempted > 0) return (latestAttemptForOverview.questionStats.correct / attempted) * 100;
    return null;
  }, [latestAttemptForOverview]);

  const handleReAttempt = (attemptId: string, examId: string) => {
    setShowUpcomingFeatureModal(true);
  };

  const handleViewAnalysis = (attemptId: string) => {
    navigate(`/analysis/${attemptId}`);
  };

  const handleViewDetails = (attempt: DisplayAttempt) => {
    setSelectedAttempt(attempt);
    setShowDetailsModal(true);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please sign in to view your attempted tests.</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
        minHeight: '100vh',
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your Test Attempts
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Review your performance, analyze results, and re-attempt tests
          </Typography>
          </Box>
          <Tooltip title="Refresh attempts">
            <span>
              <IconButton onClick={() => refetch()} disabled={isFetching} sx={{ mt: 1 }}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Stats Overview */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  textAlign: 'center',
                  background: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Attempts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.totalAttempts}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  textAlign: 'center',
                  background: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  {stats.avgScore}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  textAlign: 'center',
                  background: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Accuracy
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                  {!userStatsLoading && userStatsSummary ? `${Number(userStatsSummary.accuracy).toFixed(2)}%` : '—'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  textAlign: 'center',
                  background: alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Time Spent
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                  {formatTime(stats.totalTime)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Filters & Controls */}
        <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Tabs
              value={selectedTab}
              onChange={(e, value) => setSelectedTab(value as TestType)}
              sx={{ px: 2 }}
            >
              <Tab label="All Tests" value="all" />
              <Tab label="Quick Practice" value="quick-practice" />
              <Tab label="Sectional Mocks" value="sectional-mock" />
              <Tab label="Full Mocks" value="full-mock" />
            </Tabs>
          </Box>

          <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              sx={{ width: 150 }}
            >
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="score">Highest Score</MenuItem>
              <MenuItem value="subject">Test Name</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {/* Attempts List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredAttempts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No test attempts found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start taking tests to see your attempts here
            </Typography>
            <Button variant="contained" onClick={() => navigate('/quick-quiz')}>
              Take a Quick Quiz
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredAttempts.map((attempt) => {
              const scoreColor = getScoreColor(attempt.score?.percentage || 0);
              const scoreLabel = getScoreLabel(attempt.score?.percentage || 0);

              return (
                <Grid item xs={12} md={6} key={attempt.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-2px)',
                      },
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                  >
                    {/* Header */}
                    <CardContent sx={{ pb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                          <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {getDisplayTitle(attempt)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={getTestTypeLabel(attempt.examId || attempt.examTitle)}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                            <Chip
                              label={formatDate(attempt.submittedAt)}
                              size="small"
                              variant="filled"
                              sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}
                            />
                          </Box>
                        </Box>
                        <Tooltip title="More Options">
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>

                    <Divider />

                    {/* Score & Stats */}
                    <CardContent>
                      {(() => {
                        // compute accuracy once for this attempt
                        const attemptedCount = attempt.questionStats?.attempted ?? attempt.questionStats?.total ?? 0;
                        const accuracyPercent = attemptedCount > 0 ? (attempt.questionStats.correct / attemptedCount) * 100 : 0;
                        const { raw, max } = getRawAndMax(attempt);
                        return (
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6} sm={3}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: scoreColor + '.main' }}>
                                  {raw != null ? `${Number(raw).toFixed(2)}/${Number(max).toFixed(2)}` : 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {attempt.score?.percentage != null ? `${attempt.score.percentage.toFixed(2)}%` : scoreLabel}
                                </Typography>
                              </Box>
                            </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                              <CorrectIcon sx={{ fontSize: 16, color: theme.palette.success.main, mr: 0.5 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {attempt.questionStats.correct}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Correct
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                              <WrongIcon sx={{ fontSize: 16, color: theme.palette.error.main, mr: 0.5 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {attempt.questionStats.incorrect}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Wrong
                            </Typography>
                          </Box>
                        </Grid>
                            <Grid item xs={6} sm={3}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                                  <SkipIcon sx={{ fontSize: 16, color: theme.palette.warning.main, mr: 0.5 }} />
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {attempt.questionStats.skipped}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Skipped
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        );
                      })()}

                      {/* Time and Accuracy in one row */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          color: 'text.secondary',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimerIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">
                            Time Spent: {formatTime(attempt.timeSpentSec)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
                          Accuracy: {(() => {
                            const attemptedCount = attempt.questionStats?.attempted ?? attempt.questionStats?.total ?? 0;
                            const accuracyPercent = attemptedCount > 0 ? (attempt.questionStats.correct / attemptedCount) * 100 : 0;
                            return `${accuracyPercent.toFixed(2)}%`;
                          })()}
                        </Typography>
                      </Box>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ pt: 0, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(attempt)}
                        variant="outlined"
                        sx={{ flex: 1 }}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => handleViewAnalysis(attempt.id)}
                        variant="contained"
                        color="primary"
                        sx={{ flex: 1 }}
                      >
                        Analysis
                      </Button>
                      <Button
                        size="small"
                        startIcon={<RestartIcon />}
                        onClick={() => handleReAttempt(attempt.id, attempt.examId)}
                        variant="outlined"
                        color="success"
                      >
                        Re-attempt
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Attempt Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedAttempt && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Test Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedAttempt.examTitle}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Score
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: getScoreColor(selectedAttempt.score?.percentage || 0) + '.main' }}>
                    {selectedAttempt.score?.percentage.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Performance
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getScoreLabel(selectedAttempt.score?.percentage || 0)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Question Statistics
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Questions</TableCell>
                        <TableCell align="right">{selectedAttempt.questionStats.total}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Attempted</TableCell>
                        <TableCell align="right">{selectedAttempt.questionStats.attempted}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                        <TableCell>Correct</TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                          {selectedAttempt.questionStats.correct}
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                        <TableCell>Incorrect</TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                          {selectedAttempt.questionStats.incorrect}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Skipped</TableCell>
                        <TableCell align="right">{selectedAttempt.questionStats.skipped}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Time Spent
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatTime(selectedAttempt.timeSpentSec)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Submitted On
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedAttempt.submittedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowDetailsModal(false)} variant="outlined">
            Close
          </Button>
          {selectedAttempt && (
            <>
              <Button
                startIcon={<AnalyticsIcon />}
                variant="contained"
                color="primary"
                onClick={() => {
                  handleViewAnalysis(selectedAttempt.id);
                  setShowDetailsModal(false);
                }}
              >
                View Analysis
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

          {/* Upcoming Feature Modal */}
          <Dialog
            open={showUpcomingFeatureModal}
            onClose={() => setShowUpcomingFeatureModal(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.1), 
              fontWeight: 600,
              textAlign: 'center'
            }}>
              ⏳ Upcoming Feature
            </DialogTitle>
            <DialogContent sx={{ mt: 3, textAlign: 'center' }}>
              <Box sx={{ mb: 2 }}>
                <WorkspacePremiumIcon 
                  sx={{ 
                    fontSize: 64, 
                    color: theme.palette.warning.main,
                    mb: 2
                  }} 
                />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Premium Features Under Development
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
                We're working hard to bring you premium features and enhanced capabilities. Stay tuned for updates!
              </Typography>
              <Alert severity="info" icon={false} sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${theme.palette.info.main}`
              }}>
                <Typography variant="body2">
                  Re-attempt functionality and advanced quiz management are coming soon as part of our premium features.
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
              <Button 
                onClick={() => setShowUpcomingFeatureModal(false)} 
                variant="contained"
                size="large"
                sx={{ px: 4 }}
              >
                Got It
              </Button>
            </DialogActions>
          </Dialog>
    </Box>
  );
}
