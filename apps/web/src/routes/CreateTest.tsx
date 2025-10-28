import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  SelectChangeEvent,
} from '@mui/material';
import { useGenerateQuestions } from '@/lib/functions';
import { aiGenerationSchema } from '@/lib/validation';
import FormDialog from '@/components/common/FormDialog';
import { z } from 'zod';

// Mock exam templates
const examTemplates = [
  {
    id: 'ssc-cgl',
    name: 'SSC CGL',
    description: 'Staff Selection Commission Combined Graduate Level',
    sections: [
      { name: 'General Intelligence & Reasoning', count: 25 },
      { name: 'General Awareness', count: 25 },
      { name: 'Quantitative Aptitude', count: 25 },
      { name: 'English Comprehension', count: 25 },
    ],
    duration: 60,
    totalQuestions: 100,
  },
  {
    id: 'ibps-po',
    name: 'IBPS PO',
    description: 'Institute of Banking Personnel Selection - Probationary Officer',
    sections: [
      { name: 'English Language', count: 30 },
      { name: 'Quantitative Aptitude', count: 35 },
      { name: 'Reasoning Ability', count: 35 },
    ],
    duration: 60,
    totalQuestions: 100,
  },
  {
    id: 'rrb-ntpc',
    name: 'RRB NTPC',
    description: 'Railway Recruitment Board Non-Technical Popular Categories',
    sections: [
      { name: 'General Awareness', count: 40 },
      { name: 'Mathematics', count: 30 },
      { name: 'General Intelligence & Reasoning', count: 30 },
    ],
    duration: 90,
    totalQuestions: 100,
  },
];

// Topics for different exam sections
const topicsBySection: Record<string, string[]> = {
  'General Intelligence & Reasoning': [
    'Analogies', 'Coding-Decoding', 'Paper Folding', 'Matrix', 'Word Formation',
    'Venn Diagrams', 'Direction & Distances', 'Blood Relations', 'Series'
  ],
  'General Awareness': [
    'Indian History', 'Geography', 'Indian Economy', 'Indian Polity', 
    'Science & Technology', 'Current Affairs', 'Static GK'
  ],
  'Quantitative Aptitude': [
    'Number System', 'Algebra', 'Profit & Loss', 'Time & Work', 'Speed & Distance',
    'Percentage', 'Ratio & Proportion', 'Data Interpretation'
  ],
  'English Comprehension': [
    'Reading Comprehension', 'Fill in the Blanks', 'Sentence Correction',
    'Error Spotting', 'Vocabulary', 'Grammar', 'Verbal Ability'
  ],
  'English Language': [
    'Reading Comprehension', 'Cloze Test', 'Para Jumbles', 'Error Detection',
    'Sentence Improvement', 'Fill in the Blanks', 'Vocabulary'
  ],
  'Reasoning Ability': [
    'Syllogism', 'Inequalities', 'Puzzles', 'Seating Arrangement', 'Machine Input-Output',
    'Blood Relations', 'Direction Tests', 'Order & Ranking'
  ],
  'Mathematics': [
    'Number System', 'Simplification', 'Decimals & Fractions', 'Ratio & Proportion',
    'Percentage', 'Profit & Loss', 'Simple Interest', 'Time & Work'
  ],
};

