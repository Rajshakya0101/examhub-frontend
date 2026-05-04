import { useLocation, NavLink } from 'react-router-dom';
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  Badge,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useAuthState } from '@/lib/auth';
import { useGuestMode } from '@/lib/guestContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import HistoryIcon from '@mui/icons-material/History';

export default function SideNav() {
  const location = useLocation();
  const user = useAuthState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { isGuestMode } = useGuestMode();

  const guestNavItems = [
    { label: 'Quick Quiz', path: '/quick-quiz', icon: <QuizIcon /> },
    { label: 'Full Mock', path: '/full-mock', icon: <AssignmentIcon /> },
    { label: 'Sectional', path: '/sectional-mock', icon: <MenuBookIcon /> },
    { label: 'Topic-wise', path: '/topic-wise-mock', icon: <NewspaperIcon /> },
  ];

  const regularNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Practice', path: '/practice', icon: <SchoolIcon /> },
    { label: 'Tests', path: '/tests', icon: <AssignmentIcon /> },
    { label: 'Attempts', path: '/attempts', icon: <HistoryIcon /> },
    { label: 'Leaderboard', path: '/leaderboard', icon: <EmojiEventsIcon /> },
  ];

  const navItems = isGuestMode ? guestNavItems : regularNavItems;
  const desktopWidth = 240;

  // Get the active path value
  const getCurrentValue = () => {
    const item = navItems.find(item => location.pathname === item.path);
    return item ? item.path : '/dashboard';
  };

  // Desktop left-side nav
  if (!isMobile && user) {
    return (
      <Box
        sx={{
          width: desktopWidth,
          flexShrink: 0,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            width: desktopWidth,
            height: 'calc(100vh - 64px)',
            borderRight: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            overflowY: 'auto',
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(28, 28, 28, 0.96)'
              : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
              Navigation
            </Typography>
          </Box>

          <List sx={{ px: 1.5, pt: 0 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  mx: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                  {item.path === '/tests' ? (
                    <Badge color="error" badgeContent={2} max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

  // Only show mobile bottom navigation on mobile devices and when user is logged in
  if (!isMobile || !user) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', position: 'fixed', bottom: 0, left: 0, zIndex: 1000 }}>
      <Paper 
        elevation={8} 
        sx={{ 
          borderTopLeftRadius: 16, 
          borderTopRightRadius: 16,
          overflow: 'hidden',
        }}
      >
        <BottomNavigation
          value={getCurrentValue()}
          showLabels
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              py: 1,
              px: 0.5,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              component={NavLink}
              to={item.path}
              label={item.label}
              value={item.path}
              icon={
                item.path === '/tests' ? (
                  <Badge color="error" badgeContent={2} max={99}>
                    {item.icon}
                  </Badge>
                ) : item.icon
              }
            />
          ))}
          
          {user && (
            <BottomNavigationAction
              component={NavLink}
              to="/profile"
              value="/profile"
              label="Profile"
              icon={
                user.photoURL ? (
                  <Box 
                    component="img" 
                    src={user.photoURL}
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%',
                      border: location.pathname === '/profile' 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : 'none'
                    }} 
                  />
                ) : (
                  <AccountCircleIcon />
                )
              }
            />
          )}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}