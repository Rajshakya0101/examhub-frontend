import React, { useState } from 'react';
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
  LinearProgress
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
import { useAuthState } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';

// Mock user stats for UI development
const mockUserStats = {
  testsCompleted: 27,
  questionsAnswered: 1432,
  accuracy: 78,
  averageScore: 82,
  streak: 7,
  totalTimeSpent: '37h 45m',
  rank: 153,
  totalUsers: 2500,
  percentile: 94,
  achievementsCount: 12,
  totalAchievements: 30,
};

// Mock achievement data
const mockAchievements = [
  { id: 1, name: '100 Questions', description: 'Answer 100 questions', earned: true, date: '2023-10-15', icon: '🎯' },
  { id: 2, name: 'Perfect Score', description: 'Get 100% on any test', earned: true, date: '2023-10-20', icon: '🏆' },
  { id: 3, name: '7 Day Streak', description: 'Practice for 7 days in a row', earned: true, date: '2023-10-25', icon: '🔥' },
  { id: 4, name: 'Speed Demon', description: 'Complete a test in record time', earned: false, progress: 60, icon: '⚡' },
  { id: 5, name: 'Knowledge Master', description: 'Answer 1000 questions', earned: true, date: '2023-11-01', icon: '🧠' },
  { id: 6, name: 'Test Champion', description: 'Complete 20 mock tests', earned: true, date: '2023-11-05', icon: '🏅' },
  { id: 7, name: 'Early Bird', description: 'Complete 5 tests before 8 AM', earned: false, progress: 40, icon: '🐦' },
  { id: 8, name: 'Night Owl', description: 'Complete 5 tests after 10 PM', earned: false, progress: 20, icon: '🦉' },
];

// Mock test history
const mockTestHistory = [
  { id: 'test1', name: 'SSC CGL Mock Test 1', date: '2023-11-10', score: 87, duration: '1h 30m' },
  { id: 'test2', name: 'Bank PO Sectional: Reasoning', date: '2023-11-08', score: 92, duration: '45m' },
  { id: 'test3', name: 'Daily Quiz', date: '2023-11-05', score: 70, duration: '10m' },
  { id: 'test4', name: 'SSC CHSL Full Mock', date: '2023-11-01', score: 78, duration: '1h 15m' },
  { id: 'test5', name: 'Quant Sectional Test', date: '2023-10-28', score: 65, duration: '30m' },
];

export default function Profile() {
  const user = useAuthState();
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: 'Aspiring Bank PO candidate preparing for SBI and IBPS exams. Currently focused on improving quantitative aptitude.',
    phone: '9876543210',
    location: 'Mumbai, India',
    education: 'B.Com, Mumbai University',
  });
  const [error, setError] = useState('');
  
  // Query for user stats (using mock data for now)
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user?.uid],
    queryFn: async () => {
      // In real app, this would fetch from Firebase
      return mockUserStats;
    },
    initialData: mockUserStats,
  });

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    // Reset form to original values
    setEditedProfile({
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: 'Aspiring Bank PO candidate preparing for SBI and IBPS exams. Currently focused on improving quantitative aptitude.',
      phone: '9876543210',
      location: 'Mumbai, India',
      education: 'B.Com, Mumbai University',
    });
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

      // Mock update for display purposes
      // In a real app, this would call a function to update Firebase Auth profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real app, you'd also update the user's Firestore document with additional fields
      // await updateDoc(doc(db, 'users', user.uid), {
      //   bio: editedProfile.bio,
      //   phone: editedProfile.phone,
      //   location: editedProfile.location,
      //   education: editedProfile.education,
      // });
      
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
      
      <Grid container spacing={4}>
        {/* Left column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            {/* Profile Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  editing ? (
                    <Avatar sx={{ width: 22, height: 22, bgcolor: 'primary.main' }}>
                      <EditIcon sx={{ fontSize: 12 }} />
                    </Avatar>
                  ) : null
                }
              >
                <Avatar 
                  src={user?.photoURL || undefined} 
                  alt={editedProfile.displayName}
                  sx={{ width: 100, height: 100, mb: 2 }}
                >
                  {editedProfile.displayName?.charAt(0) || '?'}
                </Avatar>
              </Badge>
              
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
              
              {!editing && (
                <Chip 
                  label={`Rank #${userStats.rank}`}
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
                    >
                      Cancel
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      Save
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
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${userStats.testsCompleted} Tests Completed`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AchievementIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${userStats.achievementsCount}/${userStats.totalAchievements} Achievements`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StatsIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${userStats.percentile}th Percentile`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`${userStats.totalTimeSpent} Total Practice Time`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Right column - Stats, History, Achievements */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
            >
              <Tab label="Statistics" />
              <Tab label="Test History" />
              <Tab label="Achievements" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {/* Statistics Tab */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Average Score
                        </Typography>
                        <Typography variant="h5" component="div">
                          {userStats.averageScore}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Accuracy
                        </Typography>
                        <Typography variant="h5" component="div">
                          {userStats.accuracy}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Questions Answered
                        </Typography>
                        <Typography variant="h5" component="div">
                          {userStats.questionsAnswered}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Current Streak
                        </Typography>
                        <Typography variant="h5" component="div">
                          {userStats.streak} days 🔥
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Tests Completed
                        </Typography>
                        <Typography variant="h5" component="div">
                          {userStats.testsCompleted}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Rank
                        </Typography>
                        <Typography variant="h5" component="div">
                          #{userStats.rank} / {userStats.totalUsers}
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
              )}
              
              {/* Test History Tab */}
              {activeTab === 1 && (
                <Box>
                  <List>
                    {mockTestHistory.map((test, index) => (
                      <React.Fragment key={test.id}>
                        <ListItem 
                          button 
                          onClick={() => {/* Navigate to test details */}}
                          sx={{ py: 2 }}
                        >
                          <ListItemText
                            primary={test.name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  Score: {test.score}%
                                </Typography>
                                {` — Completed on ${test.date} • Duration: ${test.duration}`}
                              </>
                            }
                          />
                          <Chip 
                            label={`${test.score}%`}
                            color={
                              test.score >= 90 ? 'success' : 
                              test.score >= 75 ? 'primary' : 
                              test.score >= 60 ? 'warning' : 'error'
                            }
                          />
                        </ListItem>
                        {index < mockTestHistory.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                  
                  <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                    View All Test History
                  </Button>
                </Box>
              )}
              
              {/* Achievements Tab */}
              {activeTab === 2 && (
                <Grid container spacing={2}>
                  {mockAchievements.map(achievement => (
                    <Grid item xs={12} sm={6} key={achievement.id}>
                      <Card 
                        variant={achievement.earned ? 'outlined' : 'elevation'}
                        sx={{ 
                          height: '100%',
                          opacity: achievement.earned ? 1 : 0.7,
                          position: 'relative',
                        }}
                      >
                        {achievement.earned && (
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
                        )}
                        
                        <CardHeader
                          avatar={
                            <Avatar 
                              sx={{ 
                                bgcolor: achievement.earned ? 'primary.main' : 'grey.500',
                                width: 48,
                                height: 48,
                                fontSize: '1.5rem',
                              }}
                            >
                              {achievement.icon}
                            </Avatar>
                          }
                          title={achievement.name}
                          subheader={
                            achievement.earned ? 
                              `Earned on ${achievement.date}` : 
                              `Progress: ${achievement.progress}%`
                          }
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            {achievement.description}
                          </Typography>
                          
                          {!achievement.earned && achievement.progress && (
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress variant="determinate" value={achievement.progress} />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}