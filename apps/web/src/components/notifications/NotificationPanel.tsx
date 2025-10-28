import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Paper,
  useTheme,
  alpha,
  ListItemSecondaryAction,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  CheckCircleOutline as MarkReadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/lib/notifications/notificationContext';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/lib/notifications/notificationTypes';

const NotificationIcon = ({ type }: { type: string }) => {
  const theme = useTheme();
  
  const getIconStyles = (color: string) => ({
    bgcolor: alpha(color, 0.12),
    width: 40,
    height: 40,
    border: 'none',
    boxShadow: `0 2px 8px ${alpha(color, 0.25)}`,
  });
  
  switch (type) {
    case 'info':
      return (
        <Avatar sx={{ ...getIconStyles(theme.palette.info.main) }}>
          <InfoIcon sx={{ color: theme.palette.info.main }} />
        </Avatar>
      );
    case 'success':
      return (
        <Avatar sx={{ ...getIconStyles(theme.palette.success.main) }}>
          <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
        </Avatar>
      );
    case 'warning':
      return (
        <Avatar sx={{ ...getIconStyles(theme.palette.warning.main) }}>
          <WarningIcon sx={{ color: theme.palette.warning.main }} />
        </Avatar>
      );
    case 'error':
      return (
        <Avatar sx={{ ...getIconStyles(theme.palette.error.main) }}>
          <ErrorIcon sx={{ color: theme.palette.error.main }} />
        </Avatar>
      );
    default:
      return (
        <Avatar sx={{ ...getIconStyles(theme.palette.primary.main) }}>
          <NotificationsIcon sx={{ color: theme.palette.primary.main }} />
        </Avatar>
      );
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // Difference in seconds
  
  if (diff < 60) {
    return 'Just now';
  } else if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function NotificationPanel() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { 
    state, 
    toggleNotificationPanel, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<number>(0);
  
  // Handle notification button click
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    toggleNotificationPanel();
  };
  
  // Handle close
  const handleClose = () => {
    setAnchorEl(null);
    toggleNotificationPanel();
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    handleClose();
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };
  
  // Filter notifications based on tab
  const filteredNotifications = state.notifications.filter(notification => {
    if (tab === 0) return true; // All
    if (tab === 1) return !notification.isRead; // Unread
    return notification.isRead; // Read
  });
  
  // Control popover open state
  useEffect(() => {
    if (state.isOpen && buttonRef.current && !anchorEl) {
      setAnchorEl(buttonRef.current);
    } else if (!state.isOpen && anchorEl) {
      setAnchorEl(null);
    }
  }, [state.isOpen, anchorEl]);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          ref={buttonRef}
          color="inherit"
          size="medium"
          onClick={handleClick}
          sx={{ 
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              background: alpha(theme.palette.primary.main, 0.08),
            },
            ...(state.isOpen && {
              background: alpha(theme.palette.primary.main, 0.12),
            }),
          }}
        >
          <Badge 
            badgeContent={state.unreadCount} 
            color="error"
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                height: 18,
                minWidth: 18,
                padding: '0 4px',
                boxShadow: theme.shadows[2],
                animation: state.unreadCount > 0 ? `pulse 1.5s infinite` : 'none',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                  },
                },
              }
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 6,
          sx: {
            mt: 1.5,
            width: 380,
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              boxShadow: `0 -1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
              borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2.5, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 0)} 100%)`,
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            color: theme.palette.primary.main,
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: 4,
              height: 16,
              borderRadius: 2,
              background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              marginRight: 1,
            }
          }}>
            Notifications
            {state.unreadCount > 0 && (
              <Box sx={{ 
                ml: 1, 
                fontSize: '0.75rem', 
                bgcolor: theme.palette.error.main,
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 8px',
                fontWeight: 600,
              }}>
                {state.unreadCount}
              </Box>
            )}
          </Typography>
          {state.unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton
                size="small"
                onClick={() => markAllAsRead()}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <MarkReadIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                px: 1,
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  fontWeight: 600,
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }
            }}
          >
            <Tab label="All" />
            <Tab 
              label="Unread" 
              sx={{ 
                color: state.unreadCount > 0 ? 'error.main' : 'inherit',
                fontWeight: state.unreadCount > 0 ? 600 : 500,
              }}
            />
            <Tab label="Read" />
          </Tabs>
        </Box>
        
        <List sx={{ 
          p: 0, 
          maxHeight: 320, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.text.primary, 0.05),
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.2),
            borderRadius: '3px',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.3),
            }
          },
        }}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ 
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: notification.isRead 
                      ? 'inherit' 
                      : alpha(theme.palette.primary.main, 0.04),
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                    },
                    ...(notification.isRead ? {} : {
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: '60%',
                        backgroundColor: 
                          notification.type === 'error' ? theme.palette.error.main :
                          notification.type === 'warning' ? theme.palette.warning.main :
                          notification.type === 'success' ? theme.palette.success.main :
                          notification.type === 'info' ? theme.palette.info.main :
                          theme.palette.primary.main,
                        borderRadius: '0 4px 4px 0',
                      }
                    }),
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <NotificationIcon type={notification.type} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          fontWeight: notification.isRead ? 500 : 600,
                          mb: 0.5,
                          pr: 5,
                          color: notification.isRead ? 'text.primary' : theme.palette.primary.main,
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.5,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ 
                            display: 'block',
                            fontWeight: 500,
                            color: alpha(theme.palette.text.secondary, 0.8),
                          }}
                        >
                          {formatTime(new Date(notification.timestamp))}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction sx={{ right: 8 }}>
                    {!notification.isRead && (
                      <Tooltip title="Mark as read">
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          sx={{ 
                            mb: 1,
                            width: 28,
                            height: 28,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.15),
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <MarkReadIcon sx={{ fontSize: 16 }} color="primary" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Remove">
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        sx={{ 
                          mt: 1,
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            color: theme.palette.error.main,
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                          <DeleteIcon 
                          sx={{ 
                            fontSize: 16,
                            color: 'action.active',
                            '&:hover': { color: theme.palette.error.main }
                          }} 
                        />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider sx={{ opacity: 0.6 }} />}
              </Box>
            ))
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 8,
              px: 3,
            }}>
              <Box sx={{ 
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
              }}>
                <NotificationsIcon sx={{ 
                  fontSize: 40, 
                  color: alpha(theme.palette.primary.main, 0.7),
                }} />
              </Box>
              <Typography variant="subtitle2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                {tab === 0 
                  ? "No Notifications"
                  : tab === 1
                    ? "No Unread Notifications"
                    : "No Read Notifications"}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ opacity: 0.7 }}>
                {tab === 0 
                  ? "You don't have any notifications yet."
                  : tab === 1
                    ? "All notifications have been read."
                    : "You haven't read any notifications yet."}
              </Typography>
            </Box>
          )}
        </List>
        
        {filteredNotifications.length > 0 && (
          <Box sx={{ 
            p: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'center',
            background: `linear-gradient(to top, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
            position: 'sticky',
            bottom: 0,
            backdropFilter: 'blur(8px)',
            zIndex: 1,
          }}>
            <Button 
              fullWidth
              variant="contained" 
              disableElevation
              onClick={handleClose}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: 'translateY(-1px)',
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                }
              }}
            >
              View All
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}