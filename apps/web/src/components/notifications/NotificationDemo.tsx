import { Button, Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { useNotifications } from '@/lib/notifications/notificationContext';
import AddAlertIcon from '@mui/icons-material/AddAlert';

export default function NotificationDemo() {
  const { addNotification } = useNotifications();
  const theme = useTheme();

  const createInfoNotification = () => {
    addNotification({
      title: 'New Feature Available',
      message: 'We\'ve added a new practice section for Verbal Ability. Check it out now!',
      type: 'info',
      link: '/practice'
    });
  };

  const createSuccessNotification = () => {
    addNotification({
      title: 'Test Completed',
      message: 'Congratulations! You\'ve successfully completed the Banking PO Mock Test with 85% accuracy.',
      type: 'success',
      link: '/dashboard'
    });
  };

  const createWarningNotification = () => {
    addNotification({
      title: 'Upcoming Test',
      message: 'Your scheduled test "SSC CGL Mock Test" will start in 30 minutes. Get ready!',
      type: 'warning',
      link: '/tests'
    });
  };

  const createErrorNotification = () => {
    addNotification({
      title: 'Subscription Expiring',
      message: 'Your premium subscription will expire in 2 days. Renew now to avoid interruption.',
      type: 'error',
      link: '/settings'
    });
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        mb: 3,
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <AddAlertIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        Notification System Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click the buttons below to test different types of notifications. Check the bell icon in the navigation bar.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="info" 
          onClick={createInfoNotification}
        >
          Send Info
        </Button>
        <Button 
          variant="outlined" 
          color="success" 
          onClick={createSuccessNotification}
        >
          Send Success
        </Button>
        <Button 
          variant="outlined" 
          color="warning" 
          onClick={createWarningNotification}
        >
          Send Warning
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={createErrorNotification}
        >
          Send Error
        </Button>
      </Box>
    </Paper>
  );
}