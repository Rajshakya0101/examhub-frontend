import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box className="flex flex-col items-center justify-center py-12">
      <Typography variant="h1" component="h1" className="text-6xl font-bold mb-4">
        404
      </Typography>
      <Typography variant="h4" component="h2" className="mb-8 text-center">
        Oops! Page not found
      </Typography>
      <Typography variant="body1" className="mb-8 text-center max-w-md">
        The page you are looking for might have been removed or is temporarily unavailable.
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/">
        Go to Homepage
      </Button>
    </Box>
  );
}