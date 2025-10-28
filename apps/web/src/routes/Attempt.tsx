import { Box } from '@mui/material';
import ExamPlayer from '@/components/exam/ExamPlayer';

export default function Attempt() {
  // No need for extra elements here, just pass through to the ExamPlayer
  return (
    <Box className="m-0 p-0 max-w-none">
      <ExamPlayer />
    </Box>
  );
}