import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import TopBar from './TopBar';
import SideNav from './SideNav';
import { AuthGuard } from '../../lib/authContext';

interface LayoutProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  allowGuest?: boolean;
}

export default function Layout({ children, requireAuth = true, allowGuest = false }: LayoutProps) {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';
  const desktopNavWidth = 240;
  
  // For landing page, render the children directly without the container
  if (isLandingPage && !requireAuth) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'background.default' 
            : 'rgb(249, 250, 252)',
        }}
      >
        <TopBar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children || <Outlet />}
        </Box>
      </Box>
    );
  }
  
  // For all other pages, use the standard layout
  const content = (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' 
          ? 'background.default' 
          : 'rgb(249, 250, 252)',
      }}
    >
      <TopBar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: 3,
          ml: { md: `${desktopNavWidth}px` },
          width: { xs: '100%', md: `calc(100% - ${desktopNavWidth}px)` },
          px: { xs: 2, sm: 3 },
          // Add bottom padding on mobile to account for bottom navigation
          pb: isMobile ? 10 : 3,
          // Add transition for theme changes
          transition: theme.transitions.create(['background-color', 'box-shadow']),
          boxSizing: 'border-box',
        }}
      >
        <Box 
          sx={{
            width: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
            bgcolor: theme.palette.background.paper,
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
          }}
        >
          {children || <Outlet />}
        </Box>
      </Box>
      <SideNav />
    </Box>
  );

  // Return content directly if no auth is required
  if (!requireAuth) {
    return content;
  }

  // Wrap with AuthGuard, allowing guest access if specified
  return <AuthGuard allowGuest={allowGuest}>{content}</AuthGuard>;
}