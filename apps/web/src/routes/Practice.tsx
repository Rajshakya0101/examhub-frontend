import { useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  TextField, 
  Chip,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  LinearProgress,
  SelectChangeEvent,
  Pagination,
  useTheme,
  alpha,
  Avatar,
  InputAdornment,
  IconButton,
  Rating,
  Badge,
  Stack,
  Tab,
  Tabs
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Mock data for initial development
const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'gk', name: 'General Knowledge' },
  { id: 'math', name: 'Mathematics' },
  { id: 'english', name: 'English' },
  { id: 'reasoning', name: 'Reasoning' },
  { id: 'computers', name: 'Computer Science' }
];

const DIFFICULTIES = [
  { id: 'all', name: 'All Difficulties' },
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' }
];

// Fake practice sets for UI development
const MOCK_PRACTICE_SETS = [
  {
    id: '1',
    title: 'Basic Quantitative Aptitude',
    category: 'math',
    difficulty: 'easy',
    questions: 15,
    estimatedTime: 15,
    description: 'Practice basic arithmetic operations, percentages, and ratio-proportion.',
    topics: ['Arithmetic', 'Percentages', 'Ratio'],
    rating: 4.8,
    attemptsCount: 1245,
    completionRate: 92,
    color: '#2563eb', // Primary color
    image: '/images/practice/math-bg.jpg',
    popular: true,
    featured: true
  },
  {
    id: '2',
    title: 'Verbal Reasoning',
    category: 'reasoning',
    difficulty: 'medium',
    questions: 20,
    estimatedTime: 25,
    description: 'Practice syllogisms, statement assumptions, and logical deductions.',
    topics: ['Syllogisms', 'Statement-Assumptions', 'Logical Deductions'],
    rating: 4.5,
    attemptsCount: 876,
    completionRate: 78,
    color: '#7c3aed', // Secondary color
    image: '/images/practice/reasoning-bg.jpg',
    popular: true,
    featured: false
  },
  {
    id: '3',
    title: 'Advanced Data Interpretation',
    category: 'math',
    difficulty: 'hard',
    questions: 10,
    estimatedTime: 30,
    description: 'Complex data interpretation based on graphs, tables, and charts.',
    topics: ['Graphs', 'Tables', 'Data Analysis'],
    rating: 4.9,
    attemptsCount: 652,
    completionRate: 65,
    color: '#2563eb', // Primary color
    image: '/images/practice/data-bg.jpg',
    popular: false,
    featured: true
  },
  {
    id: '4',
    title: 'General Knowledge: Current Affairs',
    category: 'gk',
    difficulty: 'medium',
    questions: 25,
    estimatedTime: 20,
    description: 'Current affairs from national and international domains from the last 3 months.',
    topics: ['Current Affairs', 'Politics', 'Sports', 'Science'],
    rating: 4.6,
    attemptsCount: 1502,
    completionRate: 88,
    color: '#10b981', // Success color
    image: '/images/practice/gk-bg.jpg',
    popular: true,
    featured: false
  },
  {
    id: '5',
    title: 'Computer Fundamentals',
    category: 'computers',
    difficulty: 'easy',
    questions: 15,
    estimatedTime: 15,
    description: 'Basic computer fundamentals including hardware, software, and networking.',
    topics: ['Hardware', 'Software', 'Networking'],
    rating: 4.7,
    attemptsCount: 987,
    completionRate: 94,
    color: '#3b82f6', // Info color
    image: '/images/practice/computer-bg.jpg',
    popular: false,
    featured: true
  },
  {
    id: '6',
    title: 'English Grammar',
    category: 'english',
    difficulty: 'medium',
    questions: 20,
    estimatedTime: 20,
    description: 'English grammar topics including tenses, articles, and prepositions.',
    topics: ['Grammar', 'Vocabulary', 'Comprehension'],
    rating: 4.4,
    attemptsCount: 1123,
    completionRate: 82,
    color: '#f59e0b', // Warning color
    image: '/images/practice/english-bg.jpg',
    popular: true,
    featured: false
  }
];

// Type definitions are inferred from MOCK_PRACTICE_SETS

