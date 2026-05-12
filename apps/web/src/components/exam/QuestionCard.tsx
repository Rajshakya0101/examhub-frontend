import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Button,
  Chip,
  Collapse
} from '@mui/material';

interface QuestionCardProps {
  questionNumber: number;
  question: {
    id: string;
    stem: string;
    options: string[];
    selectedIdx: number | null;
    correctIndex?: number;
    explanation?: string;
  };
  showAnswers?: boolean;
  onSelectOption?: (questionId: string, optionIdx: number) => void;
}

export default function QuestionCard({ 
  questionNumber, 
  question, 
  showAnswers = false,
  onSelectOption 
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectOption && !showAnswers) {
      onSelectOption(question.id, parseInt(event.target.value));
    }
  };

  const isCorrect = showAnswers && question.selectedIdx === question.correctIndex;
  const isWrong = showAnswers && question.selectedIdx !== null && question.selectedIdx !== question.correctIndex;

  return (
    <Card className="mb-4">
      <CardContent>
        {/* Question header */}
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="subtitle1" className="font-bold">
            Question {questionNumber}
          </Typography>
          
          {showAnswers && (
            <Chip 
              label={isCorrect ? "Correct" : isWrong ? "Wrong" : "Unanswered"} 
              color={isCorrect ? "success" : isWrong ? "error" : "default"}
              size="small"
            />
          )}
        </Box>

        {/* Question text */}
        <Typography variant="body1" className="mb-4">
          {question.stem}
        </Typography>

        {/* Options */}
        <RadioGroup 
          value={question.selectedIdx !== null ? question.selectedIdx : ''} 
          onChange={handleOptionChange}
        >
          {question.options.map((option, idx) => {
            const isSelected = question.selectedIdx === idx;
            const isCorrectAnswer = question.correctIndex === idx;
            const bgColor = showAnswers && isCorrectAnswer ? '#c8e6c9' : showAnswers && isSelected && !isCorrectAnswer ? '#ffccbc' : '';
            const borderColor = showAnswers && isCorrectAnswer ? '#2e7d32' : showAnswers && isSelected && !isCorrectAnswer ? '#d84315' : '';
            const borderWidth = showAnswers && (isCorrectAnswer || isSelected) ? '2px' : '1px';
            
            return (
              <FormControlLabel
                key={idx}
                value={idx}
                control={<Radio />}
                label={option}
                disabled={showAnswers}
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 1,
                  backgroundColor: bgColor,
                  border: `${borderWidth} solid ${borderColor}`,
                  '&:hover': showAnswers ? {} : { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              />
            );
          })}
        </RadioGroup>

        {/* Show answer summary */}
        {showAnswers && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
            {question.selectedIdx !== null ? (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Your Answer:</strong> {question.options[question.selectedIdx]}
                </Typography>
                {question.selectedIdx !== question.correctIndex && (
                  <Typography variant="body2" sx={{ color: 'success.main' }}>
                    <strong>Correct Answer:</strong> {question.options[question.correctIndex!]}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'warning.main' }}>
                  <strong>You didn't answer this question</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>
                  <strong>Correct Answer:</strong> {question.options[question.correctIndex!]}
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Show explanation if answers are revealed */}
        {showAnswers && question.explanation && (
          <>
            <Divider className="my-4" />
            <Box className="mt-2">
              <Button
                onClick={() => setExpanded(!expanded)}
                variant="text"
                color="primary"
                className="mb-2"
              >
                {expanded ? 'Hide' : 'Show'} Explanation
              </Button>
              
              <Collapse in={expanded}>
                <Typography variant="subtitle2" className="font-medium mb-1">
                  Explanation:
                </Typography>
                <Typography variant="body2">
                  {question.explanation}
                </Typography>
              </Collapse>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}