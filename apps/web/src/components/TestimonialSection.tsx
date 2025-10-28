import React from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Avatar, Stack, IconButton } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

interface TestimonialProps {
  content: string;
  name: string;
  title: string;
  avatar: string;
}

const testimonials: TestimonialProps[] = [
  {
    content: "The ExamHub platform has been a game-changer for my studies. The practice exams are spot-on and the analytics helped me identify my weak areas quickly.",
    name: "Alex Johnson",
    title: "Computer Science Student",
    avatar: "/images/avatars/avatar-1.jpg"
  },
  {
    content: "I used ExamHub to prepare for my certification exams and passed with flying colors. The realistic exam environment really helped me prepare mentally.",
    name: "Sarah Williams",
    title: "Software Developer",
    avatar: "/images/avatars/avatar-2.jpg"
  },
  {
    content: "The variety of exams available is impressive. I've been using ExamHub for both my university courses and professional certifications.",
    name: "Michael Chen",
    title: "Engineering Student",
    avatar: "/images/avatars/avatar-3.jpg"
  },
  {
    content: "What sets ExamHub apart is the detailed performance analytics. I could see my improvement over time which kept me motivated to continue practicing.",
    name: "Jessica Miller",
    title: "Data Science Professional",
    avatar: "/images/avatars/avatar-4.jpg"
  },
  {
    content: "As a teacher, I recommend ExamHub to all my students. It's a valuable resource that complements classroom learning perfectly.",
    name: "David Wilson",
    title: "High School Teacher",
    avatar: "/images/avatars/avatar-5.jpg"
  }
];

const TestimonialCard: React.FC<TestimonialProps> = ({ content, name, title, avatar }) => (
  <Card 
    elevation={2}
    sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: 2,
      p: 2
    }}
  >
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 2, color: 'primary.main' }}>
        <FormatQuoteIcon fontSize="large" />
      </Box>
      <Typography variant="body1" paragraph sx={{ mb: 3, fontStyle: 'italic' }}>
        "{content}"
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          src={avatar}
          alt={name}
          sx={{ width: 50, height: 50, mr: 2 }}
        />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const TestimonialSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };
  
  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  
  // Get current testimonial and one on each side for desktop view
  const visibleTestimonials = [
    testimonials[(activeIndex - 1 + testimonials.length) % testimonials.length],
    testimonials[activeIndex],
    testimonials[(activeIndex + 1) % testimonials.length]
  ];

  return (
    <Box 
      component="section" 
      sx={{ 
        py: 8,
        backgroundImage: 'linear-gradient(to bottom, rgba(124, 58, 237, 0.05), rgba(236, 72, 153, 0.05))'
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
            What Our Users Say
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Join thousands of satisfied students and professionals who have improved their exam performance with ExamHub.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', my: 4 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3} 
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            {visibleTestimonials.map((testimonial, index) => (
              <Box 
                key={index} 
                sx={{ 
                  flex: 1,
                  opacity: index === 1 ? 1 : { xs: 1, md: 0.7 },
                  transform: index === 1 ? 'scale(1)' : { xs: 'scale(1)', md: 'scale(0.95)' },
                  transition: 'all 0.3s ease',
                  display: { xs: index === 1 ? 'block' : 'none', md: 'block' }
                }}
              >
                <TestimonialCard {...testimonial} />
              </Box>
            ))}
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <IconButton 
              onClick={handlePrev} 
              sx={{ 
                mr: 2, 
                bgcolor: 'background.paper', 
                '&:hover': { bgcolor: 'primary.light' } 
              }}
            >
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={handleNext} 
              sx={{ 
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'primary.light' } 
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            color="primary"
            sx={{ 
              borderRadius: 2,
              px: 4,
              boxShadow: 2
            }}
          >
            Join Our Community
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default TestimonialSection;