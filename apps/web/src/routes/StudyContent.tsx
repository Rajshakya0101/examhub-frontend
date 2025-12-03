import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const subjects = [
  {
    title: 'Mathematics',
    topics: ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus']
  },
  {
    title: 'English',
    topics: ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Skills']
  },
  {
    title: 'General Knowledge',
    topics: ['History', 'Geography', 'Science', 'Politics', 'Economics']
  },
  {
    title: 'Reasoning',
    topics: ['Logical', 'Verbal', 'Non-verbal', 'Analytical']
  },
  {
    title: 'Computer Science',
    topics: ['Programming', 'Database', 'Networking', 'Operating Systems']
  }
];

export default function StudyContent() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Study Materials
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive study materials for all subjects
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {subjects.map((subject) => (
          <Grid item xs={12} md={6} key={subject.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MenuBookIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" component="h2">
                    {subject.title}
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2 }}>
                  {subject.topics.map((topic) => (
                    <Typography
                      component="li"
                      key={topic}
                      sx={{ mb: 1, color: 'text.secondary' }}
                    >
                      {topic}
                    </Typography>
                  ))}
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => {/* TODO: Implement study material viewing */}}
                >
                  View Materials
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}