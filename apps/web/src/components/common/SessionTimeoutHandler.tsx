import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, LinearProgress } from '@mui/material';
import useSessionTimeout from '../../hooks/useSessionTimeout';
import { signOut } from '@/lib/auth';

// Convert ms to minutes and seconds for display
function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Session timeout in milliseconds (60 minutes)
const SESSION_TIMEOUT = 60 * 60 * 1000;

// Warning time before session expires (5 minutes)
const WARNING_TIME = 5 * 60 * 1000;

/**
 * Component to handle session timeout with warning dialog
 */
export default function SessionTimeoutHandler() {
  const [progress, setProgress] = useState<number>(100);
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  const {
    isWarningVisible,
    sessionExpired,
    extendSession,
    getTimeRemaining
  } = useSessionTimeout(SESSION_TIMEOUT, WARNING_TIME);

  // Effect to handle session expiration
  useEffect(() => {
    if (sessionExpired) {
      // Perform sign out when session expires
      signOut().catch(error => {
        console.error("Error signing out on session expiration:", error);
      });
    }
  }, [sessionExpired]);

  // Update progress bar and time left while warning is visible
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isWarningVisible) {
      intervalId = setInterval(() => {
        const remaining = getTimeRemaining();
        const progressValue = (remaining / WARNING_TIME) * 100;
        setProgress(progressValue);
        setTimeLeft(formatTimeRemaining(remaining));
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isWarningVisible, getTimeRemaining]);

  // Handle session extension
  const handleExtendSession = () => {
    extendSession();
  };

  return (
    <Dialog 
      open={isWarningVisible && !sessionExpired} 
      aria-labelledby="session-timeout-dialog"
    >
      <DialogTitle id="session-timeout-dialog">
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session will expire soon due to inactivity.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Time remaining: {timeLeft}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mt: 2, mb: 2 }} 
        />
        <Typography variant="body2" color="text.secondary">
          Click "Continue Session" to stay logged in.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleExtendSession} color="primary" variant="contained">
          Continue Session
        </Button>
        <Button onClick={() => signOut().catch(error => console.error("Error signing out:", error))} color="error">
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
}