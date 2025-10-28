import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DevicesIcon from '@mui/icons-material/Devices';
import PeopleIcon from '@mui/icons-material/People';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SecurityIcon from '@mui/icons-material/Security';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: 6
      }
    }}
    elevation={2}
  >
    <CardContent sx={{ flexGrow: 1, p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          mb: 2
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const FeaturesSection: React.FC = () => {
  const theme = useTheme();

  const features: FeatureProps[] = [
    {
      icon: <AccessTimeIcon fontSize="large" />,
      title: 'Timed Assessments',
      description: 'Practice under realistic time constraints to improve your speed and accuracy in exam conditions.'
    },
    {
      icon: <AssessmentIcon fontSize="large" />,
      title: 'Detailed Analytics',
      description: 'Get comprehensive insights into your performance with detailed reports and improvement suggestions.'
    },
    {
      icon: <DevicesIcon fontSize="large" />,
      title: 'Multi-device Support',
      description: 'Access your practice exams from anywhere, on any device - desktop, tablet, or mobile.'
    },
    {
      icon: <PeopleIcon fontSize="large" />,
      title: 'Community Learning',
      description: 'Connect with fellow students, share insights, and learn collaboratively through discussion forums.'
    },
    {
      icon: <AutoGraphIcon fontSize="large" />,
      title: 'Adaptive Learning',
      description: 'Our system adapts to your skill level, focusing on areas where you need the most improvement.'
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'Secure Testing',
      description: 'Advanced proctoring features ensure the integrity of assessments with secure exam environments.'
    }
  ];

  return (
    <Box
      component="section"
      sx={{
        py: 8,
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              background: 'linear-gradient(45deg, #7c3aed 30%, #ec4899 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Features That Make Us Special
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Discover why thousands of students choose our platform for their exam preparation needs.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Feature {...feature} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;