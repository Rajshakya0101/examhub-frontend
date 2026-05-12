import { useState } from 'react';
import { Link as RouterLink, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ThemeToggle } from './ThemeToggle';
import { useAuthState, signOut } from '@/lib/auth';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationPanel from '../notifications/NotificationPanel';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HistoryIcon from '@mui/icons-material/History';

const regularNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ pointerEvents: 'none' }} /> },
  { label: 'Practice', path: '/practice', icon: <SchoolIcon sx={{ pointerEvents: 'none' }} /> },
  { label: 'Tests', path: '/tests', icon: <AssignmentIcon sx={{ pointerEvents: 'none' }} /> },
  { label: 'Attempts', path: '/attempts', icon: <HistoryIcon sx={{ pointerEvents: 'none' }} /> },
  { label: 'Leaderboard', path: '/leaderboard', icon: <EmojiEventsIcon sx={{ pointerEvents: 'none' }} /> },
];

export default function TopBar() {
  const user = useAuthState();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isHomePage = location.pathname === '/';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleOpenMobileMenu = () => {
    setMobileDrawerOpen(true);
  };
  
  const handleCloseMobileMenu = () => {
    setMobileDrawerOpen(false);
  };
  
  const handleSignOut = () => {
    signOut();
    handleCloseMenu();
    navigate('/');
  };

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
              aria-label="menu"
              onClick={handleOpenMobileMenu}
              sx={{
                position: 'relative',
                mr: 1,
                width: 40,
                height: 40,
                borderRadius: 1,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background: 'transparent',
                },
                '& svg, & path, & g, & use': {
                  pointerEvents: 'none',
                },
              }}
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
              decoration: 'none',
              pointerEvents: 'none',
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
                pointerEvents: 'none',
              }}
            >
              ExamHub
            </Typography>
          </Box>

          {user && isHomePage && !isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                ml: 2,
                flex: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              {regularNavItems.map((item) => (
                <Button
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    position: 'relative',
                    minWidth: 'auto',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'text.secondary',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      background: 'transparent',
                    },
                    '& .MuiButton-startIcon, & .MuiSvgIcon-root, & svg, & path, & g, & use': {
                      pointerEvents: 'none',
                    },
                    '&.active': {
                      color: 'primary.main',
                      bgcolor: 'rgba(37, 99, 235, 0.08)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Mobile side Drawer navigation */}
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={handleCloseMobileMenu}
            ModalProps={{ keepMounted: true }}
          >
            <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700
                }}>EH</Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>ExamHub</Typography>
              </Box>

              <Divider />

              <List sx={{ flex: '0 0 auto' }}>
                {regularNavItems.map((item) => (
                  <ListItemButton
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    onClick={handleCloseMobileMenu}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                ))}
              </List>

              <Box sx={{ flex: '1 1 auto' }} />

              <Divider />

              <List>
                {!user ? (
                  <ListItemButton component={RouterLink} to="/signin" onClick={handleCloseMobileMenu}>
                    <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                    <ListItemText primary="Sign In" />
                  </ListItemButton>
                ) : (
                  <>
                    <ListItemButton component={RouterLink} to="/profile" onClick={handleCloseMobileMenu}>
                      <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                      <ListItemText primary="Profile" />
                    </ListItemButton>
                    <ListItemButton component={RouterLink} to="/settings" onClick={handleCloseMobileMenu}>
                      <ListItemIcon><SettingsIcon /></ListItemIcon>
                      <ListItemText primary="Settings" />
                    </ListItemButton>
                    <ListItemButton onClick={() => { handleSignOut(); handleCloseMobileMenu(); }}>
                      <ListItemIcon><LogoutIcon /></ListItemIcon>
                      <ListItemText primary="Sign Out" sx={{ color: 'error.main' }} />
                    </ListItemButton>
                  </>
                )}
              </List>
            </Box>
          </Drawer>

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
                      position: 'relative',
                      width: 40,
                      height: 40,
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: '50%',
                      transition: 'all 0.2s ease-in-out',
                      overflow: 'hidden',
                      flexShrink: 0,
                      p: 0,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: 'transparent',
                      },
                      '& svg, & path, & g, & use': {
                        pointerEvents: 'none',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(37, 99, 235, 0.1)'
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 14,
                        backgroundColor: theme.palette.primary.main,
                        backgroundImage: user.photoURL ? `url(${user.photoURL})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        pointerEvents: 'none',
                      }}
                    >
                      {!user.photoURL && (user.displayName || user.email || '?').charAt(0).toUpperCase()}
                    </Box>
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