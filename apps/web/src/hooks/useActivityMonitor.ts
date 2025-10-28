import { useState, useEffect } from 'react';

type ActivityMonitorOptions = {
  timeout: number;  // Timeout in milliseconds
  onIdle?: () => void;
  onActive?: () => void;
  events?: string[];
};

/**
 * Hook to monitor user activity and detect idle time
 * @param options Configuration options
 * @returns Object with activity state and reset function
 */
export default function useActivityMonitor(options: ActivityMonitorOptions) {
  const { 
    timeout = 60 * 60 * 1000,  // Default to 60 minutes
    onIdle,
    onActive,
    events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click']
  } = options;

  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Reset the idle timer
  const resetTimer = () => {
    setLastActivity(Date.now());
    setIsIdle(false);
    if (isIdle && onActive) {
      onActive();
    }
  };

  useEffect(() => {
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners for user activity
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isIdle, events, onActive]);

  useEffect(() => {
    // Start or reset the idle timer
    if (timerId) {
      clearTimeout(timerId);
    }

    const id = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= timeout) {
        setIsIdle(true);
        if (onIdle) {
          onIdle();
        }
      }
    }, timeout);

    setTimerId(id);

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [lastActivity, timeout, onIdle]);

  return {
    isIdle,
    lastActivity,
    resetTimer
  };
}