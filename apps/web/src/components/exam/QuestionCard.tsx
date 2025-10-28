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
          {question.options.map((option, idx) => (
            <FormControlLabel
              key={idx}
              value={idx}
              control={<Radio />}
              label={option}
              disabled={showAnswers}
              className={`p-2 mb-1 rounded ${showAnswers && idx === question.correctIndex ? 'bg-success bg-opacity-10' : ''}`}
            />
          ))}
        </RadioGroup>

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