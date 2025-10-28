import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import SpeedIcon from '@mui/icons-material/Speed';
import { useAuthState } from '@/lib/auth';

export default function HeroSection() {
  const theme = useTheme();
  const user = useAuthState();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // Navigate to search results or tests with search param
    if (searchQuery.trim()) {
      navigate(`/tests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const features = [
    {
      icon: <SchoolIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Interactive Learning',
      description: 'Practice with adaptive quizzes that adjust to your skill level'
    },
    {
      icon: <AssessmentIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />,
      title: 'Detailed Analytics',
      description: 'Track your progress with comprehensive performance insights'
    },
    {
      icon: <PeopleIcon fontSize="large" sx={{ color: theme.palette.success.main }} />,
      title: 'Community Challenges',
      description: 'Compete with peers and rise through the leaderboard'
    },
    {
      icon: <SpeedIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />,
      title: 'Time Management',
      description: 'Improve your speed with timed practice sessions'
    },
  ];

  return (
    <Box sx={{ 
      pt: { xs: 4, md: 8 }, 
      pb: { xs: 6, md: 10 },
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative elements */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0)} 70%)`,
        zIndex: 0,
      }} />
      
      <Box sx={{
        position: 'absolute',
        bottom: -200,
        left: -200,
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0)} 70%)`,
        zIndex: 0,
      }} />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h1" 
              component="h1"
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' }, 
                fontWeight: 800,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Master Your Exams With Confidence
            </Typography>
            
            <Typography 
              variant="h5" 
              component="div" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontWeight: 400,
                lineHeight: 1.5
              }}
            >
              Comprehensive practice tests, personalized feedback, and advanced analytics to help you excel in your exams.
            </Typography>

            <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
              <TextField
                fullWidth
                placeholder="Search for practice tests, subjects, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        variant="contained" 
                        color="primary" 
                        type="submit"
                        sx={{ borderRadius: '0 8px 8px 0', height: '100%', p: '12px 24px' }}
                      >
                        Search
                      </Button>
                    </InputAdornment>
                  ),
                  sx: { 
                    borderRadius: 2, 
                    pr: 0,
                    boxShadow: theme.shadows[3],
                    '&:hover': { boxShadow: theme.shadows[5] }
                  }
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate(user ? '/dashboard' : '/signin')}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: 2,
                    boxShadow: theme.shadows[4],
                  }}
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/practice')}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: 2,
                  }}
                >
                  Try Practice Mode
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              component="img"
              src="/images/hero-image.svg"
              alt="Students studying online"
              sx={{ 
                width: '100%',
                height: 'auto',
                filter: theme.palette.mode === 'dark' ? 'brightness(0.)' : 'none',
              }}
            />
          </Grid>
        </Grid>

        {/* Features section */}
        <Box sx={{ mt: { xs: 6, md: 10 } }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ mb: 5, fontWeight: 700 }}
          >
            Why Choose Our Platform
          </Typography>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <Box sx={{ mb: 2, p: 1.5, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stats counter */}
        <Paper
          elevation={2}
          sx={{
            mt: { xs: 6, md: 10 },
            p: 4,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.05),
          }}
        >
          <Grid container spacing={3} justifyContent="space-around" textAlign="center">
            {[
              { value: '10,000+', label: 'Practice Questions' },
              { value: '5,000+', label: 'Active Students' },
              { value: '500+', label: 'Custom Exams' },
              { value: '95%', label: 'Success Rate' },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {stat.value}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}