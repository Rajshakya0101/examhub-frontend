import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationState } from './notificationTypes';

// Initial mock notifications
const mockNotifications: Notification[] = [
  {
    id: uuidv4(),
    title: 'New test available',
    message: 'SSC CGL 2023 Mock Test is now available. Practice now to improve your score!',
    type: 'info',
    isRead: false,
    link: '/tests',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: uuidv4(),
    title: 'Congratulations!',
    message: 'You completed your daily practice goal. Keep up the good work!',
    type: 'success',
    isRead: false,
    link: '/dashboard',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: uuidv4(),
    title: 'Score Updated',
    message: 'Your recent test results have been processed. Your rank has improved by 5 positions!',
    type: 'success',
    isRead: true,
    link: '/leaderboard',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
  },
  {
    id: uuidv4(),
    title: 'Reminder',
    message: 'You have scheduled a mock test for Banking PO tomorrow at 10:00 AM.',
    type: 'warning',
    isRead: true,
    link: '/calendar',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: uuidv4(),
    title: 'New Feature',
    message: 'We\'ve added new practice questions for Quantitative Aptitude. Try them now!',
    type: 'info',
    isRead: true,
    link: '/practice',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  }
];

// Initial state
const initialState: NotificationState = {
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.isRead).length,
  isOpen: false,
};

// Action types
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'isRead' | 'timestamp'> }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_NOTIFICATION_PANEL' }
  | { type: 'CLOSE_NOTIFICATION_PANEL' };

// Reducer function
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        ...action.payload,
        id: uuidv4(),
        isRead: false,
        timestamp: new Date(),
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
      
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.isRead).length,
      };
      
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
      
    case 'REMOVE_NOTIFICATION':
      const remainingNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      return {
        ...state,
        notifications: remainingNotifications,
        unreadCount: remainingNotifications.filter(n => !n.isRead).length,
      };
      
    case 'TOGGLE_NOTIFICATION_PANEL':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
      
    case 'CLOSE_NOTIFICATION_PANEL':
      return {
        ...state,
        isOpen: false,
      };
      
    default:
      return state;
  }
};

// Create context
type NotificationContextType = {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Optional: Display a toast notification
    // toast.success(notification.message);
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  // Remove notification
  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  // Toggle notification panel
  const toggleNotificationPanel = () => {
    dispatch({ type: 'TOGGLE_NOTIFICATION_PANEL' });
  };

  // Close notification panel
  const closeNotificationPanel = () => {
    dispatch({ type: 'CLOSE_NOTIFICATION_PANEL' });
  };

  // Save notifications to local storage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(state.notifications));
  }, [state.notifications]);

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        toggleNotificationPanel,
        closeNotificationPanel,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook for using notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};