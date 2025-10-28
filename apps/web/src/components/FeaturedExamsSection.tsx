import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Button, Avatar, Rating } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArticleIcon from '@mui/icons-material/Article';

interface ExamCardProps {
  title: string;
  category: string;
  duration: string;
  questions: number;
  difficulty: string;
  rating: number;
  author: {
    name: string;
    avatar: string;
  };
  color: string;
}

const exams: ExamCardProps[] = [
  {
    title: "IBPS PO Prelims Mock Test",
    category: "Banking",
    duration: "60 min",
    questions: 100,
    difficulty: "Moderate",
    rating: 4.9,
    author: {
      name: "Raj Sharma",
      avatar: "/images/avatars/avatar-1.jpg"
    },
    color: "#7c3aed"
  },
  {
    title: "SSC CGL Tier I Exam",
    category: "Government",
    duration: "75 min",
    questions: 100,
    difficulty: "Advanced",
    rating: 4.8,
    author: {
      name: "Priya Patel",
      avatar: "/images/avatars/avatar-2.jpg"
    },
    color: "#0ea5e9"
  },
  {
    title: "RRB NTPC CBT Stage I",
    category: "Railways",
    duration: "90 min",
    questions: 100,
    difficulty: "Moderate",
    rating: 4.7,
    author: {
      name: "Amit Kumar",
      avatar: "/images/avatars/avatar-3.jpg"
    },
    color: "#10b981"
  }
];

const ExamCard: React.FC<ExamCardProps> = ({ 
  title, 
  category, 
  duration, 
  questions, 
  difficulty, 
  rating, 
  author,
  color 
}) => (
  <Card 
    sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: 2,
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
      }
    }}
    elevation={2}
  >
    <CardContent sx={{ flexGrow: 1, p: 3 }}>
      <Chip 
        label={category} 
        size="small" 
        sx={{ 
          mb: 2, 
          backgroundColor: color,
          color: 'white'
        }} 
      />
      <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Rating value={rating} precision={0.1} readOnly size="small" />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {rating}/5.0
        </Typography>
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {duration}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArticleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {questions} Q
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChartIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {difficulty}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={author.avatar}
            alt={author.name}
            sx={{ width: 24, height: 24, mr: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {author.name}
          </Typography>
        </Box>
        
        <Button 
          variant="outlined" 
          size="small"
          sx={{ 
            minWidth: 80,
            borderRadius: 1
          }}
        >
          Start
        </Button>
      </Box>
    </CardContent>
  </Card>
);

const FeaturedExamsSection: React.FC = () => {
  return (
    <Box component="section" sx={{ py: 8 }}>
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
            Competitive Exam Preparation
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Ace government job exams with our comprehensive mock tests for Banking, SSC, Defense, Railways, and more.
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {exams.map((exam, index) => (
            <Grid item key={index} xs={12} md={4}>
              <ExamCard {...exam} />
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button 
            variant="contained"
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4
            }}
          >
            Explore All Government Exams
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedExamsSection;