import React from 'react';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';

const CallToAction: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        py: 10,
        backgroundImage: 'linear-gradient(to right, rgba(124, 58, 237, 0.8), rgba(236, 72, 153, 0.8))',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Abstract shapes */}
      <Box 
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}
      />
      <Box 
        sx={{
          position: 'absolute',
          bottom: -30,
          left: '20%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}
      />
      
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={8} sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              component="h2" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Ready to elevate your exam performance?
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 4, fontWeight: 'normal', opacity: 0.9 }}>
              Join thousands of students who are already improving their scores with our platform.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                Sign Up Free
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ForumIcon />}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: 'white',
                    borderWidth: 2,
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Contact Sales
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CallToAction;