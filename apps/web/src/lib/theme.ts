import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode, alpha } from '@mui/material';

// Create MUI theme with shared tokens
export const createAppTheme = (mode: PaletteMode) => {
  // Define colors for light and dark mode
  const primaryColor = mode === 'light' ? '#2563eb' : '#60a5fa';
  const secondaryColor = mode === 'light' ? '#7c3aed' : '#a78bfa';
  const successColor = '#10b981';
  const errorColor = '#ef4444';
  const warningColor = '#f59e0b';
  const infoColor = '#3b82f6';
  
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: primaryColor,
        light: mode === 'light' ? '#60a5fa' : '#93c5fd',
        dark: mode === 'light' ? '#1d4ed8' : '#3b82f6',
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: mode === 'light' ? '#a78bfa' : '#c4b5fd',
        dark: mode === 'light' ? '#6d28d9' : '#8b5cf6',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f9fafc' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      success: {
        main: successColor,
        light: mode === 'light' ? '#34d399' : '#6ee7b7',
        dark: mode === 'light' ? '#059669' : '#10b981',
        contrastText: '#ffffff',
      },
      error: {
        main: errorColor,
        light: mode === 'light' ? '#f87171' : '#fca5a5',
        dark: mode === 'light' ? '#dc2626' : '#ef4444',
        contrastText: '#ffffff',
      },
      warning: {
        main: warningColor,
        light: mode === 'light' ? '#fbbf24' : '#fcd34d',
        dark: mode === 'light' ? '#d97706' : '#f59e0b',
        contrastText: mode === 'light' ? '#000000' : '#ffffff',
      },
      info: {
        main: infoColor,
        light: mode === 'light' ? '#60a5fa' : '#93c5fd',
        dark: mode === 'light' ? '#2563eb' : '#3b82f6',
        contrastText: '#ffffff',
      },
      text: {
        primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.95)',
        secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
        disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.5)',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      action: {
        active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
        hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
        selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
        disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
        disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: [
      'none',
      '0px 2px 4px rgba(0, 0, 0, 0.05)',
      '0px 4px 6px rgba(0, 0, 0, 0.07)',
      '0px 6px 8px rgba(0, 0, 0, 0.08)',
      '0px 8px 12px rgba(0, 0, 0, 0.1)',
      '0px 10px 14px rgba(0, 0, 0, 0.12)',
      '0px 12px 16px rgba(0, 0, 0, 0.14)',
      '0px 14px 18px rgba(0, 0, 0, 0.16)',
      '0px 16px 24px rgba(0, 0, 0, 0.18)',
      '0px 18px 28px rgba(0, 0, 0, 0.2)',
      '0px 20px 32px rgba(0, 0, 0, 0.22)',
      '0px 22px 36px rgba(0, 0, 0, 0.24)',
      '0px 24px 40px rgba(0, 0, 0, 0.26)',
      '0px 26px 44px rgba(0, 0, 0, 0.28)',
      '0px 28px 48px rgba(0, 0, 0, 0.3)',
      '0px 30px 52px rgba(0, 0, 0, 0.32)',
      '0px 32px 56px rgba(0, 0, 0, 0.34)',
      '0px 34px 60px rgba(0, 0, 0, 0.36)',
      '0px 36px 64px rgba(0, 0, 0, 0.38)',
      '0px 38px 68px rgba(0, 0, 0, 0.4)',
      '0px 40px 72px rgba(0, 0, 0, 0.42)',
      '0px 42px 76px rgba(0, 0, 0, 0.44)',
      '0px 44px 80px rgba(0, 0, 0, 0.46)',
      '0px 46px 84px rgba(0, 0, 0, 0.48)',
      '0px 48px 88px rgba(0, 0, 0, 0.5)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            minHeight: '100vh',
            transition: 'background-color 0.3s ease',
          },
          '*:focus-visible': {
            outline: `2px solid ${primaryColor}`,
            outlineOffset: '2px',
          },
          ':root': {
            '--toastify-color-light': mode === 'light' ? '#fff' : '#1e1e1e',
            '--toastify-color-dark': mode === 'light' ? '#1e1e1e' : '#121212',
            '--toastify-color-info': infoColor,
            '--toastify-color-success': successColor,
            '--toastify-color-warning': warningColor,
            '--toastify-color-error': errorColor,
            '--toastify-text-color-light': mode === 'light' ? '#757575' : '#e0e0e0',
            '--toastify-text-color-dark': mode === 'light' ? '#e0e0e0' : '#757575',
          },
          a: {
            color: primaryColor,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
              : '0 1px 2px rgba(0, 0, 0, 0.5)',
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            },
          },
          contained: {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            },
          },
          outlined: {
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: mode === 'light'
              ? '0px 4px 20px rgba(0, 0, 0, 0.08)'
              : '0px 4px 20px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '24px',
            '&:last-child': {
              paddingBottom: '24px',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease-in-out',
            '&.Mui-focused': {
              boxShadow: `0 0 0 2px ${alpha(primaryColor, 0.25)}`,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.3)' 
                : 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: primaryColor,
              borderWidth: '2px',
            },
          },
          notchedOutline: {
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${
              mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'
            }`,
          },
          head: {
            fontWeight: 600,
            backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: '12px',
            boxShadow: mode === 'light' 
              ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
              : '0 4px 20px rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(primaryColor, 0.12),
              '&:hover': {
                backgroundColor: alpha(primaryColor, 0.2),
              },
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' 
              ? 'rgba(255, 255, 255, 0.9)' 
              : 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            padding: '12px 0 8px',
            '&.Mui-selected': {
              '& .MuiBottomNavigationAction-label': {
                fontWeight: 600,
              },
            },
          },
          label: {
            fontSize: '0.75rem',
            marginTop: '4px',
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: `2px solid ${mode === 'light' ? '#fff' : '#2a2a2a'}`,
            boxShadow: mode === 'light' 
              ? '0 2px 4px rgba(0,0,0,0.1)' 
              : '0 2px 4px rgba(0,0,0,0.3)',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Export theme types for type safety
export type AppTheme = ReturnType<typeof createAppTheme>;