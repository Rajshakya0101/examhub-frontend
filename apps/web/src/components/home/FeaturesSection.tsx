import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import InsightsIcon from '@mui/icons-material/Insights';
import PersonalizeIcon from '@mui/icons-material/Tune';
import CompareIcon from '@mui/icons-material/Compare';
import DevicesIcon from '@mui/icons-material/Devices';
import SecurityIcon from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Real-time Performance Tracking',
    description: 'Monitor your progress with detailed statistics and visualizations that update in real-time as you practice and complete exams.',
    icon: <SpeedIcon fontSize="large" />,
    color: '#3b82f6',
  },
  {
    title: 'Advanced Analytics',
    description: 'Gain insights into your strengths and weaknesses with comprehensive analytics that break down your performance by topic and question type.',
    icon: <InsightsIcon fontSize="large" />,
    color: '#7c3aed',
  },
  {
    title: 'Personalized Learning Path',
    description: 'Get a customized study plan based on your performance data, focusing your efforts where they will have the greatest impact.',
    icon: <PersonalizeIcon fontSize="large" />,
    color: '#10b981',
  },
  {
    title: 'Peer Comparison',
    description: 'See how you stack up against other students with similar goals, and identify areas where you can improve to stay competitive.',
    icon: <CompareIcon fontSize="large" />,
    color: '#f59e0b',
  },
  {
    title: 'Cross-device Synchronization',
    description: 'Seamlessly continue your studies across all your devices with cloud synchronization that keeps your progress up-to-date everywhere.',
    icon: <DevicesIcon fontSize="large" />,
    color: '#ec4899',
  },
  {
    title: 'Secure Exam Environment',
    description: 'Take practice tests in a distraction-free environment that simulates actual exam conditions for the most realistic preparation possible.',
    icon: <SecurityIcon fontSize="large" />,
    color: '#6366f1',
  },
];

export default function FeaturesSection() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Powerful Features to Enhance Your Exam Preparation
          </Typography>
          <Typography
            variant="h6"
            component="p"
            color="text.secondary"
            sx={{ maxWidth: 800, mx: 'auto' }}
          >
            Our platform is designed to provide you with all the tools you need to succeed in your exams,
            from comprehensive analytics to personalized learning paths.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[8],
                  },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    py: 2,
                    px: 3,
                    bgcolor: alpha(feature.color, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                    borderBottom: `1px solid ${alpha(feature.color, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: alpha(feature.color, theme.palette.mode === 'dark' ? 0.3 : 0.2),
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                </Box>
                <CardContent sx={{ py: 3, flexGrow: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/signin')}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Create Your Account
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => navigate('/practice')}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Explore Practice Tests
          </Button>
        </Box>
      </Container>
    </Box>
  );
}