import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Rating,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Medical Student',
    avatar: '/images/avatars/avatar-1.jpg',
    rating: 5,
    text: 'This platform completely transformed my study routine. The practice tests are incredibly similar to the real exams, and the detailed analytics helped me identify my weak areas. I passed my boards with flying colors!',
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'Law Student',
    avatar: '/images/avatars/avatar-2.jpg',
    rating: 5,
    text: 'As someone preparing for the bar exam, I needed comprehensive practice. This platform provided exactly that with realistic questions and excellent explanations. The progress tracking feature kept me motivated throughout my studies.',
  },
  {
    id: 3,
    name: 'Jessica Rivera',
    role: 'Engineering Student',
    avatar: '/images/avatars/avatar-3.jpg',
    rating: 4,
    text: 'The personalized study plans and adaptive questions really helped me focus on areas where I needed improvement. The interface is intuitive and the analytics are incredibly detailed. Highly recommended!',
  },
  {
    id: 4,
    name: 'Michael Taylor',
    role: 'Graduate Student',
    avatar: '/images/avatars/avatar-4.jpg',
    rating: 5,
    text: 'I was struggling with time management during exams until I started using this platform. The timed practice sessions and performance metrics helped me improve my speed without sacrificing accuracy.',
  },
];

export default function TestimonialSection() {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [animation, setAnimation] = useState<'slideLeft' | 'slideRight' | null>(null);

  const handleNext = () => {
    setAnimation('slideLeft');
    setTimeout(() => {
      setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
      setAnimation(null);
    }, 300);
  };

  const handlePrev = () => {
    setAnimation('slideRight');
    setTimeout(() => {
      setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
      setAnimation(null);
    }, 300);
  };

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.primary.dark, 0.1)
          : alpha(theme.palette.primary.light, 0.1),
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 2, fontWeight: 700 }}
        >
          What Our Users Say
        </Typography>

        <Typography
          variant="h6"
          component="p"
          align="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}
        >
          Discover how our platform has helped students achieve their academic goals and excel in their exams.
        </Typography>

        <Box
          sx={{
            position: 'relative',
            maxWidth: 900,
            mx: 'auto',
            px: { xs: 0, md: 6 },
          }}
        >
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: { xs: -16, md: 0 },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: theme.palette.background.paper,
              boxShadow: theme.shadows[2],
              '&:hover': { bgcolor: theme.palette.background.paper },
              zIndex: 2,
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                transition: 'transform 0.3s ease',
                transform: animation === 'slideLeft' 
                  ? 'translateX(-10%)' 
                  : animation === 'slideRight' 
                    ? 'translateX(10%)' 
                    : 'translateX(0)',
                opacity: animation ? 0.5 : 1,
              }}
            >
              <Card
                elevation={3}
                sx={{
                  borderRadius: 4,
                  minHeight: 300,
                  width: '100%',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                }}
              >
                <Box
                  sx={{
                    width: { xs: '100%', md: '35%' },
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: alpha('#fff', 0.1),
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -30,
                      right: -30,
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: alpha('#fff', 0.1),
                    }}
                  />

                  <Avatar
                    src={testimonials[activeIndex].avatar}
                    alt={testimonials[activeIndex].name}
                    sx={{
                      width: 100,
                      height: 100,
                      mb: 2,
                      border: '4px solid white',
                      boxShadow: theme.shadows[3],
                    }}
                  />
                  <Typography variant="h6" component="div" align="center" fontWeight={600}>
                    {testimonials[activeIndex].name}
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                    {testimonials[activeIndex].role}
                  </Typography>
                  <Rating
                    value={testimonials[activeIndex].rating}
                    readOnly
                    size="small"
                  />
                </Box>

                <CardContent
                  sx={{
                    width: { xs: '100%', md: '65%' },
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ mb: 3, color: theme.palette.primary.main }}>
                    <FormatQuoteIcon fontSize="large" />
                  </Box>
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', mb: 4 }}>
                    {testimonials[activeIndex].text}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {testimonials.map((_, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: idx === activeIndex ? theme.palette.primary.main : theme.palette.grey[300],
                          }}
                        />
                      ))}
                    </Box>
                    
                    <Button 
                      variant="text" 
                      color="primary"
                      sx={{ fontWeight: 600 }}
                      onClick={handleNext}
                    >
                      Next Review
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: { xs: -16, md: 0 },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: theme.palette.background.paper,
              boxShadow: theme.shadows[2],
              '&:hover': { bgcolor: theme.palette.background.paper },
              zIndex: 2,
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
}