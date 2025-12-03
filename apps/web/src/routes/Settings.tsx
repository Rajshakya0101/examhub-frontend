import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  VolumeUp as SoundIcon,
  PrivacyTip as PrivacyIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useThemeStore } from '@/lib/store';
import { useAuthState, signOut } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthState();
  const theme = useTheme();
  const { themePreference, setThemePreference } = useThemeStore();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Handle theme change
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThemePreference(e.target.value as 'light' | 'dark' | 'system');
    setSnackbar({
      open: true,
      message: 'Theme preference updated',
      severity: 'success'
    });
  };

  // Handle notification toggle
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    setSnackbar({
      open: true,
      message: !notifications ? 'Notifications enabled' : 'Notifications disabled',
      severity: 'success'
    });
  };

  // Handle sound toggle
  const handleSoundsToggle = () => {
    setSounds(!sounds);
    setSnackbar({
      open: true,
      message: !sounds ? 'Sounds enabled' : 'Sounds disabled',
      severity: 'success'
    });
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setSnackbar({
        open: true,
        message: 'Error signing out. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would verify the password and delete the account
      // await deleteUserAccount(password);
      
      setSnackbar({
        open: true,
        message: 'Account deleted successfully',
        severity: 'success'
      });
      
      setDeleteAccountDialog(false);
      navigate('/signin');
    } catch (error) {
      console.error('Error deleting account:', error);
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // Handle data export
  const handleExportData = async () => {
    try {
      // In a real app, this would call an API to export user data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSnackbar({
        open: true,
        message: 'Data exported successfully. Check your email.',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting data. Please try again.',
        severity: 'error'
      });
    }
  };

  return (
    <Container>
      <Box 
        sx={{ 
          mb: 4,
          background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 800,
          background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Customize your experience and manage your account
        </Typography>
      </Box>
      
      {/* Appearance Settings */}
      <Paper 
        elevation={2}
        sx={{ 
          mb: 4, 
          p: 3,
          borderRadius: '16px',
          background: theme => theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1))'
            : 'linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,1))',
          backdropFilter: 'blur(8px)',
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ 
          mb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&::before': {
            content: '""',
            width: 4,
            height: 20,
            bgcolor: 'primary.main',
            borderRadius: 1,
            display: 'inline-block',
          }
        }}>
          Appearance
        </Typography>
        
        <Box sx={{ pl: 2 }}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', ml: 1 }}>
              Theme
            </Typography>
            <RadioGroup
              value={themePreference}
              onChange={handleThemeChange}
            >
              {[
                { value: 'light', label: 'Light', icon: '☀️' },
                { value: 'dark', label: 'Dark', icon: '🌙' },
                { value: 'system', label: 'System (follow device settings)', icon: '⚙️' }
              ].map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={
                    <Radio 
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main',
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{option.icon}</span>
                      <Typography>{option.label}</Typography>
                    </Box>
                  }
                  sx={{
                    m: 0.5,
                    p: 1,
                    borderRadius: 1,
                    width: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      </Paper>
      
      {/* Notification Settings */}
      <Paper 
        elevation={2}
        sx={{ 
          mb: 4, 
          p: 3,
          borderRadius: '16px',
          background: theme => theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1))'
            : 'linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,1))',
          backdropFilter: 'blur(8px)',
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ 
          mb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&::before': {
            content: '""',
            width: 4,
            height: 20,
            bgcolor: 'primary.main',
            borderRadius: 1,
            display: 'inline-block',
          }
        }}>
          Notifications & Sound
        </Typography>
        
        <List disablePadding>
          <ListItem
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
              },
              mb: 1,
            }}
          >
            <ListItemIcon>
              <NotificationsIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Push Notifications
                </Typography>
              }
              secondary="Receive notifications for test reminders, new features, and results"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={notifications}
                onChange={handleNotificationsToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'primary.main',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'primary.main',
                  },
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <ListItemIcon>
              <SoundIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Sound Effects
                </Typography>
              }
              secondary="Play sounds for test completion, countdown timers, etc."
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={sounds}
                onChange={handleSoundsToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'primary.main',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'primary.main',
                  },
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
      
      {/* Privacy & Security Settings */}
      <Paper 
        elevation={2}
        sx={{ 
          mb: 4, 
          p: 3,
          borderRadius: '16px',
          background: theme => theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1))'
            : 'linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,1))',
          backdropFilter: 'blur(8px)',
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ 
          mb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&::before': {
            content: '""',
            width: 4,
            height: 20,
            bgcolor: 'primary.main',
            borderRadius: 1,
            display: 'inline-block',
          }
        }}>
          Privacy & Security
        </Typography>
        
        <List disablePadding>
          <ListItem 
            button 
            onClick={handleExportData}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                transform: 'translateX(4px)',
              },
              mb: 1,
            }}
          >
            <ListItemIcon>
              <DownloadIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Export My Data
                </Typography>
              }
              secondary="Download a copy of your personal data"
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem 
            button 
            onClick={() => navigate('/privacy')}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                transform: 'translateX(4px)',
              },
              mb: 1,
            }}
          >
            <ListItemIcon>
              <PrivacyIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Privacy Policy
                </Typography>
              }
              secondary="Review our privacy policy"
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem 
            button 
            onClick={() => navigate('/terms')}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Terms of Service
                </Typography>
              }
              secondary="Review our terms of service"
            />
          </ListItem>
        </List>
      </Paper>
      
      {/* Account Actions */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 3,
          borderRadius: '16px',
          background: theme => theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1))'
            : 'linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,1))',
          backdropFilter: 'blur(8px)',
          border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ 
          mb: 2,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: theme => theme.palette.error.main,
          '&::before': {
            content: '""',
            width: 4,
            height: 20,
            bgcolor: 'error.main',
            borderRadius: 1,
            display: 'inline-block',
          }
        }}>
          Account Actions
        </Typography>
        
        <Stack spacing={2}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
            fullWidth
            sx={{
              borderWidth: 2,
              py: 1.5,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: theme => theme.shadows[4],
              }
            }}
          >
            Sign Out
          </Button>
          
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteAccountDialog(true)}
            fullWidth
            sx={{
              borderWidth: 2,
              py: 1.5,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: theme => theme.shadows[4],
              }
            }}
          >
            Delete My Account
          </Button>
        </Stack>
        
        <Box sx={{ mt: 3 }}>
          <Alert 
            severity="info"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                color: 'primary.main',
              }
            }}
          >
            <Typography variant="subtitle2">
              Account email: <Box component="span" sx={{ fontWeight: 600 }}>{user?.email}</Box>
            </Typography>
          </Alert>
        </Box>
      </Paper>
      
      {/* Delete Account Dialog */}
      <Dialog 
        open={deleteAccountDialog} 
        onClose={() => setDeleteAccountDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundImage: 'none',
            background: theme => theme.palette.mode === 'light'
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,1))'
              : 'linear-gradient(to bottom, rgba(30,30,30,0.95), rgba(30,30,30,1))',
            backdropFilter: 'blur(8px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          '& .MuiTypography-root': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'error.main',
            fontWeight: 600,
          }
        }}>
          <DeleteIcon color="error" />
          Delete Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ 
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: theme => alpha(theme.palette.error.main, 0.1),
            color: 'error.main',
            border: '1px solid',
            borderColor: 'error.main',
          }}>
            Warning: This action cannot be undone. All your data, including test history and achievements, will be permanently deleted.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Confirm with your password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'error.main',
                    borderWidth: 2,
                  },
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteAccountDialog(false)} 
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            disabled={!password}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:not(:disabled)': {
                background: theme => `linear-gradient(45deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
                boxShadow: theme => theme.shadows[2],
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme => theme.shadows[4],
                },
              },
            }}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
            backgroundImage: 'none',
            background: theme => theme.palette.mode === 'light'
              ? 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.98))'
              : 'linear-gradient(to right, rgba(30,30,30,0.95), rgba(30,30,30,0.98))',
            backdropFilter: 'blur(8px)',
            border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: theme => theme.shadows[3],
          }
        }}
      >
        <Alert
          severity={snackbar.severity as 'success' | 'error'}
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}