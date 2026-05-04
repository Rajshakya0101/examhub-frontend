import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Avatar,
  Button,
  TextField,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon,
  Cancel as CancelIcon,
  School as SchoolIcon,
  EmojiEvents as AchievementIcon,
  BarChart as StatsIcon,
  History as HistoryIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth, useAuthState } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useUserStatsSummary } from '@/hooks/useUserStats';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserRank } from '@/hooks/useLeaderboard';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import type { Attempt } from '@/lib/models';

// Create extended attempt type for profile display
interface TestAttempt extends Attempt {
  examTitle: string;
  timeSpentSec: number;
}

export default function Profile() {
  const user = useAuthState();
  const { updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);
  const [profileSnapshot, setProfileSnapshot] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    phone: '',
    location: '',
    education: '',
  });
  const [editedProfile, setEditedProfile] = useState(profileSnapshot);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const theme = useTheme();
  
  // Fetch real user data
  const { summary, isLoading: statsLoading } = useUserStatsSummary();
  const { achievements, totalPoints, isLoading: achievementsLoading } = useAchievements();
  const { rank, totalUsers, isLoading: rankLoading } = useUserRank('global');
  
  // Fetch recent test attempts
  const { data: recentAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['recent-attempts', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const attemptsRef = collection(db, 'attempts');
      const q = query(
        attemptsRef,
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('submittedAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestAttempt[];
    },
    enabled: !!user?.uid,
  });
  
  // Calculate percentile
  const percentile = rank && totalUsers ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0;
  
  const isLoading = statsLoading || achievementsLoading || rankLoading || attemptsLoading;

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);

      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        const data = snapshot.exists() ? snapshot.data() : {};

        const nextProfile = {
          displayName: (data.displayName as string | undefined) || user.displayName || '',
          email: (data.email as string | undefined) || user.email || '',
          bio: (data.bio as string | undefined) || '',
          phone: (data.phone as string | undefined) || '',
          location: (data.location as string | undefined) || '',
          education: (data.education as string | undefined) || '',
        };

        setProfileSnapshot(nextProfile);
        setEditedProfile(nextProfile);

        const incomplete = !snapshot.exists()
          || !nextProfile.bio.trim()
          || !nextProfile.phone.trim()
          || !nextProfile.location.trim()
          || !nextProfile.education.trim();

        setProfileNeedsCompletion(incomplete);

        if (incomplete) {
          setEditing(true);
          setError('Please complete your profile details.');
        }
      } catch (loadError) {
        console.error('Error loading profile:', loadError);
        setError('Unable to load profile details.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.uid, user?.displayName, user?.email]);

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedProfile(profileSnapshot);
    setError('');
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSaving(true);

      // Validate displayName
      if (!editedProfile.displayName.trim()) {
        setError('Name cannot be empty');
        setSaving(false);
        return;
      }

      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      await updateUserProfile({ displayName: editedProfile.displayName });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: editedProfile.displayName,
        email: editedProfile.email,
        bio: editedProfile.bio,
        phone: editedProfile.phone,
        location: editedProfile.location,
        education: editedProfile.education,
        profileComplete: true,
        updatedAt: new Date(),
      }, { merge: true });

      const savedProfile = { ...editedProfile };
      setProfileSnapshot(savedProfile);
      setProfileNeedsCompletion(false);
      
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          My Profile
        </Typography>
      </Box>

      {profileNeedsCompletion && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your profile is incomplete. Please update your personal details so we can personalize your dashboard.
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {/* Left column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper 
        elevation={3}
        sx={{ 
          p: 3, 
          mb: 4,
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1))'
            : 'linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,1))',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: '16px',
        }}
      >
            {/* Profile Header */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mb: 3,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -24,
                left: -24,
                right: -24,
                height: 270,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                borderRadius: '30px 30px 100% 100%',
                zIndex: 0,
              }
            }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  (
                    <Avatar sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: 'primary.main',
                      boxShadow: theme.shadows[3],
                      border: `2px solid ${theme.palette.background.paper}`,
                      cursor: 'pointer',
                    }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !user?.uid) return;
                            setAvatarError('');
                            // basic validation: max 3MB
                            if (file.size > 3 * 1024 * 1024) {
                              setAvatarError('Image too large (max 3MB)');
                              return;
                            }
                            try {
                              setUploadingAvatar(true);
                              const ext = file.name.split('.').pop();
                              const avatarPath = `users/${user.uid}/avatar_${Date.now()}.${ext}`;
                              const sRef = storageRef(storage, avatarPath);
                              await uploadBytes(sRef, file);
                              const url = await getDownloadURL(sRef);
                              await updateUserProfile({ photoURL: url });
                            } catch (err) {
                              console.error('Avatar upload failed', err);
                              setAvatarError('Failed to upload avatar. Try again.');
                            } finally {
                              setUploadingAvatar(false);
                              // clear input so same file can be reselected
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }
                          }}
                        />
                        <EditIcon sx={{ fontSize: 16 }} />
                      </label>
                    </Avatar>
                  )
                }
              >
                <Avatar 
                  src={user?.photoURL || undefined} 
                  alt={editedProfile.displayName}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2,
                    boxShadow: theme.shadows[5],
                    border: `4px solid ${theme.palette.background.paper}`,
                    backgroundColor: theme.palette.primary.main,
                    fontSize: '3rem',
                    zIndex: 1,
                  }}
                >
                  {editedProfile.displayName?.charAt(0) || '?'}
                </Avatar>
              </Badge>
              {avatarError && (
                <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                  {avatarError}
                </Typography>
              )}
              {uploadingAvatar && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
              
              {editing ? (
                <TextField
                  name="displayName"
                  label="Name"
                  value={editedProfile.displayName}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!error && !editedProfile.displayName.trim()}
                  helperText={error && !editedProfile.displayName.trim() ? error : ''}
                  required
                />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {editedProfile.displayName}
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {editedProfile.email}
              </Typography>
              
              {!editing && rank && (
                <Chip 
                  label={`Rank #${rank}`}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Profile Details */}
            {error && !error.includes('Name') && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loadingProfile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Loading your profile details...
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Bio
              </Typography>
              {editing ? (
                <TextField
                  name="bio"
                  value={editedProfile.bio}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  variant="outlined"
                />
              ) : (
                <Typography variant="body2" paragraph>
                  {editedProfile.bio}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Contact & Personal Info
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {editing ? (
                    <TextField
                      name="phone"
                      label="Phone"
                      value={editedProfile.phone}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {editedProfile.phone}
                      </Typography>
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  {editing ? (
                    <TextField
                      name="location"
                      label="Location"
                      value={editedProfile.location}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {editedProfile.location}
                      </Typography>
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  {editing ? (
                    <TextField
                      name="education"
                      label="Education"
                      value={editedProfile.education}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Education
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {editedProfile.education}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
            
            {/* Edit/Save Profile Buttons */}
            <Box sx={{ mt: 3 }}>
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      fullWidth
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                      sx={{
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      startIcon={saving ? (
                        <CircularProgress size={20} thickness={4} sx={{ color: 'inherit' }} />
                      ) : (
                        <SaveIcon />
                      )}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      sx={{
                        fontWeight: 600,
                        boxShadow: theme.shadows[2],
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  startIcon={<EditIcon />}
                  onClick={handleEditProfile}
                  sx={{
                    borderWidth: 2,
                    fontWeight: 600,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[3],
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Paper>
          
          {/* Quick Stats Card */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${summary?.testsCompleted || 0} Tests Completed`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AchievementIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${achievements.length} Achievements • ${totalPoints} XP`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StatsIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${percentile}th Percentile`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={summary?.timeSpent || '0m'}
                  secondary="Total Practice Time"
                />
              </ListItem>
            </List>
            )}
          </Paper>
        </Grid>

        {/* Right column - Stats, History, Achievements */}
        <Grid item xs={12} md={8}>
            <Paper 
              elevation={2}
              sx={{ 
                mb: 3,
                borderRadius: '16px',
                overflow: 'hidden',
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1))'
                  : 'linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,1))',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 56,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            >
              <Tab label="Statistics" />
              <Tab label="Test History" />
              <Tab label="Achievements" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {/* Statistics Tab */}
              {activeTab === 0 && (
                isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={60} />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Average Score
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                            mt: 1
                          }}
                        >
                          {summary?.recentScore || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Accuracy
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.secondary.main,
                            mt: 1
                          }}
                        >
                          {summary?.accuracy || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Questions Answered
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.success.main,
                            mt: 1
                          }}
                        >
                          {summary?.questionsAnswered || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Current Streak
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.warning.main,
                            mt: 1
                          }}
                        >
                          {summary?.streak || 0} 🔥
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Test Type Performance Breakdown */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2, fontWeight: 600 }}>
                      Performance by Test Type
                    </Typography>
                  </Grid>

                  {/* Full Mock Performance */}
                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.15)}, ${alpha(theme.palette.info.main, 0.05)})`,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 1.5 }}>
                            <SchoolIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Full Mock
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.info.main,
                            mb: 1
                          }}
                        >
                          {summary?.fullMockScore || 0}/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Latest Performance
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Accuracy: {summary?.fullMockAccuracy || 0}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tests: {summary?.fullMockTests || 0}
                          </Typography>
                        </Box>
                        {(summary?.fullMockScore || 0) >= 75 && (
                          <Chip 
                            label="Top 10% 🏆" 
                            size="small" 
                            sx={{ 
                              mt: 1, 
                              bgcolor: alpha(theme.palette.success.main, 0.2),
                              color: theme.palette.success.main,
                              fontWeight: 600
                            }} 
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Sectional Mock Performance */}
                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)}, ${alpha(theme.palette.success.main, 0.05)})`,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 1.5 }}>
                            <StatsIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Sectional
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.success.main,
                            mb: 1
                          }}
                        >
                          {summary?.sectionalScore || 0}/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Latest Performance
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Accuracy: {summary?.sectionalAccuracy || 0}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tests: {summary?.sectionalTests || 0}
                          </Typography>
                        </Box>
                        {(summary?.sectionalScore || 0) >= 75 && (
                          <Chip 
                            label="Excellent! ⭐" 
                            size="small" 
                            sx={{ 
                              mt: 1, 
                              bgcolor: alpha(theme.palette.success.main, 0.2),
                              color: theme.palette.success.main,
                              fontWeight: 600
                            }} 
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Topic-wise Performance */}
                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 1.5 }}>
                            <AchievementIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Topic-wise
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.warning.main,
                            mb: 1
                          }}
                        >
                          {summary?.topicWiseScore || 0}/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Latest Performance
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Accuracy: {summary?.topicWiseAccuracy || 0}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tests: {summary?.topicWiseTests || 0}
                          </Typography>
                        </Box>
                        {(summary?.topicWiseScore || 0) >= 75 && (
                          <Chip 
                            label="Keep it up! 💪" 
                            size="small" 
                            sx={{ 
                              mt: 1, 
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                              color: theme.palette.warning.main,
                              fontWeight: 600
                            }} 
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Current Streak
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.warning.main,
                            mt: 1
                          }}
                        >
                          {summary?.streak || 0} 🔥
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Tests Completed
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.info.main,
                            mt: 1
                          }}
                        >
                          {summary?.testsCompleted || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        background: theme.palette.mode === 'light'
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                          : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ height: '100%', p: 3 }}>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Rank
                        </Typography>
                        <Typography 
                          variant="h4" 
                          component="div" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.error.main,
                            mt: 1
                          }}
                        >
                          #{rank || '-'} / {totalUsers || '-'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Charts would go here in a real implementation */}
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Detailed performance charts and analytics will be displayed here.
                    </Alert>
                  </Grid>
                </Grid>
                )
              )}
              
              {/* Test History Tab */}
              {activeTab === 1 && (
                isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={60} />
                  </Box>
                ) : (
                  <Box>
                  {!recentAttempts || recentAttempts.length === 0 ? (
                    <Alert severity="info">
                      No test history yet. Start taking tests to see your progress here!
                    </Alert>
                  ) : (
                    <>
                      <List>
                        {recentAttempts.map((attempt, index) => {
                          const percentage = Math.round(attempt.score?.percentage || 0);
                          return (
                          <React.Fragment key={attempt.id}>
                            <ListItem 
                              sx={{ py: 2 }}
                            >
                              <ListItemText
                                primary={attempt.examTitle}
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" color="text.primary">
                                      Score: {percentage}%
                                    </Typography>
                                    {` — Completed on ${attempt.submittedAt?.toDate().toLocaleDateString() || 'N/A'} • Duration: ${Math.floor(attempt.timeSpentSec / 60)}m ${attempt.timeSpentSec % 60}s`}
                                  </>
                                }
                              />
                              <Chip 
                                label={`${percentage}%`}
                                color={
                                  percentage >= 90 ? 'success' : 
                                  percentage >= 75 ? 'primary' : 
                                  percentage >= 60 ? 'warning' : 'error'
                                }
                              />
                            </ListItem>
                            {index < recentAttempts.length - 1 && <Divider />}
                          </React.Fragment>
                          );
                        })}
                      </List>
                  
                      {recentAttempts && recentAttempts.length > 0 && (
                        <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                          View All Test History
                        </Button>
                      )}
                    </>
                  )}
                </Box>
                )
              )}
              
              {/* Achievements Tab */}
              {activeTab === 2 && (
                isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={60} />
                  </Box>
                ) : (
                  <Box>
                  {!achievements || achievements.length === 0 ? (
                    <Alert severity="info">
                      No achievements yet. Keep testing to unlock achievements!
                    </Alert>
                  ) : (
                  <>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Unlocked Achievements
                      </Typography>
                      <Chip 
                        label={`${achievements.length} Earned • ${totalPoints} XP`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                <Grid container spacing={2}>
                  {achievements.map(achievement => (
                    <Grid item xs={12} sm={6} key={achievement.id}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          height: '100%',
                          position: 'relative',
                          background: theme.palette.mode === 'light'
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'
                            : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(30,30,30,0.85))',
                          backdropFilter: 'blur(8px)',
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8],
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1,
                          }}
                        >
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                        </Box>
                        
                        <CardHeader
                          avatar={
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.5rem',
                              }}
                            >
                              {achievement.icon}
                            </Avatar>
                          }
                          title={
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {achievement.name}
                              </Typography>
                              <Chip 
                                label={`${achievement.points} XP`}
                                size="small"
                                color="warning"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                          subheader={
                            achievement.earnedAt ? 
                              `Earned on ${achievement.earnedAt.toDate().toLocaleDateString()}` : 
                              'Recently unlocked'
                          }
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            {achievement.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {achievement.category.toUpperCase()} • {achievement.level.toUpperCase()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                  </>
                  )}
                </Box>
                )
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}