import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Tabs,
  Tab,
  Divider,
  Stack,
  IconButton,
  Alert,
  AlertTitle,
  useTheme,
  alpha,
  Avatar,
  Badge,
  Rating,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Timer as TimerIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  EmojiEvents as EmojiEventsIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  FlagOutlined as FlagOutlinedIcon,
  BarChart as BarChartIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from '@/lib/auth';
import FullMock from './FullMock';
import SectionalMock from './SectionalMock';
import TopicWiseMock from './TopicWiseMock';

// Mock data for exams
const mockExams = [
  {
    id: 'ssc-cgl-tier1-2023',
    title: 'SSC CGL Tier 1 Mock Test',
    category: 'SSC',
    subcategory: 'CGL',
    type: 'Mock Test',
    difficulty: 'Medium',
    questions: 100,
    duration: 60, // in minutes (1h)
    sections: [
      { name: 'General Intelligence & Reasoning', questions: 25 },
      { name: 'General Awareness', questions: 25 },
      { name: 'Quantitative Aptitude', questions: 25 },
      { name: 'English Comprehension', questions: 25 },
    ],
    description: 'Full-length mock test for SSC CGL Tier 1 exam with sectional time limits.',
    isBookmarked: false,
    isPopular: true,
    isPremium: true,
    color: '#7c3aed', // Purple color matching the image
    image: '/images/tests/ssc-bg.jpg',
    featured: true,
    accuracy: 68,
    cutoff: 72
  },
  {
    id: 'ssc-chsl-2023-mock-1',
    title: 'SSC CHSL 2023 Mock Test',
    category: 'SSC',
    subcategory: 'CHSL',
    type: 'Mock Test',
    difficulty: 'Medium',
    questions: 100,
    duration: 60,
    sections: [
      { name: 'General Intelligence', questions: 25 },
      { name: 'English Language', questions: 25 },
      { name: 'Quantitative Aptitude', questions: 25 },
      { name: 'General Awareness', questions: 25 },
    ],
    description: 'Complete mock test for SSC CHSL 2023 with all sections.',
    isBookmarked: false,
    isPopular: false,
    isPremium: true,
    color: '#2563eb', // Primary color
    image: '/images/tests/ssc-chsl-bg.jpg',
    featured: false,
    accuracy: 72,
    cutoff: 68
  },
  {
    id: 'reasoning-sectional-1',
    title: 'Reasoning Sectional Test',
    category: 'Sectional',
    subcategory: 'Reasoning',
    type: 'Sectional',
    difficulty: 'Medium',
    questions: 30,
    duration: 30,
    sections: [
      { name: 'Reasoning', questions: 30 },
    ],
    description: 'Focused practice on reasoning abilities with various question types.',
    isBookmarked: false,
    isPopular: false,
    isPremium: false,
    color: '#10b981', // Success color
    image: '/images/tests/reasoning-bg.jpg',
    featured: false,
    accuracy: 82,
    cutoff: 60
  },
  {
    id: 'quant-sectional-1',
    title: 'Quantitative Aptitude Test',
    category: 'Sectional',
    subcategory: 'Quantitative Aptitude',
    type: 'Sectional',
    difficulty: 'Hard',
    questions: 35,
    duration: 35,
    sections: [
      { name: 'Quantitative Aptitude', questions: 35 },
    ],
    description: 'Intensive practice on quantitative aptitude with advanced difficulty level.',
    isBookmarked: false,
    isPopular: true,
    isPremium: false,
    color: '#f59e0b', // Warning color
    image: '/images/tests/quant-bg.jpg',
    featured: true,
    accuracy: 65,
    cutoff: 58
  },
  {
    id: 'english-sectional-1',
    title: 'English Sectional Test',
    category: 'Sectional',
    subcategory: 'English Language',
    type: 'Sectional',
    difficulty: 'Medium',
    questions: 25,
    duration: 12,
    sections: [
      { name: 'English Language', questions: 25 },
    ],
    description: 'Comprehensive practice on English grammar, vocabulary, and comprehension.',
    isBookmarked: false,
    isPopular: false,
    isPremium: false,
    color: '#3b82f6', // Blue color
    image: '/images/tests/english-bg.jpg',
    featured: false,
    accuracy: 75,
    cutoff: 55
  },
  {
    id: 'computer-sectional-1',
    title: 'Computer Knowledge Test',
    category: 'Sectional',
    subcategory: 'Computer Knowledge',
    type: 'Sectional',
    difficulty: 'Easy',
    questions: 15,
    duration: 5,
    sections: [
      { name: 'Computer Knowledge', questions: 15 },
    ],
    description: 'Quick practice on computer fundamentals and basic IT concepts.',
    isBookmarked: false,
    isPopular: false,
    isPremium: false,
    color: '#8b5cf6', // Purple color
    image: '/images/tests/computer-bg.jpg',
    featured: false,
    accuracy: 80,
    cutoff: 50
  }
];

