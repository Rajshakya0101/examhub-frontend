import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import TopBar from './TopBar';
import SideNav from './SideNav';
import { AuthGuard } from '../../lib/authContext';

interface LayoutProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
}

export default function Layout({ children, requireAuth = true }: LayoutProps) {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';
  
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
      <Container 
        component="main" 
        maxWidth="lg"
        sx={{ 
          flexGrow: 1, 
          py: 3,
          px: { xs: 2, sm: 3 },
          // Add bottom padding on mobile to account for bottom navigation
          pb: isMobile ? 10 : 3,
          // Add transition for theme changes
          transition: theme.transitions.create(['background-color', 'box-shadow']),
        }}
      >
        <Box 
          sx={{
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
      </Container>
      <SideNav />
    </Box>
  );

  // Wrap with AuthGuard if authentication is required
  if (requireAuth) {
    return <AuthGuard allowAnonymous={false}>{content}</AuthGuard>;
  }

  return content;
}