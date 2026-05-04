import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function UnderDevelopment() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Feature under development
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're working on this feature. It will be available soon — stay tuned!
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}
