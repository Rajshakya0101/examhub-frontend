import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Skeleton,
  Chip
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: Date;
  category: string;
}

// Simulated news data - replace with actual API call
const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Major Policy Changes in Education Sector',
    summary: 'Government announces new education policy focusing on skill development and practical learning. The policy aims to transform the education system with emphasis on digital literacy and vocational training.',
    date: new Date('2025-10-29'),
    category: 'Education'
  },
  {
    id: '2',
    title: 'New Space Mission Announced',
    summary: 'Space agency reveals plans for upcoming lunar mission with international collaboration. The mission will focus on exploring the lunar south pole region.',
    date: new Date('2025-10-28'),
    category: 'Science'
  },
  {
    id: '3',
    title: 'Breakthrough in Renewable Energy Technology',
    summary: 'Scientists develop new solar cell technology with record-breaking efficiency. The innovation could revolutionize clean energy production.',
    date: new Date('2025-10-27'),
    category: 'Technology'
  },
  {
    id: '4',
    title: 'Global Economic Summit Outcomes',
    summary: 'World leaders agree on new framework for international trade and digital commerce at the annual economic summit.',
    date: new Date('2025-10-26'),
    category: 'Economy'
  },
  {
    id: '5',
    title: 'Major Sports Tournament Results',
    summary: 'National team secures historic victory in international championship, marking a significant milestone in country\'s sports history.',
    date: new Date('2025-10-25'),
    category: 'Sports'
  },
  {
    id: '6',
    title: 'Healthcare Innovation Awards',
    summary: 'Revolutionary medical research recognized at annual healthcare innovation awards, promising new treatments for chronic conditions.',
    date: new Date('2025-10-24'),
    category: 'Healthcare'
  }
];

export default function CurrentAffairs() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchNews = async () => {
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNews(mockNews);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const NewsCardSkeleton = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Skeleton variant="rounded" width={120} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
        </Box>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="90%" height={20} />
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Skeleton variant="rounded" width={100} height={36} sx={{ display: 'inline-block' }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Current Affairs
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Stay updated with the latest news and developments
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(6)).map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <NewsCardSkeleton />
            </Grid>
          ))
        ) : (
          news.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 8px 24px ${theme.palette.mode === 'dark' 
                      ? 'rgba(0,0,0,0.3)' 
                      : 'rgba(0,0,0,0.1)'}`
                  }
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      lineHeight: 1.3
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<EventIcon />}
                      label={format(item.date, 'MMM d, yyyy')}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
                    <Chip
                      label={item.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                  <Typography 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      lineHeight: 1.6,
                      minHeight: 80 
                    }}
                  >
                    {item.summary}
                  </Typography>
                  <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                    <Button 
                      variant="text" 
                      color="primary"
                      sx={{ 
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: (theme) => 
                            theme.palette.mode === 'dark' 
                              ? 'rgba(124, 58, 237, 0.1)' 
                              : 'rgba(124, 58, 237, 0.05)'
                        }
                      }}
                    >
                      Read More
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}