import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Typography, 
  Alert, 
  Divider,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import { signInWithGoogle } from '../lib/auth';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ArticleIcon from '@mui/icons-material/Article';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function SignIn() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  // Get redirect path from location state or default to dashboard
  const from = (location.state?.from?.pathname || '/dashboard') as string;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError('');
    
    try {
      // Use Firebase persistence for session management
      await signInWithGoogle();
      console.log('Sign in successful, redirecting to:', from);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  const gradientText = {
    background: 'linear-gradient(45deg, #7c3aed 30%, #ec4899 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6, minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <Grid container spacing={4} alignItems="center">
        {/* Left Column - Auth Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={6}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: `0px 16px 40px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <CardContent sx={{ p: 5, position: 'relative' }}>
              {/* Background decoration */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -60,
                  right: -60,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                  zIndex: 0
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                  zIndex: 0
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #7c3aed 30%, #ec4899 90%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 2,
                      boxShadow: `0px 6px 15px ${alpha('#7c3aed', 0.3)}`
                    }}
                  >
                    <LockOutlinedIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Sign in to access your personalized exam preparation
                  </Typography>
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      boxShadow: `0px 2px 8px ${alpha(theme.palette.error.main, 0.2)}`
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  startIcon={isSigningIn ? undefined : <GoogleIcon />}
                  sx={{
                    py: 1.5,
                    boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.15)',
                    fontSize: '1rem',
                    mb: 3
                  }}
                >
                  {isSigningIn ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign in with Google'
                  )}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                  <Box 
                    component={LoginIcon} 
                    sx={{ 
                      mr: 1, 
                      color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#7C3AED',
                      fontSize: '1.2rem'
                    }} 
                  />
                  <Typography 
                    variant="subtitle1" 
                    component="span"
                    sx={{ fontWeight: 600, ...gradientText }}
                  >
                    Quick Access, No Passwords
                  </Typography>
                </Box>

                <Box 
                  sx={{ 
                    mt: 3, 
                    pt: 3, 
                    textAlign: 'center',
                    borderTop: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    By signing in, you agree to our{' '}
                    <Link 
                      to="/terms" 
                      style={{ 
                        color: theme.palette.primary.main, 
                        fontWeight: 500 
                      }}
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link 
                      to="/privacy" 
                      style={{ 
                        color: theme.palette.primary.main, 
                        fontWeight: 500 
                      }}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Benefits */}
        <Grid item xs={12} md={6}>
          <Box sx={{ pl: { md: 5 }, mt: { xs: 4, md: 0 } }}>
            <Typography 
              variant="h3" 
              fontWeight="bold" 
              gutterBottom
              sx={gradientText}
            >
              Accelerate Your Career
            </Typography>
            
            <Typography variant="h6" paragraph sx={{ mb: 4 }}>
              Join thousands of successful candidates who have cleared competitive exams with our platform
            </Typography>

            {/* Benefits List */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                {
                  icon: <SchoolOutlinedIcon fontSize="large" />,
                  title: "Expert-Created Content",
                  desc: "Practice with questions designed by exam toppers and experts"
                },
                {
                  icon: <ArticleIcon fontSize="large" />,
                  title: "Full-Length Mock Tests",
                  desc: "Simulated exam environment with real-time scoring and analysis"
                },
                {
                  icon: <BarChartIcon fontSize="large" />,
                  title: "Personalized Analytics",
                  desc: "Track your progress and focus on areas that need improvement"
                }
              ].map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      p: 2, 
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        mr: 2, 
                        color: theme.palette.primary.main, 
                        display: 'flex', 
                        alignItems: 'center'
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}