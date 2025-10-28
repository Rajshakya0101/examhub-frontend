import React from 'react';
import { Box, Container, Typography, Button, Grid, InputBase, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const HeroSection: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        background: theme => theme.palette.mode === 'dark' 
          ? 'linear-gradient(to bottom right, #1a1a2e, #16213e)' 
          : 'linear-gradient(to bottom right, #f0f4ff, #e0e7ff)',
        color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit',
        pt: { xs: 6, md: 12 },
        pb: { xs: 8, md: 14 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Abstract background shapes */}
      <Box
        sx={{
          position: 'absolute',
          right: -100,
          top: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0) 70%)',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: -50,
          bottom: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0) 70%)',
          zIndex: 0
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  mb: 2,
                  background: 'linear-gradient(45deg, #7c3aed 30%, #ec4899 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Ace Your Exams with Confidence
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  fontWeight: 'normal',
                  color: theme => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.700',
                  maxWidth: 550
                }}
              >
                Practice with thousands of exam questions, track your progress, and boost your confidence for any certification or academic test.
              </Typography>
              
              <Paper
                elevation={3}
                sx={{
               //    p: '1px 1px',
                  display: 'flex',
                  alignItems: 'center',
                  width: { xs: '100%', sm: 450 },
                  mb: 4,
                  borderRadius: 2
                }}
              >
                <SearchIcon sx={{ p: 0, ml: 1, color: 'action.active' }} />
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search for exams or question banks..."
                />
                <Button
                  variant="contained"
                  sx={{
                    borderRadius: '0 16px 16px 0',
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    py: 1,
                    px: 2
                  }}
                >
                  Search
                </Button>
              </Paper>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2
                    }
                  }}
                >
                  Explore Features
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="/images/hero-illustration.svg"
              alt="Student studying"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 2,
                boxShadow: 8,
                transform: 'perspective(1000px) rotateY(-10deg)',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'perspective(1000px) rotateY(-5deg)'
                }
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;