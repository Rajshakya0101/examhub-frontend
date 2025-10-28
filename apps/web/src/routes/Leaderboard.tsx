import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Button,
  Pagination,
  LinearProgress,
  SelectChangeEvent,
  alpha,
  Grid,
  Card,
  CardContent,
  useTheme,
  Tooltip,
  IconButton,
  Divider,
  styled,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthState } from '@/lib/auth';
import { useLeaderboard } from '@/lib/functions';
import type { LeaderboardEntry } from '@/lib/models';
import {
  EmojiEvents as EmojiEventsIcon,
  Whatshot as WhatshotIcon,
  Insights as InsightsIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Check as CheckIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';

// Extended LeaderboardEntry with isCurrentUser flag for UI
interface ExtendedLeaderboardEntry extends LeaderboardEntry {
  isCurrentUser: boolean;
  // For simplicity in UI rendering
  badge: string;
  name: string;
}

// Mock data for leaderboard entries - will be replaced with actual data from backend
const mockLeaderboard: ExtendedLeaderboardEntry[] = [
  {
    id: 'user1',
    rank: 1,
    name: 'Rahul Sharma',
    displayName: 'Rahul Sharma',
    photoURL: '',
    score: 985,
    testsCompleted: 42,
    accuracy: 92,
    streak: 15,
    badge: 'Gold',
    badges: [{ id: 'gold1', name: 'Gold Expert', level: 'gold' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user2',
    rank: 2,
    name: 'Priya Patel',
    displayName: 'Priya Patel',
    photoURL: '',
    score: 954,
    testsCompleted: 38,
    accuracy: 89,
    streak: 10,
    badge: 'Gold',
    badges: [{ id: 'gold2', name: 'Gold Expert', level: 'gold' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user3',
    rank: 3,
    name: 'Amit Kumar',
    displayName: 'Amit Kumar',
    photoURL: '',
    score: 932,
    testsCompleted: 36,
    accuracy: 91,
    streak: 8,
    badge: 'Gold',
    badges: [{ id: 'gold3', name: 'Gold Expert', level: 'gold' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user4',
    rank: 4,
    name: 'Neha Singh',
    displayName: 'Neha Singh',
    photoURL: '',
    score: 901,
    testsCompleted: 35,
    accuracy: 88,
    streak: 7,
    badge: 'Silver',
    badges: [{ id: 'silver1', name: 'Silver Expert', level: 'silver' }],
    isCurrentUser: true,  // Current user example
    lastActive: new Date() as any,
  },
  {
    id: 'user5',
    rank: 5,
    name: 'Vikram Mehra',
    displayName: 'Vikram Mehra',
    photoURL: '',
    score: 880,
    testsCompleted: 33,
    accuracy: 85,
    streak: 5,
    badge: 'Silver',
    badges: [{ id: 'silver2', name: 'Silver Expert', level: 'silver' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user6',
    rank: 6,
    name: 'Aarti Gupta',
    displayName: 'Aarti Gupta',
    photoURL: '',
    score: 865,
    testsCompleted: 30,
    accuracy: 87,
    streak: 4,
    badge: 'Silver',
    badges: [{ id: 'silver3', name: 'Silver Expert', level: 'silver' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user7',
    rank: 7,
    name: 'Rohit Verma',
    displayName: 'Rohit Verma',
    photoURL: '',
    score: 842,
    testsCompleted: 29,
    accuracy: 83,
    streak: 3,
    badge: 'Bronze',
    badges: [{ id: 'bronze1', name: 'Bronze Expert', level: 'bronze' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user8',
    rank: 8,
    name: 'Meena Joshi',
    displayName: 'Meena Joshi',
    photoURL: '',
    score: 830,
    testsCompleted: 28,
    accuracy: 82,
    streak: 0,
    badge: 'Bronze',
    badges: [{ id: 'bronze2', name: 'Bronze Expert', level: 'bronze' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user9',
    rank: 9,
    name: 'Deepak Nair',
    displayName: 'Deepak Nair',
    photoURL: '',
    score: 812,
    testsCompleted: 26,
    accuracy: 80,
    streak: 2,
    badge: 'Bronze',
    badges: [{ id: 'bronze3', name: 'Bronze Expert', level: 'bronze' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
  {
    id: 'user10',
    rank: 10,
    name: 'Kavita Das',
    displayName: 'Kavita Das',
    photoURL: '',
    score: 795,
    testsCompleted: 25,
    accuracy: 78,
    streak: 1,
    badge: 'Bronze',
    badges: [{ id: 'bronze4', name: 'Bronze Expert', level: 'bronze' }],
    isCurrentUser: false,
    lastActive: new Date() as any,
  },
];

// Mock categories for filtering
const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'ssc', name: 'SSC Exams' },
  { id: 'banking', name: 'Banking Exams' },
  { id: 'railway', name: 'Railway Exams' },
  { id: 'upsc', name: 'UPSC Exams' },
];

// Mock time periods for filtering
const timePeriods = [
  { id: 'all_time', name: 'All Time' },
  { id: 'this_week', name: 'This Week' },
  { id: 'this_month', name: 'This Month' },
  { id: 'last_3_months', name: 'Last 3 Months' },
];

// Styled rank container for top 3 positions
const RankContainer = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  fontWeight: 700,
  fontSize: '1rem',
}));

// Custom styled table row
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[2],
    zIndex: 1,
    position: 'relative',
  },
}));

// Badge color mapping with enhanced styling information
const getBadgeInfo = (badge: string, theme: any) => {
  switch (badge.toLowerCase()) {
    case 'gold':
      return {
        color: 'warning',
        bgColor: alpha(theme.palette.warning.main, 0.12),
        textColor: theme.palette.warning.dark,
        icon: <TrophyIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />,
        borderColor: theme.palette.warning.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.2)} 0%, ${alpha(theme.palette.warning.light, 0.2)} 100%)`,
      };
    case 'silver':
      return {
        color: 'primary',
        bgColor: alpha(theme.palette.primary.main, 0.12),
        textColor: theme.palette.primary.dark,
        icon: <TrophyIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />,
        borderColor: theme.palette.primary.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.light, 0.2)} 100%)`,
      };
    case 'bronze':
      return {
        color: 'error',
        bgColor: alpha(theme.palette.error.main, 0.12),
        textColor: theme.palette.error.dark,
        icon: <TrophyIcon fontSize="small" sx={{ color: theme.palette.error.main }} />,
        borderColor: theme.palette.error.main,
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.2)} 0%, ${alpha(theme.palette.error.light, 0.2)} 100%)`,
      };
    default:
      return {
        color: 'default',
        bgColor: alpha(theme.palette.text.primary, 0.05),
        textColor: theme.palette.text.primary,
        icon: <SchoolIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />,
        borderColor: alpha(theme.palette.text.primary, 0.2),
        gradient: `linear-gradient(135deg, ${alpha(theme.palette.text.primary, 0.05)} 0%, ${alpha(theme.palette.text.secondary, 0.05)} 100%)`,
      };
  }
};

export default function Leaderboard() {
  const theme = useTheme();
  const user = useAuthState();
  const [activeTab, setActiveTab] = useState(0);
  const [category, setCategory] = useState('all');
  const [timePeriod, setTimePeriod] = useState('all_time');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  
  // Board types with icons
  const boardTypes = [
    { label: 'Global', icon: <InsightsIcon fontSize="small" /> },
    { label: 'Friends', icon: <GroupIcon fontSize="small" /> },
    { label: 'My Stats', icon: <PersonIcon fontSize="small" /> }
  ];
  
  // Items per page for pagination
  const itemsPerPage = 10;
  
  // Query to fetch leaderboard data from backend
  const { data: backendLeaderboardData } = useLeaderboard(
    activeTab === 0 ? undefined : category !== 'all' ? category : undefined
  );
  
  // Query for processing and displaying leaderboard data
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard-ui', activeTab, category, timePeriod, page, searchTerm, backendLeaderboardData],
    queryFn: async () => {
      // In development, we use mock data
      // In production, we'd use the backendLeaderboardData
      let sourceData: ExtendedLeaderboardEntry[] = backendLeaderboardData?.entries as ExtendedLeaderboardEntry[] || mockLeaderboard;
      
      // Mark current user
      if (user) {
        sourceData = sourceData.map((entry: ExtendedLeaderboardEntry) => ({
          ...entry,
          isCurrentUser: entry.id === user.uid
        }));
      }
      
      let filtered = [...sourceData];
      
      // Apply search filter if provided
      if (searchTerm) {
        filtered = filtered.filter((entry: ExtendedLeaderboardEntry) => 
          entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // For "My Stats" tab, filter to show only the current user
      if (activeTab === 2) {
        filtered = filtered.filter((entry: ExtendedLeaderboardEntry) => entry.isCurrentUser);
      }
      
      // For "Friends" tab, in a real app we would filter by friends
      // For now, just show top 5 ranks as mock "friends"
      if (activeTab === 1) {
        filtered = filtered.filter((entry: ExtendedLeaderboardEntry) => entry.rank <= 5 || entry.isCurrentUser);
      }
      
      // Calculate pagination
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const paginatedData = filtered.slice(
        (page - 1) * itemsPerPage, 
        page * itemsPerPage
      );
      
      // Find current user's rank
      const currentUser = sourceData.find((entry: ExtendedLeaderboardEntry) => entry.isCurrentUser);
      
      return {
        entries: paginatedData,
        totalPages,
        currentUserRank: currentUser?.rank || '-'
      };
    },
    initialData: {
      entries: mockLeaderboard.slice(0, itemsPerPage),
      totalPages: Math.ceil(mockLeaderboard.length / itemsPerPage),
      currentUserRank: mockLeaderboard.find(entry => entry.isCurrentUser)?.rank || '-'
    }
  });
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1); // Reset to first page on tab change
  };
  
  // Handle category change
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  // Handle time period change
  const handleTimePeriodChange = (event: SelectChangeEvent) => {
    setTimePeriod(event.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on search
  };
  
  // Handle pagination
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersExpanded(prev => !prev);
  };
  
  // Get current user data
  const currentUserData = leaderboardData.entries.find(entry => entry.isCurrentUser) || mockLeaderboard.find(entry => entry.isCurrentUser);
  
  // Format number with commas for thousands
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Box sx={{ 
      background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
      minHeight: '100vh',
      pb: 8
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ 
          py: 5,
          mb: 5,
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            zIndex: -1,
            borderRadius: 3
          }} />
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Leaderboard
              </Typography>
              
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
                Compete with fellow students and see where you stand on the global rankings
              </Typography>
              
              {activeTab !== 2 && (
                <Paper 
                  elevation={2}
                  sx={{ 
                    p: 2, 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.9),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Box sx={{ mr: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Your Current Rank:
                    </Typography>
                    <Typography variant="h4" component="span" sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <TrophyIcon sx={{ mr: 1 }} />
                      #{leaderboardData.currentUserRank}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Your Score:
                    </Typography>
                    <Typography variant="h5" component="span" sx={{ 
                      fontWeight: 'bold',
                      color: 'secondary.main' 
                    }}>
                      {currentUserData?.score || "0"}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                height: { xs: 200, md: 250 }
              }}>
                {/* Trophy visual */}
                <Box sx={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      border: `4px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      boxShadow: `0 0 30px ${alpha(theme.palette.warning.main, 0.3)}`,
                    }}
                  >
                    <EmojiEventsIcon sx={{ fontSize: 60, color: theme.palette.warning.main }} />
                  </Avatar>
                </Box>
                
                {/* Decorative circles */}
                <Box sx={{
                  position: 'absolute',
                  top: '10%',
                  right: '20%',
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }} />
                
                <Box sx={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '20%',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                }} />
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Top 3 Leaders Cards */}
        {activeTab === 0 && leaderboardData.entries.some(entry => entry.rank <= 3) && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, px: 1 }}>
              Top Performers
            </Typography>
            
            <Grid container spacing={3}>
              {leaderboardData.entries
                .filter(entry => entry.rank <= 3)
                .sort((a, b) => a.rank - b.rank)
                .map((entry) => {
                  const badgeInfo = getBadgeInfo(entry.badge, theme);
                  const isTopRank = entry.rank === 1;
                  
                  return (
                    <Grid item xs={12} md={4} key={entry.id}>
                      <Card sx={{ 
                        height: '100%',
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'visible',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        boxShadow: isTopRank ? theme.shadows[6] : theme.shadows[2],
                        border: isTopRank ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}` : undefined,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[10]
                        }
                      }}>
                        {/* Rank indicator */}
                        <Box sx={{
                          position: 'absolute',
                          top: -20,
                          left: 'calc(50% - 25px)',
                          zIndex: 2
                        }}>
                          <RankContainer 
                            sx={{ 
                              width: 50,
                              height: 50,
                              background: entry.rank === 1 
                                ? `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)` 
                                : entry.rank === 2 
                                  ? `linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)`
                                  : `linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)`,
                              color: '#fff',
                              fontSize: '1.5rem',
                              boxShadow: theme.shadows[4]
                            }}
                          >
                            {['🥇', '🥈', '🥉'][entry.rank - 1]}
                          </RankContainer>
                        </Box>
                        
                        <CardContent sx={{ pt: 4 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            textAlign: 'center', 
                            mb: 2,
                            mt: 2
                          }}>
                            <Avatar 
                              src={entry.photoURL} 
                              alt={entry.name}
                              sx={{ 
                                width: 90, 
                                height: 90, 
                                mb: 2,
                                bgcolor: entry.isCurrentUser ? theme.palette.primary.main : badgeInfo.bgColor,
                                border: isTopRank ? `3px solid ${theme.palette.warning.main}` : `2px solid ${badgeInfo.borderColor}`,
                              }}
                            >
                              {entry.name.charAt(0)}
                            </Avatar>
                            
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {entry.name}
                              {entry.isCurrentUser && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    ml: 1, 
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1
                                  }}
                                >
                                  YOU
                                </Typography>
                              )}
                            </Typography>
                            
                            <Chip 
                              label={entry.badge}
                              size="small"
                              icon={badgeInfo.icon}
                              sx={{ 
                                bgcolor: badgeInfo.bgColor,
                                color: badgeInfo.textColor,
                                fontWeight: 600,
                                mb: 2
                              }}
                            />
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 1 }}>
                                <Typography variant="caption" color="text.secondary">Score</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                  {formatNumber(entry.score)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 1 }}>
                                <Typography variant="caption" color="text.secondary">Tests</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {entry.testsCompleted}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 1 }}>
                                <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                  {entry.accuracy}%
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center', p: 1 }}>
                                <Typography variant="caption" color="text.secondary">Streak</Typography>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: theme.palette.warning.main
                                }}>
                                  {entry.streak} {entry.streak > 0 && <WhatshotIcon sx={{ ml: 0.5, fontSize: 18 }} />}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          </Box>
        )}
        
        {/* Main Content Area */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                mb: 4, 
                borderRadius: 3, 
                boxShadow: theme.shadows[2],
                overflow: 'hidden'
              }}
            >
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.default, 0.4)
                }}
              >
                {boardTypes.map((type, index) => (
                  <Tab 
                    key={index} 
                    icon={type.icon} 
                    label={type.label}
                    sx={{ 
                      py: 2,
                      '&.Mui-selected': {
                        fontWeight: 600
                      }
                    }} 
                  />
                ))}
              </Tabs>
              
              {/* Filters */}
              <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                    Filters
                  </Typography>
                  <IconButton size="small" onClick={toggleFilters}>
                    {filtersExpanded ? <InfoIcon fontSize="small" /> : <FilterListIcon fontSize="small" />}
                  </IconButton>
                </Box>
                
                {filtersExpanded && (
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        labelId="category-label"
                        value={category}
                        label="Category"
                        onChange={handleCategoryChange}
                        size="small"
                      >
                        {categories.map(cat => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel id="time-period-label">Time Period</InputLabel>
                      <Select
                        labelId="time-period-label"
                        value={timePeriod}
                        label="Time Period"
                        onChange={handleTimePeriodChange}
                        size="small"
                      >
                        {timePeriods.map(period => (
                          <MenuItem key={period.id} value={period.id}>
                            {period.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Search by name"
                      variant="outlined"
                      value={searchTerm}
                      onChange={handleSearch}
                      size="small"
                      InputProps={{
                        endAdornment: <SearchIcon fontSize="small" color="action" />
                      }}
                    />
                  </Stack>
                )}
              </Box>
              
              {/* Leaderboard Table */}
              <TableContainer sx={{ maxHeight: 600 }}>
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '30%' }}>Student</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: '15%' }}>Score</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: '10%' }}>Tests</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: '10%' }}>Accuracy</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: '10%' }}>Streak</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: '15%' }}>Badge</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboardData.entries.map((entry) => {
                        const badgeInfo = getBadgeInfo(entry.badge, theme);
                        
                        return (
                          <StyledTableRow
                            key={entry.id}
                            sx={{
                              bgcolor: entry.isCurrentUser ? alpha(theme.palette.primary.main, 0.05) : 'inherit',
                              '&:nth-of-type(odd)': {
                                bgcolor: entry.isCurrentUser ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.background.default, 0.2),
                              },
                              borderLeft: entry.isCurrentUser ? `4px solid ${theme.palette.primary.main}` : 'none',
                            }}
                          >
                            <TableCell>
                              {entry.rank <= 3 ? (
                                <RankContainer
                                  sx={{
                                    background: entry.rank === 1
                                      ? `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)`
                                      : entry.rank === 2
                                        ? `linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)`
                                        : `linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)`,
                                    color: '#fff',
                                    boxShadow: theme.shadows[2],
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  {entry.rank}
                                </RankContainer>
                              ) : (
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: entry.isCurrentUser ? 700 : 500,
                                    color: entry.isCurrentUser ? theme.palette.primary.main : undefined
                                  }}
                                >
                                  {entry.rank}
                                </Typography>
                              )}
                            </TableCell>
                            
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={entry.photoURL} 
                                  alt={entry.name}
                                  sx={{ 
                                    mr: 2, 
                                    bgcolor: entry.isCurrentUser ? theme.palette.primary.main : badgeInfo.bgColor,
                                    width: 40,
                                    height: 40
                                  }}
                                >
                                  {entry.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: entry.isCurrentUser ? 700 : 500,
                                    color: entry.isCurrentUser ? theme.palette.primary.main : undefined
                                  }}>
                                    {entry.name}
                                  </Typography>
                                  
                                  {entry.isCurrentUser && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        display: 'inline-block',
                                        color: theme.palette.primary.main,
                                        fontWeight: 600,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        px: 1,
                                        py: 0.2,
                                        borderRadius: 1
                                      }}
                                    >
                                      YOU
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ 
                                fontWeight: 700, 
                                color: theme.palette.primary.main 
                              }}>
                                {formatNumber(entry.score)}
                              </Typography>
                            </TableCell>
                            
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={entry.testsCompleted}
                                sx={{
                                  fontWeight: 600,
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main,
                                  minWidth: 40
                                }}
                              />
                            </TableCell>
                            
                            <TableCell align="center">
                              <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <CheckIcon 
                                  fontSize="small" 
                                  sx={{ 
                                    mr: 0.5, 
                                    color: entry.accuracy > 85 
                                      ? theme.palette.success.main 
                                      : entry.accuracy > 70 
                                        ? theme.palette.warning.main 
                                        : theme.palette.error.main
                                  }} 
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {entry.accuracy}%
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            <TableCell align="center">
                              {entry.streak > 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {entry.streak}
                                  </Typography>
                                  <WhatshotIcon 
                                    sx={{ 
                                      ml: 0.5, 
                                      fontSize: 16, 
                                      color: theme.palette.warning.main 
                                    }} 
                                  />
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">—</Typography>
                              )}
                            </TableCell>
                            
                            <TableCell align="center">
                              <Chip 
                                label={entry.badge}
                                size="small"
                                icon={badgeInfo.icon}
                                sx={{ 
                                  bgcolor: badgeInfo.bgColor,
                                  color: badgeInfo.textColor,
                                  fontWeight: 600,
                                  minWidth: 80
                                }}
                              />
                            </TableCell>
                          </StyledTableRow>
                        );
                      })}
                      
                      {leaderboardData.entries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                              No results found for your search criteria
                            </Typography>
                            <Button 
                              variant="outlined" 
                              onClick={() => {
                                setCategory('all');
                                setTimePeriod('all_time');
                                setSearchTerm('');
                              }}
                              startIcon={<FilterListIcon />}
                            >
                              Clear Filters
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
              
              {/* Pagination */}
              {leaderboardData.totalPages > 1 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Pagination
                    count={leaderboardData.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    size="medium"
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* User Stats Card - Shown only in My Stats tab or for sidebar */}
            {currentUserData && (
              <Card sx={{ 
                mb: 4, 
                borderRadius: 3, 
                boxShadow: theme.shadows[2],
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: 6,
                  background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }} />
                
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ 
                    mb: 3, 
                    fontWeight: 600, 
                    color: theme.palette.primary.main,
                    pl: 1
                  }}>
                    Your Performance Stats
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pl: 1 }}>
                    <Avatar 
                      src={currentUserData.photoURL} 
                      alt={currentUserData.name}
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        mr: 2,
                        bgcolor: theme.palette.primary.main,
                      }}
                    >
                      {currentUserData.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Welcome back,</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>{currentUserData.name}</Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                      }}>
                        <Typography variant="caption" color="text.secondary">Current Rank</Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            #{currentUserData.rank}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.secondary.main, 0.05)
                      }}>
                        <Typography variant="caption" color="text.secondary">Score</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                          {formatNumber(currentUserData.score)}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.05)
                      }}>
                        <Typography variant="caption" color="text.secondary">Tests Completed</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                          {currentUserData.testsCompleted}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Paper sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05)
                      }}>
                        <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                          {currentUserData.accuracy}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Paper sx={{ 
                    mt: 3, 
                    p: 2, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.warning.main, 0.05)
                  }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      color: theme.palette.warning.main 
                    }}>
                      <BoltIcon />
                    </Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" color="text.secondary">Current Streak</Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.warning.main,
                        display: 'flex',
                        alignItems: 'center' 
                      }}>
                        {currentUserData.streak} days
                        {currentUserData.streak > 0 && <WhatshotIcon sx={{ ml: 1, fontSize: 20 }} />}
                      </Typography>
                    </Box>
                  </Paper>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    sx={{ mt: 3 }}
                    startIcon={<BarChartIcon />}
                  >
                    View Detailed Analytics
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* How rankings work */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              boxShadow: theme.shadows[2],
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }} />
              
              <Typography variant="h6" sx={{ 
                mt: 1, 
                mb: 2, 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}>
                <InsightsIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                How Rankings Work
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Your score is calculated based on your performance in tests, practice sessions, and daily streaks.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Test Scores</Typography>
                  <Typography variant="caption" fontWeight={600}>60%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={60}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                  <Typography variant="caption" fontWeight={600}>25%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={25}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.secondary.main
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Consistency</Typography>
                  <Typography variant="caption" fontWeight={600}>15%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={15}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.warning.main
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="outlined" 
                color="secondary"
                sx={{ mt: 1 }}
                endIcon={<TimelineIcon />}
              >
                Learn More
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}