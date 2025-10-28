import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuthState } from '@/lib/auth';

export default function CallToAction() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAuthState();

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundImage: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.8)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: alpha('#fff', 0.1),
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -120,
          left: -120,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: alpha('#fff', 0.1),
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={5}
          sx={{
            borderRadius: 5,
            py: { xs: 4, md: 6 },
            px: { xs: 3, md: 8 },
            textAlign: 'center',
            overflow: 'hidden',
            position: 'relative',
            background: `linear-gradient(135deg, 
              ${theme.palette.background.paper} 0%,
              ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
            Ready to Excel in Your Exams?
          </Typography>

          <Typography
            variant="h6"
            component="p"
            color="text.secondary"
            sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}
          >
            Join thousands of students who are using our platform to prepare effectively, 
            track their progress, and achieve their academic goals.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(user ? '/dashboard' : '/signin')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: theme.shadows[5],
              }}
            >
              {user ? 'Go to Dashboard' : 'Get Started Now'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/tests')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              Browse Available Tests
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 4, color: theme.palette.text.secondary }}>
            No credit card required. Start with a free account and upgrade anytime.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}