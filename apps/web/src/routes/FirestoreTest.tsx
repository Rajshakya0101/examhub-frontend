import { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState, signInWithGoogle } from '@/lib/authContext';
import { createSampleUserData } from '@/utils/testFirestoreSetup';
import { recalculateLeaderboardRanks } from '@/lib/firestore';

export default function FirestoreTest() {
  const user = useAuthState();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('FirestoreTest - Auth state:', user ? 'Logged in' : 'Not logged in');
    if (user) {
      console.log('User ID:', user.uid);
      console.log('User email:', user.email);
    }
  }, [user]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      setResult({ success: true, message: 'Successfully signed in!' });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      // If user is logged in, test with their user ID
      if (user) {
        const testDoc = doc(db, 'users', user.uid);
        await setDoc(testDoc, {
          connectionTest: true,
          lastTested: new Date()
        }, { merge: true });
        setResult({
          success: true,
          message: 'Firestore connection successful!'
        });
      } else {
        setResult({
          success: false,
          message: 'Please sign in first to test connection'
        });
      }
    } catch (err: any) {
      setError(err.message);
      setResult({
        success: false,
        message: 'Firestore connection failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSampleData = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Creating sample data for user:', user.uid);
      const response = await createSampleUserData(user.uid);
      console.log('Sample data creation response:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Error creating sample data:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setError(`${err.code || 'Error'}: ${err.message || 'Failed to create sample data'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateRanks = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Recalculating global leaderboard ranks...');
      await recalculateLeaderboardRanks('global');
      setResult({
        success: true,
        message: 'Successfully recalculated all ranks based on total scores!'
      });
      console.log('Ranks recalculated successfully');
    } catch (err: any) {
      console.error('Error recalculating ranks:', err);
      setError(`Failed to recalculate ranks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔥 Firestore Setup Test
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Use this page to test your Firestore connection and create sample user data.
        </Typography>

        {!user && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please sign in to create sample data
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleSignIn}
              disabled={loading}
              sx={{ ml: 2 }}
            >
              Sign in with Google
            </Button>
          </Alert>
        )}

        {user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Logged in as: {user.displayName || user.email}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleTestConnection}
            disabled={loading}
          >
            Test Connection
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateSampleData}
            disabled={loading || !user}
          >
            Create Sample Data
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            onClick={handleRecalculateRanks}
            disabled={loading}
          >
            Recalculate Ranks
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {result && (
          <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {result.message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 What this creates:
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li><strong>userStats</strong> - Your performance statistics</li>
              <li><strong>attempts</strong> - Sample test attempt with scores</li>
              <li><strong>leaderboard_global</strong> - Your leaderboard entry</li>
              <li><strong>dailySummaries</strong> - Today's performance summary</li>
            </ul>
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            🔄 Recalculate Ranks:
          </Typography>
          <Typography variant="body2">
            Ranks are automatically recalculated after each test completion. 
            Use "Recalculate Ranks" button to manually update all user ranks globally based on their total scores.
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: 'info.light', mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎯 Next Steps:
          </Typography>
          <Typography variant="body2">
            1. Sign in with your account<br />
            2. Click "Create Sample Data"<br />
            3. Check your Firestore console<br />
            4. Navigate to Dashboard to see stats<br />
            5. Check Leaderboard to see your rank
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
}
