import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Card, 
  CardActionArea, 
  CardContent, 
  Container, 
  Grid, 
  Typography, 
  Divider,
  LinearProgress,
  Paper,
  Avatar,
  IconButton,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import { useAuthState } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useUserStatsSummary } from '@/hooks/useUserStats';
import { useRecommendedExams } from '@/hooks/useRecommendedExams';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BarChartIcon from '@mui/icons-material/BarChart'; 
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QuizIcon from '@mui/icons-material/Quiz';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArticleIcon from '@mui/icons-material/Article';
import TimerIcon from '@mui/icons-material/Timer';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

export default function Dashboard() {
  const user = useAuthState();
  const theme = useTheme();
  
  // Fetch real user stats using custom hook
  const { summary: stats, isLoading: loadingStats } = useUserStatsSummary();
  
  // Get recommended exams based on user performance
  const { data: recommendedExams, isLoading: loadingRecommendations } = useRecommendedExams();

  // Fetch recent attempts
  const { data: recentAttempts, isLoading: loadingAttempts } = useQuery({
    queryKey: ['attempts', user?.uid, 'recent'],
    queryFn: async () => {
      if (!user) return [];
      
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', user.uid),
        orderBy('submittedAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!user
  });

  // Fetch daily quiz
  const { data: dailyQuiz, isLoading: loadingDaily } = useQuery({
    queryKey: ['daily-quiz'],
    queryFn: async () => {
      const docRef = collection(db, 'daily_quiz');
      const snapshot = await getDocs(query(docRef, limit(1)));
      
      if (snapshot.empty) {
        return null;
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    }
  });

  useEffect(() => {
    // Could add analytics tracking here
    // analytics.logEvent('screen_view', { screen_name: 'Dashboard' });
  }, []);

  return (
    <Box sx={{ 
      background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
      minHeight: '100vh',
      pb: 8,
      pt: 3,
      borderRadius: 3
    }}>
      <Container maxWidth="lg">
        {/* Welcome Section with Hero */}
        <Box sx={{ 
          py: 4, 
          mb: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.shadows[1]
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            zIndex: -1
          }} />
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ px: 4 }}>
                <Typography 
                  variant="h3" 
                  component="h1"
                  sx={{ 
                    fontWeight: 700,
                    mb: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}
                </Typography>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                  Your exam preparation dashboard
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    component={Link}
                    to="/tests"
                    startIcon={<QuizIcon />}
                    sx={{ mr: 2, px: 3 }}
                  >
                    Take a Test
                  </Button>
                  <Button 
                    variant="outlined"
                    component={Link}
                    to="/practice"
                    sx={{ px: 3 }}
                  >
                    Practice Questions
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Box sx={{
                  borderRadius: '50%',
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `conic-gradient(${theme.palette.primary.main} ${stats.accuracy}%, ${alpha(theme.palette.primary.main, 0.2)} 0)`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    borderRadius: '50%',
                    width: '80%',
                    height: '80%',
                    background: theme.palette.background.paper,
                  }
                }}>
                  <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.accuracy}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Last updated: Today at 10:30 AM
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Main Dashboard Content */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Stats Overview */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ 
                p: 2, 
                borderRadius: 3,
                boxShadow: theme.shadows[2],
                background: theme.palette.background.paper
              }}>
                <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Performance Overview
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Grid container spacing={3} sx={{ p: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 1, 
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: theme.palette.warning.main,
                          width: 56,
                          height: 56
                        }}
                      >
                        <LocalFireDepartmentIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {stats.streak}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Day Streak
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 1, 
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          width: 56,
                          height: 56
                        }}
                      >
                        <CheckCircleIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {stats.questionsAnswered}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Questions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 1, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          width: 56,
                          height: 56
                        }}
                      >
                        <TimerIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {stats.timeSpent}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time Spent
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 1, 
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                          width: 56,
                          height: 56
                        }}
                      >
                        <EmojiEventsIcon />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        #{stats.rank}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ranking
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Growth Stats */}
                <Box sx={{ p: 2, pt: 0 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    display: 'flex',
                    alignItems: 'center',
                    background: `linear-gradient(to right, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.main, 0.1)})`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      <Typography component="span" fontWeight="bold" color="success.main">
                        +{stats.improvement}%
                      </Typography>{' '}
                      improvement in your performance over the last week
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
            
            {/* Daily Quiz */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: theme.shadows[2]
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '30%',
                  height: '100%',
                  background: `linear-gradient(to left, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                  zIndex: 0
                }} />
                
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      <ArticleIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight={600}>
                      Daily Challenge Quiz
                    </Typography>
                  </Box>
                  
                  {loadingDaily ? (
                    <Box sx={{ display: 'flex', my: 4, justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : dailyQuiz ? (
                    <Box>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 2, 
                        mb: 3,
                        justifyContent: { xs: 'center', sm: 'flex-start' }
                      }}>
                        <Chip 
                          icon={<QuizIcon fontSize="small" />} 
                          label="10 Questions" 
                          variant="outlined" 
                          color="primary" 
                        />
                        <Chip 
                          icon={<AccessTimeIcon fontSize="small" />} 
                          label="10 Minutes" 
                          variant="outlined" 
                          color="primary" 
                        />
                        <Chip 
                          icon={<WorkspacePremiumIcon fontSize="small" />} 
                          label="No Negative Marking" 
                          variant="outlined" 
                          color="primary" 
                        />
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="large"
                        component={Link}
                        to={`/tests/daily/attempt/daily-${dailyQuiz.id}`}
                        startIcon={<QuizIcon />}
                        sx={{ px: 4, py: 1.2 }}
                      >
                        Start Daily Challenge
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: alpha(theme.palette.primary.light, 0.05),
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle1">
                        Today's quiz will be available soon!
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
            
            {/* Recent Activity */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Recent Test Attempts
                </Typography>
                <Button 
                  component={Link}
                  to="/attempts"
                  size="small"
                  sx={{ fontWeight: 500 }}
                >
                  View All
                </Button>
              </Box>
              
              <Paper sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[2]
              }}>
                {loadingAttempts ? (
                  <LinearProgress />
                ) : recentAttempts && recentAttempts.length > 0 ? (
                  <Stack divider={<Divider />}>
                    {recentAttempts.map((attempt: any) => (
                      <CardActionArea 
                        key={attempt.id}
                        component={Link} 
                        to={`/analysis/${attempt.id}`}
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {attempt.examId} Attempt
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(attempt.submittedAt?.toDate()).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight={700} sx={{
                              color: theme.palette.primary.main
                            }}>
                              {attempt.score?.raw || 'N/A'}/100
                            </Typography>
                            {attempt.score?.percentile && (
                              <Chip 
                                size="small" 
                                label={`${attempt.score.percentile} %ile`} 
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </CardActionArea>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      No recent activity found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start practicing tests to see your activity here!
                    </Typography>
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/tests"
                      sx={{ mt: 2 }}
                    >
                      Browse Available Tests
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Latest Score Card */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[2],
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                color: '#fff',
                position: 'relative'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.1,
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="1" fill-rule="evenodd"/%3E%3C/svg%3E")'
                }} />
                
                <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>
                    Latest Performance
                  </Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
                    {stats.recentScore}/100
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={user?.photoURL || undefined} 
                      sx={{ width: 32, height: 32 }}
                    />
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        You're in the top 10%
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        Keep up the good work!
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          
            {/* Recommended Exams */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight={600}>
                  Recommended For You
                </Typography>
              </Box>
              
              {loadingRecommendations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {recommendedExams?.map((exam) => (
                  <Paper key={exam.id} sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: theme.shadows[2]
                  }}>
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip 
                          label={exam.category} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(exam.color, 0.1),
                            color: exam.color,
                            fontWeight: 500
                          }} 
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BarChartIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {exam.difficulty}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        {exam.title}
                      </Typography>
                      
                      {/* Show recommendation reason */}
                      {exam.reason && (
                        <Typography variant="body2" color="primary" sx={{ mb: 2, fontStyle: 'italic' }}>
                          💡 {exam.reason}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {exam.duration}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ArticleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {exam.questions} Questions
                          </Typography>
                        </Box>
                      </Box>
                      
                      {exam.progress > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Progress</Typography>
                            <Typography variant="caption" fontWeight={500}>{exam.progress}%</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={exam.progress} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: alpha(exam.color, 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: exam.color
                              }
                            }} 
                          />
                        </Box>
                      )}
                      
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ 
                          bgcolor: exam.color,
                          '&:hover': {
                            bgcolor: alpha(exam.color, 0.8)
                          }
                        }}
                        component={Link}
                        to={`/tests/${exam.id}`}
                      >
                        {exam.progress > 0 ? 'Continue' : 'Start Now'}
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
              )}
            </Box>
            
            {/* Quick Links */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: theme.shadows[2]
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Links
              </Typography>
              
              <Stack spacing={1.5}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  component={Link} 
                  to="/leaderboard" 
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                  startIcon={<EmojiEventsIcon />}
                >
                  Leaderboard
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  component={Link} 
                  to="/notes" 
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                  startIcon={<ArticleIcon />}
                >
                  My Notes
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  component={Link} 
                  to="/bookmarks" 
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                  startIcon={<BarChartIcon />}
                >
                  Bookmarked Questions
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  component={Link} 
                  to="/premium" 
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                  startIcon={<WorkspacePremiumIcon />}
                >
                  Upgrade to Premium
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}