// Get difficulty color and icon
const getDifficultyInfo = (difficulty: string, theme: any) => {
  switch (difficulty) {
    case 'easy': 
      return { 
        color: 'success',
        textColor: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
      };
    case 'medium': 
      return { 
        color: 'warning',
        textColor: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
      };
    case 'hard': 
      return { 
        color: 'error',
        textColor: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
      };
    default: 
      return { 
        color: 'default',
        textColor: theme.palette.text.primary,
        bgColor: alpha(theme.palette.text.primary, 0.05),
        icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
      };
  }
};

export default function Practice() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [bookmarkedSets, setBookmarkedSets] = useState<string[]>([]);
  const [likedSets, setLikedSets] = useState<string[]>([]);
  
  // Mock data for UI development
  const { data: practiceSets, isLoading } = useQuery({
    queryKey: ['practice-sets', filters, activeTab],
    queryFn: async () => {
      // In a real app, this would call Firebase or another API
      // For now, just filter the mock data
      let filteredSets = [...MOCK_PRACTICE_SETS];
      
      // Apply tab filter first
      switch (activeTab) {
        case 1: // Featured
          filteredSets = filteredSets.filter(set => set.featured);
          break;
        case 2: // Popular
          filteredSets = filteredSets.filter(set => set.popular);
          break;
        case 3: // Bookmarked
          filteredSets = filteredSets.filter(set => bookmarkedSets.includes(set.id));
          break;
      }
      
      // Then apply user-selected filters
      return filteredSets.filter(set => {
        const matchesCategory = filters.category === 'all' || set.category === filters.category;
        const matchesDifficulty = filters.difficulty === 'all' || set.difficulty === filters.difficulty;
        const matchesSearch = !filters.search || 
          set.title.toLowerCase().includes(filters.search.toLowerCase()) || 
          set.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          set.topics.some(topic => topic.toLowerCase().includes(filters.search.toLowerCase()));
        
        return matchesCategory && matchesDifficulty && matchesSearch;
      });
    },
    // Using initialData to avoid loading state for mock data
    initialData: MOCK_PRACTICE_SETS,
  });

  // Handle filter changes
  const handleCategoryChange = (e: SelectChangeEvent) => {
    setFilters(prev => ({ ...prev, category: e.target.value }));
    setCurrentPage(1);
  };
  
  const handleDifficultyChange = (e: SelectChangeEvent) => {
    setFilters(prev => ({ ...prev, difficulty: e.target.value }));
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setCurrentPage(1);
  };
  
  // Handle practice set selection
  const startPracticeSet = (setId: string) => {
    navigate(`/practice/${setId}`);
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setCurrentPage(1);
  };
  
  // Handle bookmarking
  const toggleBookmark = (setId: string) => {
    setBookmarkedSets(prev => 
      prev.includes(setId) 
        ? prev.filter(id => id !== setId) 
        : [...prev, setId]
    );
  };
  
  // Handle liking
  const toggleLike = (setId: string) => {
    setLikedSets(prev => 
      prev.includes(setId) 
        ? prev.filter(id => id !== setId) 
        : [...prev, setId]
    );
  };
  
  // Pagination
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(practiceSets.length / ITEMS_PER_PAGE);
  const displayedSets = practiceSets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Box sx={{ 
      background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.8)}, ${theme.palette.background.default})`,
      minHeight: '100vh',
      pb: 8,
      pt: 3,
      borderRadius: 3
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ 
          py: 5,
          mb: 4,
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[1]
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            zIndex: -1
          }} />
          
          <Container>
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
                  Practice Questions
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
                  Build skills through targeted practice and track your improvement over time
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mr: 1 }}>
                      <QuizIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">6,000+</Typography>
                      <Typography variant="caption" color="text.secondary">Questions</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, mr: 1 }}>
                      <EmojiEventsIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">20+</Typography>
                      <Typography variant="caption" color="text.secondary">Categories</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ 
                  position: 'relative', 
                  height: 200,
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {/* This would ideally be a vector illustration, using a placeholder effect for now */}
                  <Box sx={{
                    width: 320,
                    height: 200,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    borderRadius: 4,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      right: 20,
                      bottom: 20,
                      borderRadius: 2,
                      background: theme.palette.background.paper,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      zIndex: 1
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 40,
                      left: 40,
                      width: 240,
                      height: 20,
                      borderRadius: 1,
                      background: alpha(theme.palette.primary.main, 0.2),
                      zIndex: 2
                    }
                  }} />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
        
        {/* Tab Navigation */}
        <Box sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              '& .MuiTab-root': {
                minWidth: 100,
                fontWeight: 600
              }
            }}
          >
            <Tab label="All Sets" />
            <Tab label="Featured" />
            <Tab label="Popular" />
            <Tab label={
              <Badge badgeContent={bookmarkedSets.length} color="primary">
                Bookmarked
              </Badge>
            } />
          </Tabs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="500">
              {practiceSets.length} practice sets available
            </Typography>
            
            <Button 
              variant="text" 
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ textTransform: 'none' }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>
        </Box>
        
        {/* Search and Filters */}
        {showFilters && (
          <Paper sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            boxShadow: theme.shadows[2],
            background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search practice sets..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: theme.palette.background.paper
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3.5}>
                <FormControl fullWidth>
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    value={filters.category}
                    label="Category"
                    onChange={handleCategoryChange}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.background.paper
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <CategoryIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    {CATEGORIES.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3.5}>
                <FormControl fullWidth>
                  <InputLabel id="difficulty-label">Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    value={filters.difficulty}
                    label="Difficulty"
                    onChange={handleDifficultyChange}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.background.paper
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <LocalFireDepartmentIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    {DIFFICULTIES.map(difficulty => (
                      <MenuItem key={difficulty.id} value={difficulty.id}>
                        {difficulty.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* Practice Sets */}
        {isLoading ? (
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
          </Box>
        ) : displayedSets.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {displayedSets.map(set => {
                const difficultyInfo = getDifficultyInfo(set.difficulty, theme);
                const isBookmarked = bookmarkedSets.includes(set.id);
                const isLiked = likedSets.includes(set.id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={set.id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: theme.shadows[8],
                      }
                    }}>
                      {/* Category Color Bar */}
                      <Box sx={{
                        height: 8,
                        width: '100%',
                        bgcolor: set.color,
                      }} />
                      
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip 
                            label={CATEGORIES.find(c => c.id === set.category)?.name || set.category}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(set.color, 0.1),
                              color: set.color,
                              fontWeight: 500,
                              borderRadius: 1
                            }} 
                          />
                          <Box>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(set.id);
                              }}
                              sx={{ mr: 0.5 }}
                            >
                              {isBookmarked ? 
                                <BookmarkIcon fontSize="small" color="primary" /> : 
                                <BookmarkBorderIcon fontSize="small" />
                              }
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Typography 
                          variant="h6" 
                          component="h2" 
                          sx={{ 
                            mb: 1,
                            fontWeight: 600,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            height: 48
                          }}
                        >
                          {set.title}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: 40
                          }}
                        >
                          {set.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Rating value={set.rating} precision={0.1} size="small" readOnly sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {set.rating.toFixed(1)}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary">
                            {set.attemptsCount.toLocaleString()} attempts • {set.completionRate}% completion rate
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <QuizIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {set.questions} Questions
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {set.estimatedTime} Minutes
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          {difficultyInfo.icon}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              ml: 0.5,
                              color: difficultyInfo.textColor,
                              fontWeight: 500
                            }}
                          >
                            {set.difficulty.charAt(0).toUpperCase() + set.difficulty.slice(1)} Difficulty
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          {set.topics.slice(0, 3).map((topic, index) => (
                            <Chip
                              key={index}
                              label={topic}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderRadius: 1,
                                fontSize: '0.7rem'
                              }}
                            />
                          ))}
                          {set.topics.length > 3 && (
                            <Chip
                              label={`+${set.topics.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderRadius: 1,
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Stack>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center'
                        }}>
                          <Box>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(set.id);
                              }}
                              color={isLiked ? "secondary" : "default"}
                            >
                              {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                            </IconButton>
                          </Box>
                          
                          <Button 
                            variant="contained" 
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => startPracticeSet(set.id)}
                            sx={{ 
                              bgcolor: set.color,
                              '&:hover': {
                                bgcolor: alpha(set.color, 0.9)
                              },
                              borderRadius: 2,
                              px: 2
                            }}
                          >
                            Start Practice
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  size="large"
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      mx: 0.5
                    }
                  }}
                />
              </Box>
            )}
          </>
        ) : (
          <Paper sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: theme.shadows[2],
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            mt: 4
          }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              No practice sets match your filters
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Try adjusting your search criteria or explore different categories to find practice sets that match your needs.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => setFilters({ category: 'all', difficulty: 'all', search: '' })}
              sx={{ px: 4 }}
            >
              Clear Filters
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
}