// The type is inferred from mockExams

export default function Tests() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const user = useAuthState();
  const [activeTab, setActiveTab] = useState(0);
  const [bookmarkedExams, setBookmarkedExams] = useState<string[]>(
    // Initialize with any exams that are marked as bookmarked in the mock data
    mockExams.filter(exam => exam.isBookmarked).map(exam => exam.id)
  );
  const [featuredExam] = useState(
    // Find a featured and premium exam for the highlight section
    mockExams.find(exam => exam.featured && exam.isPremium) || mockExams[0]
  );
  const [ratedExams, setRatedExams] = useState<Record<string, number>>({});
  const [showPremiumAlert, setShowPremiumAlert] = useState(true);

  // Tabs for filtering exam types
  const tabs = [
    { label: 'All Tests', icon: <SchoolIcon fontSize="small" /> },
    { label: 'Full Mock', icon: <PlayArrowIcon fontSize="small" /> },
    { label: 'Sectional', icon: <BarChartIcon fontSize="small" /> },
    { label: 'Topic-Wise', icon: <WorkspacePremiumIcon fontSize="small" /> }
  ];
  
  // Query for loading AI-generated tests from Firestore
  const { data: aiGeneratedTests } = useQuery({
    queryKey: ['ai-tests', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      const testsRef = collection(db, 'tests');
      const q = query(
        testsRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'AI Generated Test',
          description: data.description || 'AI-generated test questions',
          category: data.templateId?.toUpperCase() || 'CUSTOM',
          subcategory: data.templateId || 'General',
          type: 'Mock Test',
          questions: data.totalQuestions || 0,
          duration: data.durationMinutes || 60,
          difficulty: data.difficulty === 'easy' ? 'Easy' : 
                      data.difficulty === 'hard' ? 'Hard' : 'Medium',
          sections: data.sections || [],
          isBookmarked: false,
          isPopular: false,
          isPremium: false,
          featured: false,
          attemptsCount: 0,
          rating: 0,
          reviews: 0,
          lastUpdated: data.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          color: theme.palette.primary.main,
          image: '',
          accuracy: 0,
          cutoff: 0
        };
      });
    },
    enabled: !!user,
  });
  
  // Query for loading exams (combining mock data with AI-generated tests)
  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', bookmarkedExams, aiGeneratedTests],
    queryFn: async () => {
      // Combine mock data with AI-generated tests
      const mockData = mockExams.map(exam => ({
        ...exam,
        isBookmarked: bookmarkedExams.includes(exam.id)
      }));
      
      const aiTests = aiGeneratedTests || [];
      
      return [...aiTests, ...mockData];
    },
    initialData: mockExams.map(exam => ({
      ...exam,
      isBookmarked: bookmarkedExams.includes(exam.id)
    })),
  });

  // Filter exams based on active tab
  const filteredExams = exams.filter(exam => {
    if (activeTab === 0) return true; // All tests
    if (activeTab === 1) return exam.type === 'Mock Test'; // Full Mock
    if (activeTab === 2) return exam.type === 'Sectional'; // Sectional
    if (activeTab === 3) return exam.type === 'Topic-Wise'; // Topic-Wise
    return true;
  });

  // Format duration from minutes to readable format
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
  };
  
  // Rate an exam
  const rateExam = (examId: string, rating: number | null, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (rating) {
      setRatedExams(prev => ({
        ...prev,
        [examId]: rating
      }));
    }
  };

  // Get difficulty info (color, icon, etc.)
  const getDifficultyInfo = (difficulty: string, theme: any) => {
    switch (difficulty) {
      case 'Easy': 
        return { 
          color: 'success',
          textColor: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1),
          icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
        };
      case 'Medium': 
        return { 
          color: 'warning',
          textColor: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1),
          icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
        };
      case 'Hard': 
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
  
  // Get test type info
  const getTestTypeInfo = (type: string, theme: any) => {
    switch (type) {
      case 'Mock Test': 
        return { 
          icon: <PlayArrowIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />,
          color: theme.palette.primary.main,
          bgColor: alpha(theme.palette.primary.main, 0.1)
        };
      case 'Sectional': 
        return { 
          icon: <BarChartIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />,
          color: theme.palette.secondary.main,
          bgColor: alpha(theme.palette.secondary.main, 0.1)
        };
      case 'Previous Year': 
        return { 
          icon: <HistoryIcon fontSize="small" sx={{ color: theme.palette.info.main }} />,
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.1)
        };
      default: 
        return { 
          icon: <HelpIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />,
          color: theme.palette.text.secondary,
          bgColor: alpha(theme.palette.text.secondary, 0.1)
        };
    }
  };

  // Toggle bookmark status
  const toggleBookmark = (examId: string, event?: React.MouseEvent) => {
    // Prevent event propagation to avoid navigating when clicking the bookmark icon
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // For the mock UI, just toggle the local state
    setBookmarkedExams(prev => {
      if (prev.includes(examId)) {
        return prev.filter(id => id !== examId);
      } else {
        return [...prev, examId];
      }
    });
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // State for mock test generation
  const [generatingTestForExam, setGeneratingTestForExam] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [generatedTestData, setGeneratedTestData] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Map exam titles to API exam names
  const getExamApiName = (examTitle: string) => {
    if (examTitle.includes('SSC CGL')) return 'SSC Combined Graduate Level';
    if (examTitle.includes('SSC CHSL')) return 'SSC CHSL';
    if (examTitle.includes('Railway') || examTitle.includes('RRB')) return 'Railway RRB NTPC';
    if (examTitle.includes('Bank PO') || examTitle.includes('IBPS PO')) return 'IBPS PO Prelims';
    if (examTitle.includes('Bank Clerk') || examTitle.includes('SBI Clerk')) return 'SBI Clerk Prelims';
    return 'SSC Combined Graduate Level'; // default
  };

  // Get subject from exam subcategory
  const getSubjectFromExam = (exam: any) => {
    if (exam.subcategory === 'Reasoning') return 'Reasoning';
    if (exam.subcategory === 'Quantitative Aptitude') return 'Quantitative Aptitude';
    if (exam.subcategory === 'English Language') return 'English Language';
    if (exam.subcategory === 'Computer Knowledge') return 'Computer Knowledge';
    return exam.subcategory;
  };

  // Mutation to generate full mock test
  const generateMockMutation = useMutation({
    mutationFn: async (exam: any) => {
      const examApiName = getExamApiName(exam.title);
      const difficulty = exam.difficulty === 'Easy' ? 'easy' : exam.difficulty === 'Hard' ? 'hard' : 'moderate';

      const response = await axios.post(
        'https://examhub-2.onrender.com/api/v2/generate-full-mock',
        {
          exam: examApiName,
          difficulty: difficulty,
        },
        {
          timeout: 600000, // 10 minute timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      // Clear any existing quiz data first
      sessionStorage.removeItem('quickQuiz');
      sessionStorage.removeItem('fullMockTest');
      sessionStorage.removeItem('sectionalMockTest');
      sessionStorage.removeItem('topicWiseMockTest');
      
      // Store test data in sessionStorage
      sessionStorage.setItem('fullMockTest', JSON.stringify(data.test));
      setGeneratedTestData(data.test);
      setGeneratingTestForExam(null);

      // Show instructions modal
      setShowInstructions(true);
    },
    onError: (error: any) => {
      console.error('Full mock generation failed:', error);

      let errorMessage = 'Unable to generate full mock test. Please try again.';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Server may be waking up. Please try again in 30 seconds.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service is starting up. Please wait 30 seconds and try again.';
      } else if (error.response) {
        errorMessage = error.response?.data?.message || `Server error: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Cannot reach the server. Please check your connection.';
      }

      setTestError(errorMessage);
      setGeneratingTestForExam(null);
    },
  });

  // Mutation to generate sectional mock test
  const generateSectionalMutation = useMutation({
    mutationFn: async (exam: any) => {
      const examApiName = getExamApiName(exam.title);
      const subject = getSubjectFromExam(exam);
      const difficulty = exam.difficulty === 'Easy' ? 'easy' : exam.difficulty === 'Hard' ? 'hard' : 'moderate';
      const numQuestions = exam.questions || 30;

      const response = await axios.post(
        'https://examhub-2.onrender.com/api/v2/generate-sectional-mock',
        {
          exam: examApiName,
          subject: subject,
          numQuestions: numQuestions,
          difficulty: difficulty,
        },
        {
          timeout: 300000, // 5 minute timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      // Clear any existing quiz data first
      sessionStorage.removeItem('quickQuiz');
      sessionStorage.removeItem('fullMockTest');
      sessionStorage.removeItem('sectionalMockTest');
      sessionStorage.removeItem('topicWiseMockTest');
      
      // Store test data in sessionStorage
      sessionStorage.setItem('sectionalMockTest', JSON.stringify(data.test));
      setGeneratedTestData(data.test);
      setGeneratingTestForExam(null);

      // Show instructions modal
      setShowInstructions(true);
    },
    onError: (error: any) => {
      console.error('Sectional mock generation failed:', error);

      let errorMessage = 'Unable to generate sectional test. Please try again.';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Server may be waking up. Please try again in 30 seconds.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service is starting up. Please wait 30 seconds and try again.';
      } else if (error.response) {
        errorMessage = error.response?.data?.message || `Server error: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Cannot reach the server. Please check your connection.';
      }

      setTestError(errorMessage);
      setGeneratingTestForExam(null);
    },
  });

  // Start an exam - generate full mock test or sectional test
  const startExam = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    setTestError(null);
    setGeneratingTestForExam(examId);
    
    // Check if it's a sectional test or full mock
    if (exam.type === 'Sectional') {
      generateSectionalMutation.mutate(exam);
    } else if (exam.type === 'Mock Test') {
      generateMockMutation.mutate(exam);
    } else {
      // For other types, just navigate (fallback)
      setGeneratingTestForExam(null);
      navigate(`/tests/${examId}`);
    }
  };

  const handleConfirmStart = () => {
    setShowInstructions(false);
    
    // Check which type of test was generated and get the stored data
    const fullMockTest = sessionStorage.getItem('fullMockTest');
    const sectionalMockTest = sessionStorage.getItem('sectionalMockTest');
    
    if (fullMockTest) {
      // Redirect the user to the Full Mock section page where the generated test is available
      navigate('/full-mock');
    } else if (sectionalMockTest) {
      // Redirect the user to the Sectional Mock section page
      navigate('/sectional-mock');
    }
  };

  // View exam details
  const viewExamDetails = (examId: string) => {
    navigate(`/tests/${examId}`);
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
                  Mock Tests & Exams
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: '80%' }}>
                  Practice with full-length mock tests and sectional practice tests designed to simulate real exam environments
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mr: 1 }}>
                      <SchoolIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">{mockExams.length}+</Typography>
                      <Typography variant="caption" color="text.secondary">Test Papers</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, mr: 1 }}>
                      <EmojiEventsIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">100%</Typography>
                      <Typography variant="caption" color="text.secondary">Exam Coverage</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ 
                  position: 'relative', 
                  height: 220,
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
                    transform: 'rotate(-3deg)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
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
                    }
                  }} />
                  <Box sx={{
                    width: 280,
                    height: 180,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                    borderRadius: 4,
                    position: 'absolute',
                    right: 50,
                    bottom: 0,
                    transform: 'rotate(6deg)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 15,
                      left: 15,
                      right: 15,
                      bottom: 15,
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.9),
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      zIndex: 1
                    }
                  }} />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
        
        {/* Featured Exam */}
        {featuredExam && (
          <Box sx={{ mb: 5 }}>
            <Paper sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: theme.shadows[3],
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(to right, ${alpha(featuredExam.color || theme.palette.primary.main, 0.95)}, ${alpha(featuredExam.color || theme.palette.primary.main, 0.85)})`,
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="1" fill-rule="evenodd"/%3E%3C/svg%3E")' }} />
              
              <Grid container sx={{ position: 'relative', zIndex: 1 }}>
                <Grid item xs={12} md={7} sx={{ p: 4, color: '#fff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {featuredExam.isPremium && (
                      <Chip 
                        icon={<WorkspacePremiumIcon fontSize="small" />} 
                        label="Premium" 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: '#fff',
                          fontWeight: 600,
                          mr: 1
                        }} 
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'uppercase' }}>
                      Featured Exam
                    </Typography>
                  </Box>
                  
                  <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                    {featuredExam.title}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    {featuredExam.description}
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36, mr: 1 }}>
                          <HelpIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>Questions</Typography>
                          <Typography variant="body1" fontWeight="600">{featuredExam.questions}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36, mr: 1 }}>
                          <TimerIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>Duration</Typography>
                          <Typography variant="body1" fontWeight="600">{formatDuration(featuredExam.duration)}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36, mr: 1 }}>
                          <FlagOutlinedIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>Difficulty</Typography>
                          <Typography variant="body1" fontWeight="600">{featuredExam.difficulty}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      onClick={() => startExam(featuredExam.id)}
                      sx={{ 
                        bgcolor: '#ffffff',
                        color: featuredExam.color || theme.palette.primary.main,
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: alpha('#ffffff', 0.9)
                        },
                        mr: 2,
                        px: 3
                      }}
                    >
                      Start Now
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      onClick={() => viewExamDetails(featuredExam.id)}
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: '#fff',
                        '&:hover': {
                          borderColor: '#ffffff',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        },
                        px: 3
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item md={5} sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
        
        {/* Premium Alert - Conditionally rendered */}
        {showPremiumAlert && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4, 
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              position: 'relative',
              overflow: 'hidden'
            }}
            icon={<WorkspacePremiumIcon />}
            onClose={() => setShowPremiumAlert(false)}
          >
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: 8, 
              height: '100%', 
              background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` 
            }} />
            
            <Box sx={{ pl: 0.5 }}>
              <AlertTitle sx={{ fontWeight: 600 }}>Unlock Premium Features</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Get access to all premium tests, performance analytics, and personalized study plans.
              </Typography>
              <Button 
                variant="outlined" 
                color="info" 
                size="small"
                startIcon={<WorkspacePremiumIcon />}
                sx={{ fontWeight: 600 }}
              >
                Upgrade Now
              </Button>
            </Box>
          </Alert>
        )}

        {/* Tabs for filtering */}
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ 
            borderRadius: 3,
            boxShadow: theme.shadows[2]
          }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={index} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {tab.icon}
                      <Box sx={{ ml: 1 }}>
                        {tab.label}
                      </Box>
                    </Box>
                  } 
                />
              ))}
            </Tabs>
          </Paper>
        </Box>

        {/* Content based on active tab */}
        {activeTab === 0 ? (
          // AI Mock Tests - Show exam cards
          isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress size={60} />
            </Box>
          ) : filteredExams.length > 0 ? (
            <Grid container spacing={3}>
            {filteredExams.map(exam => {
              const difficultyInfo = getDifficultyInfo(exam.difficulty, theme);
              const testTypeInfo = getTestTypeInfo(exam.type, theme);
              const isBookmarked = bookmarkedExams.includes(exam.id) || exam.isBookmarked;
              const userRating = ratedExams[exam.id] || 0;
              
              return (
                <Grid item xs={12} md={6} key={exam.id}>
                  <Card sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: theme.shadows[2],
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}>
                    {/* Top Color Bar */}
                    <Box sx={{
                      height: 6,
                      width: '100%',
                      bgcolor: exam.color || theme.palette.primary.main,
                    }} />
                    
                    {/* Premium Badge */}
                    {exam.isPremium && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16, 
                        zIndex: 2 
                      }}>
                        <Tooltip title="Premium Test">
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: alpha(theme.palette.secondary.main, 0.9),
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                          >
                            <WorkspacePremiumIcon fontSize="small" />
                          </Avatar>
                        </Tooltip>
                      </Box>
                    )}
                    
                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: testTypeInfo.bgColor,
                              color: testTypeInfo.color,
                              width: 40, 
                              height: 40,
                              mr: 1.5
                            }}
                          >
                            {testTypeInfo.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 500 }}>
                              {exam.category} • {exam.subcategory}
                            </Typography>
                            <Typography variant="h6" component="h2" sx={{ 
                              fontWeight: 600,
                              lineHeight: 1.3
                            }}>
                              {exam.title}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton 
                          onClick={(e) => toggleBookmark(exam.id, e)}
                          sx={{ mt: -0.5, ml: 0.5 }}
                          color={isBookmarked ? "primary" : "default"}
                          size="small"
                        >
                          {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                      </Box>
                      
                      {/* Tags Row */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          size="small" 
                          label={exam.difficulty} 
                          sx={{ 
                            bgcolor: difficultyInfo.bgColor,
                            color: difficultyInfo.textColor,
                            fontWeight: 500
                          }}
                          icon={difficultyInfo.icon}
                        />
                        
                        <Chip 
                          size="small" 
                          label={`${exam.questions} Questions`} 
                          variant="outlined"
                          icon={<HelpIcon fontSize="small" />}
                        />
                        
                        <Chip 
                          size="small" 
                          label={formatDuration(exam.duration)} 
                          variant="outlined"
                          icon={<TimerIcon fontSize="small" />}
                        />
                        
                        {exam.isPopular && (
                          <Chip 
                            size="small" 
                            label="Popular" 
                            sx={{ 
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              fontWeight: 500
                            }}
                            icon={<LocalFireDepartmentIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />}
                          />
                        )}
                      </Box>
                      
                      {/* Exam description */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 3,
                          minHeight: 40,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {exam.description}
                      </Typography>
                      
                      {/* Sections */}
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Sections:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {exam.sections.map((section: any, index: number) => (
                          <Chip
                            key={index}
                            label={`${section.name}`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              mb: 1, 
                              borderRadius: 1,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Button
                        size="small"
                        onClick={() => viewExamDetails(exam.id)}
                        startIcon={<InfoIcon />}
                        sx={{ fontWeight: 500 }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="contained"
                        size="medium"
                        onClick={() => startExam(exam.id)}
                        disabled={generatingTestForExam === exam.id}
                        endIcon={generatingTestForExam === exam.id ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                        sx={{ 
                          px: 3,
                          bgcolor: exam.color || theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: alpha(exam.color || theme.palette.primary.main, 0.9)
                          }
                        }}
                      >
                        {generatingTestForExam === exam.id ? 'Generating...' : 'Start Test'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
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
              No tests found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              No tests match your current filter. Try selecting a different category or check back later for new tests.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => setActiveTab(0)}
              sx={{ px: 4 }}
            >
              View All Tests
            </Button>
          </Paper>
        )
        ) : activeTab === 1 ? (
          // Full Mock component
          <FullMock />
        ) : activeTab === 2 ? (
          // Sectional component
          <SectionalMock />
        ) : activeTab === 3 ? (
          // Topic-Wise component
          <TopicWiseMock />
        ) : null}

        {/* Error Alert */}
        {testError && (
          <Alert 
            severity="error" 
            onClose={() => setTestError(null)}
            sx={{ mt: 3 }}
          >
            {testError}
          </Alert>
        )}

        {/* Instructions Dialog */}
        <Dialog 
          open={showInstructions} 
          onClose={() => setShowInstructions(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), fontWeight: 600 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" />
              Test Instructions
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              📋 General Instructions
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Read each question carefully before selecting an answer" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• You can navigate between questions using the question palette" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Keep track of the timer and manage your time wisely" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Click 'Submit' when you're done to see your results" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• You can review your answers and see detailed explanations after submission" />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              📊 Marking Scheme
            </Typography>
            <List dense>
              <ListItem>
                <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
                <ListItemText 
                  primary="Correct Answer: +2 marks" 
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Wrong Answer: -0.5 marks (Negative Marking)" 
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Unattempted: 0 marks" 
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Answer only when you're confident to avoid negative marking!
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setShowInstructions(false)} color="inherit">
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleConfirmStart}
              size="large"
              sx={{ px: 4 }}
              endIcon={<PlayArrowIcon />}
            >
              Start Test
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}