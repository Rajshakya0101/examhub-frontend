import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ThemeToggle } from './ThemeToggle';
import { useAuthState, signOut } from '@/lib/auth';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationPanel from '../notifications/NotificationPanel';

export default function TopBar() {
  const user = useAuthState();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleOpenMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };
  
  const handleCloseMobileMenu = () => {
    setMobileMenuAnchor(null);
  };
  
  const handleSignOut = () => {
    signOut();
    handleCloseMenu();
    navigate('/');
  };
  
  // Navigation items with icons
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Practice', path: '/practice', icon: <SchoolIcon fontSize="small" /> },
    { label: 'AI Mock Tests', path: '/tests', icon: <AssignmentIcon fontSize="small" /> },
    { label: 'Leaderboard', path: '/leaderboard', icon: <EmojiEventsIcon fontSize="small" /> },
  ];

  return (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={1}
      sx={{
        backdropFilter: 'blur(8px)',
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(38, 38, 38, 0.85)' 
          : 'rgba(255, 255, 255, 0.85)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ height: 64, py: 1 }}>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleOpenMobileMenu}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo and title */}
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit',
              '&:hover': {
                textDecoration: 'none',
              },
              mr: 2
            }}
          >
            <Box sx={{ 
              width: 36, 
              height: 36, 
              mr: 1, 
              borderRadius: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              decoration: 'none'
            }}>
              EH
            </Box>
            <Typography
              variant="h6"
              noWrap
              sx={{ 
                fontWeight: 700,
                display: { xs: 'none', sm: 'block' },
                decoration: 'none',
              }}
            >
              ExamHub
            </Typography>
          </Box>

          {/* Navigation Links - Desktop */}
          {!isMobile && user && (
            <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button 
                  key={item.path}
                  component={RouterLink} 
                  to={item.path}
                  startIcon={item.icon}
                  color={location.pathname === item.path ? 'primary' : 'inherit'}
                  variant={location.pathname === item.path ? 'contained' : 'text'}
                  sx={{ 
                    borderRadius: 2,
                    px: 2,
                    py: 0.5
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}

          {/* Mock Test Buttons removed - accessible via Tests page */}

          {/* Mobile Navigation Menu */}
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleCloseMobileMenu}
            PaperProps={{
              sx: {
                width: '100%',
                maxWidth: 300,
                mt: 1.5
              }
            }}
          >
            {user && navItems.map((item) => (
              <MenuItem 
                key={item.path} 
                component={RouterLink} 
                to={item.path} 
                onClick={handleCloseMobileMenu}
                selected={location.pathname === item.path}
                sx={{ py: 1.5 }}
              >
                <Box sx={{ mr: 2, color: 'primary.main' }}>{item.icon}</Box>
                <Typography>{item.label}</Typography>
              </MenuItem>
            ))}
            {!user && (
              <MenuItem 
                component={RouterLink} 
                to="/signin" 
                onClick={handleCloseMobileMenu}
                sx={{ py: 1.5 }}
              >
                <Box sx={{ mr: 2, color: 'primary.main' }}><AccountCircleIcon /></Box>
                <Typography>Sign In</Typography>
              </MenuItem>
            )}
          </Menu>

          {/* Right side: Theme toggle and user menu */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            {/* Notifications */}
            {user && (
              <Box sx={{ mr: 1 }}>
                <NotificationPanel />
              </Box>
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle sx={{ mr: 1 }} />

            {/* User Menu */}
            {user ? (
              <>
                <Tooltip title={user.displayName || user.email || 'User account'}>
                  <IconButton 
                    onClick={handleOpenMenu} 
                    sx={{ 
                      p: 0.5,
                      border: `2px solid ${theme.palette.primary.main}`,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: 'rgba(37, 99, 235, 0.1)'
                      }
                    }}
                  >
                    {user.photoURL ? (
                      <Avatar 
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: theme.palette.primary.main 
                        }}
                      >
                        {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseMenu}
                  keepMounted
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    elevation: 3,
                    sx: { 
                      mt: 1.5,
                      minWidth: 200,
                      overflow: 'visible',
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
                      },
                    }
                  }}
                >
                  <Box sx={{ p: 2, pb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user.displayName || 'User'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                      {user.email}
                    </Typography>
                  </Box>
                  
                  <MenuItem 
                    component={RouterLink} 
                    to="/profile" 
                    onClick={handleCloseMenu}
                    sx={{ py: 1.5 }}
                  >
                    <AccountCircleIcon fontSize="small" sx={{ mr: 2 }} />
                    Profile
                  </MenuItem>
                  
                  <MenuItem 
                    component={RouterLink} 
                    to="/settings" 
                    onClick={handleCloseMenu}
                    sx={{ py: 1.5 }}
                  >
                    <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
                    Settings
                  </MenuItem>
                  
                  <Box sx={{ my: 0.5, borderTop: `1px solid ${theme.palette.divider}` }} />
                  
                  <MenuItem 
                    onClick={handleSignOut}
                    sx={{ py: 1.5, color: 'error.main' }}
                  >
                    <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                component={RouterLink} 
                to="/signin" 
                variant="contained" 
                color="primary" 
                sx={{ 
                  ml: 2, 
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}