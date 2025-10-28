import React from 'react';
import { Box, Typography, Container, Button, Grid, Card, CardContent } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DevicesIcon from '@mui/icons-material/Devices';
import AnalyticsIcon from '@mui/icons-material/Analytics';

interface CourseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ title, description, icon, color }) => (
  <Card 
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
      },
      borderRadius: 2
    }}
    elevation={2}
  >
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 2, color: color }}>{icon}</Box>
      <Typography gutterBottom variant="h5" component="h2" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const CoursesSection: React.FC = () => {
  const courses = [
    {
      title: 'Wide Range of Exams',
      description: 'Access a comprehensive library of practice tests across various subjects and difficulty levels.',
      icon: <SchoolIcon fontSize="large" />,
      color: '#7c3aed'
    },
    {
      title: 'Timed Practice',
      description: 'Simulate real exam conditions with our customizable timer and pressure training options.',
      icon: <AccessTimeIcon fontSize="large" />,
      color: '#0ea5e9'
    },
    {
      title: 'Cross-Platform',
      description: 'Access your exams on any device, anytime. Study on your terms with our responsive platform.',
      icon: <DevicesIcon fontSize="large" />,
      color: '#10b981'
    },
    {
      title: 'Performance Analytics',
      description: 'Track your progress with detailed analytics and identify areas for improvement.',
      icon: <AnalyticsIcon fontSize="large" />,
      color: '#f59e0b'
    }
  ];

  return (
    <Box component="section" sx={{ py: 8, bgcolor: 'background.default' }}>
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
            Popular Exam Categories
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Choose from our most popular exam categories or browse our full library to find exactly what you need.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {courses.map((course, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <CourseCard
                title={course.title}
                description={course.description}
                icon={course.icon}
                color={course.color}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Browse All Categories
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CoursesSection;