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
  Snackbar
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
      navigate('/signin');
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Customize your experience and manage your account
        </Typography>
      </Box>
      
      {/* Appearance Settings */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Appearance
        </Typography>
        
        <Box sx={{ pl: 2 }}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Theme
            </Typography>
            <RadioGroup
              value={themePreference}
              onChange={handleThemeChange}
            >
              <FormControlLabel value="light" control={<Radio />} label="Light" />
              <FormControlLabel value="dark" control={<Radio />} label="Dark" />
              <FormControlLabel value="system" control={<Radio />} label="System (follow device settings)" />
            </RadioGroup>
          </FormControl>
        </Box>
      </Paper>
      
      {/* Notification Settings */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Notifications & Sound
        </Typography>
        
        <List disablePadding>
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Push Notifications" 
              secondary="Receive notifications for test reminders, new features, and results"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={notifications}
                onChange={handleNotificationsToggle}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem>
            <ListItemIcon>
              <SoundIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Sound Effects" 
              secondary="Play sounds for test completion, countdown timers, etc."
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={sounds}
                onChange={handleSoundsToggle}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
      
      {/* Privacy & Security Settings */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Privacy & Security
        </Typography>
        
        <List disablePadding>
          <ListItem button onClick={handleExportData}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Export My Data" 
              secondary="Download a copy of your personal data"
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem button onClick={() => navigate('/privacy')}>
            <ListItemIcon>
              <PrivacyIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Privacy Policy" 
              secondary="Review our privacy policy"
            />
          </ListItem>
          
          <Divider variant="inset" component="li" />
          
          <ListItem button onClick={() => navigate('/terms')}>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Terms of Service" 
              secondary="Review our terms of service"
            />
          </ListItem>
        </List>
      </Paper>
      
      {/* Account Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Account Actions
        </Typography>
        
        <Stack spacing={2}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
            fullWidth
          >
            Sign Out
          </Button>
          
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteAccountDialog(true)}
            fullWidth
          >
            Delete My Account
          </Button>
        </Stack>
        
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            Account email: {user?.email}
          </Alert>
        </Box>
      </Paper>
      
      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialog} onClose={() => setDeleteAccountDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" disabled={!password}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Container>
  );
}