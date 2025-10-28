import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNotifications } from '@/lib/notifications/notificationContext';

export default function NotificationDemo() {
  const { addNotification } = useNotifications();
  
  const createInfoNotification = () => {
    addNotification({
      title: 'Information',
      message: 'This is an information notification example',
      type: 'info',
      link: '/dashboard'
    });
  };

  const createSuccessNotification = () => {
    addNotification({
      title: 'Success!',
      message: 'Your test was submitted successfully',
      type: 'success',
      link: '/tests'
    });
  };

  const createWarningNotification = () => {
    addNotification({
      title: 'Warning',
      message: 'You have less than 5 minutes remaining in your test',
      type: 'warning'
    });
  };

  const createErrorNotification = () => {
    addNotification({
      title: 'Error',
      message: 'Failed to save your progress. Please try again',
      type: 'error'
    });
  };

  return (
    <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', mb: 4, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Notification Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click the buttons below to create different types of notifications. Then click the bell icon in the top bar to view them.
      </Typography>
      
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" color="info" onClick={createInfoNotification}>
          Create Info Notification
        </Button>
        <Button variant="outlined" color="success" onClick={createSuccessNotification}>
          Create Success Notification
        </Button>
        <Button variant="outlined" color="warning" onClick={createWarningNotification}>
          Create Warning Notification
        </Button>
        <Button variant="outlined" color="error" onClick={createErrorNotification}>
          Create Error Notification
        </Button>
      </Stack>
    </Box>
  );
}