export default function CreateTest() {
  const navigate = useNavigate();
  const generateQuestionsMutation = useGenerateQuestions();
  
  // State for the test creation wizard
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [testDetails, setTestDetails] = useState({
    title: '',
    description: '',
    instructions: '',
    durationMinutes: 60,
    isPublic: false,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });
  
  // State for AI question generation dialog
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [generationSection, setGenerationSection] = useState('');
  const [generationTopic, setGenerationTopic] = useState('');
  const [generationCount, setGenerationCount] = useState(10);
  
  // Validation for the current step
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get the selected template data
  const selectedTemplateData = examTemplates.find(template => template.id === selectedTemplate);
  
  // Steps in the wizard
  const steps = ['Select Template', 'Test Details', 'Configure Sections', 'Review & Create'];
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Pre-fill test details based on template
    const template = examTemplates.find(t => t.id === templateId);
    if (template) {
      setTestDetails({
        ...testDetails,
        title: `${template.name} Mock Test`,
        description: template.description,
        instructions: 'Read all questions carefully. Each question carries equal marks. There is no negative marking.',
        durationMinutes: template.duration,
      });
    }
  };
  
  // Handle next step in wizard
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!selectedTemplate) {
        setErrors({ template: 'Please select a template' });
        return;
      }
    }
    
    if (activeStep === 1) {
      try {
        // Validate test details using zod schema
        const validationSchema = z.object({
          title: z.string().min(1, 'Title is required'),
          description: z.string().min(1, 'Description is required'),
          durationMinutes: z.number().min(10, 'Duration must be at least 10 minutes'),
        });
        
        validationSchema.parse(testDetails);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach(err => {
            const field = err.path[0] as string;
            newErrors[field] = err.message;
          });
          setErrors(newErrors);
          return;
        }
      }
    }
    
    setErrors({});
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle back step in wizard
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle creating the test
  const handleCreateTest = async () => {
    try {
      // In a real app, this would create the test in Firestore
      // For now, we'll just log it and navigate
      console.log('Creating test:', {
        ...testDetails,
        template: selectedTemplate,
        sections: selectedTemplateData?.sections,
      });
      
      // Navigate to the tests page after creation
      navigate('/tests');
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };
  
  // Handle opening the AI generation dialog for a section
  const handleOpenGenerationDialog = (section: string) => {
    setGenerationSection(section);
    setGenerationTopic('');
    setGenerationCount(10);
    setGenerationDialogOpen(true);
  };
  
  // Handle AI question generation
  const handleGenerateQuestions = async () => {
    try {
      // Validate input
      const schema = aiGenerationSchema;
      schema.parse({
        topic: generationTopic,
        count: generationCount,
        difficulty: testDetails.difficulty,
      });
      
      // Generate questions
      await generateQuestionsMutation.mutateAsync({
        topic: generationTopic,
        count: generationCount,
        difficulty: testDetails.difficulty,
        examType: selectedTemplate || 'general',
      });
      
      // Close dialog on success
      setGenerationDialogOpen(false);
    } catch (error) {
      console.error('Error generating questions:', error);
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };
  
  // Handle change in test details
  const handleTestDetailChange = (field: string, value: string | number | boolean) => {
    setTestDetails({
      ...testDetails,
      [field]: value,
    });
    
    // Clear error for this field if any
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  // Render the current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Select Template
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Choose a template for your test
            </Typography>
            <Grid container spacing={3}>
              {examTemplates.map(template => (
                <Grid item xs={12} md={4} key={template.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      border: selectedTemplate === template.id ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2">
                        <strong>Questions:</strong> {template.totalQuestions}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Duration:</strong> {template.duration} minutes
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Sections:</strong> {template.sections.length}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {template.sections.map(section => (
                          <Chip 
                            key={section.name} 
                            label={section.name} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {errors.template && (
              <Typography color="error" sx={{ mt: 2 }}>
                {errors.template}
              </Typography>
            )}
          </Box>
        );
        
      case 1: // Test Details
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Enter test details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Test Title"
                  value={testDetails.title}
                  onChange={e => handleTestDetailChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={testDetails.description}
                  onChange={e => handleTestDetailChange('description', e.target.value)}
                  multiline
                  rows={2}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  value={testDetails.instructions}
                  onChange={e => handleTestDetailChange('instructions', e.target.value)}
                  multiline
                  rows={3}
                  error={!!errors.instructions}
                  helperText={errors.instructions}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  value={testDetails.durationMinutes}
                  onChange={e => handleTestDetailChange('durationMinutes', parseInt(e.target.value) || 0)}
                  error={!!errors.durationMinutes}
                  helperText={errors.durationMinutes}
                  InputProps={{ inputProps: { min: 10 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="difficulty-label">Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    value={testDetails.difficulty}
                    label="Difficulty"
                    onChange={(e) => handleTestDetailChange('difficulty', e.target.value)}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <Typography component="div" variant="body2">
                    <input
                      type="checkbox"
                      checked={testDetails.isPublic}
                      onChange={e => handleTestDetailChange('isPublic', e.target.checked)}
                      id="public-checkbox"
                    />
                    <label htmlFor="public-checkbox" style={{ marginLeft: '8px' }}>
                      Make this test public (visible to all users)
                    </label>
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2: // Configure Sections
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Configure test sections and questions
            </Typography>
            {selectedTemplateData?.sections.map((section, index) => (
              <Paper key={section.name} sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Section {index + 1}: {section.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {section.count} questions
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Generate AI questions for this section or upload your own.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => handleOpenGenerationDialog(section.name)}
                  >
                    Generate AI Questions
                  </Button>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    0 of {section.count} questions added
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        );
        
      case 3: // Review & Create
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Review your test
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Template
                  </Typography>
                  <Typography variant="body1">
                    {selectedTemplateData?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1">
                    {testDetails.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {testDetails.durationMinutes} minutes
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Difficulty
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {testDetails.difficulty}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {testDetails.description}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Instructions
                  </Typography>
                  <Typography variant="body1">
                    {testDetails.instructions}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Visibility
                  </Typography>
                  <Typography variant="body1">
                    {testDetails.isPublic ? 'Public' : 'Private'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Sections
              </Typography>
              <Grid container spacing={2}>
                {selectedTemplateData?.sections.map((section, index) => (
                  <Grid item xs={12} key={index}>
                    <Typography variant="body1">
                      {section.name}: {section.count} questions
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Container>
      <Box className="mb-6">
        <Typography variant="h4" component="h1" className="font-bold mb-2">
          Create New Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow the steps to create a new test for your students
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      {renderStepContent()}
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateTest}
            >
              Create Test
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
      
      {/* AI Question Generation Dialog */}
      <FormDialog
        open={generationDialogOpen}
        onClose={() => setGenerationDialogOpen(false)}
        title={`Generate Questions for ${generationSection}`}
        submitLabel="Generate"
        onSubmit={handleGenerateQuestions}
        isSubmitting={generateQuestionsMutation.isPending}
      >
        <Box sx={{ width: '100%' }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="topic-label">Topic</InputLabel>
            <Select
              labelId="topic-label"
              value={generationTopic}
              label="Topic"
              onChange={(e: SelectChangeEvent<string>) => setGenerationTopic(e.target.value)}
            >
              {topicsBySection[generationSection]?.map(topic => (
                <MenuItem key={topic} value={topic}>{topic}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Select a specific topic for better question quality</FormHelperText>
          </FormControl>
          
          <TextField
            fullWidth
            type="number"
            label="Number of Questions"
            value={generationCount}
            onChange={e => setGenerationCount(parseInt(e.target.value) || 5)}
            InputProps={{ inputProps: { min: 1, max: 20 } }}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            Questions will be generated at {testDetails.difficulty} difficulty level for {selectedTemplateData?.name}.
          </Typography>
        </Box>
      </FormDialog>
    </Container>
  );
}