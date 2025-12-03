import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage authentication session timeout
 * @param timeout Session timeout in milliseconds (default 60 minutes)
 * @param warningTime Time before timeout to show warning in milliseconds (default 5 minutes)
 * @returns Object with session state and control functions
 */
export default function useSessionTimeout(
  timeout: number = 60 * 60 * 1000,
  warningTime: number = 5 * 60 * 1000
) {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null);
  const [expirationTimer, setExpirationTimer] = useState<NodeJS.Timeout | null>(null);

  // List of events to monitor for user activity
  const events = [
    'mousedown',
    'mousemove',
    'keydown',
    'touchstart',
    'scroll',
    'click'
  ];

  // Reset the session timers when activity is detected
  const resetTimers = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setIsWarningVisible(false);
    setSessionExpired(false);

    // Clear existing timers
    if (warningTimer) {
      clearTimeout(warningTimer);
      setWarningTimer(null);
    }
    if (expirationTimer) {
      clearTimeout(expirationTimer);
      setExpirationTimer(null);
    }

    // Set new timers
    const newWarningTimer = setTimeout(() => {
      setIsWarningVisible(true);
    }, timeout - warningTime);

    const newExpirationTimer = setTimeout(() => {
      setSessionExpired(true);
    }, timeout);

    setWarningTimer(newWarningTimer);
    setExpirationTimer(newExpirationTimer);
  }, [timeout, warningTime]);

  // Track user activity to reset session timeout
  useEffect(() => {
    const handleUserActivity = () => {
      if (!sessionExpired) {
        resetTimers();
      }
    };

    // Initialize timers on first load
    handleUserActivity();

    // Add event listeners for user activity
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Clean up event listeners
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      if (warningTimer) {
        clearTimeout(warningTimer);
      }
      if (expirationTimer) {
        clearTimeout(expirationTimer);
      }
    };
  }, [resetTimers, sessionExpired]);

  // Manually extend the session
  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Calculate time remaining
  const getTimeRemaining = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = Math.max(0, timeout - elapsed);
    return remaining;
  }, [lastActivity, timeout]);

  return {
    isWarningVisible,
    sessionExpired,
    extendSession,
    getTimeRemaining,
    lastActivity
  };
}