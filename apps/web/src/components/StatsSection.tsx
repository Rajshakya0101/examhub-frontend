import React from 'react';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const StatsSection: React.FC = () => {
  const stats = [
    { 
      value: '10,000+', 
      label: 'Practice Exams',
      icon: <PublicIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
    },
    { 
      value: '100%', 
      label: 'Secure Platform',
      icon: <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
    },
    { 
      value: '24/7', 
      label: 'Customer Support',
      icon: <SupportAgentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
    }
  ];

  return (
    <Box
      component="section"
      sx={{
        py: 6,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid 
              item 
              key={index} 
              xs={12} 
              md={4}
              sx={{
                textAlign: 'center',
                py: 2
              }}
            >
              {stat.icon}
              <Typography 
                variant="h3" 
                component="p" 
                fontWeight="bold"
                sx={{
                  mb: 1,
                  background: 'linear-gradient(45deg, #7c3aed 30%, #ec4899 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {stat.value}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="outlined" 
            color="primary"
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
            Learn More About Us
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default StatsSection;