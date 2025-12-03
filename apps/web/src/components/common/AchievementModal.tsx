import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Fade,
  Zoom,
  Paper,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import type { Achievement } from '@/lib/firestore';

interface AchievementModalProps {
  open: boolean;
  onClose: () => void;
  achievements: Achievement[];
  streakMilestone?: boolean;
}

// Celebration animation
const celebrate = keyframes`
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
`;

// Shine animation
const shine = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const AchievementCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
  border: `2px solid ${theme.palette.primary.main}40`,
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-200%',
    width: '200%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}20, transparent)`,
    animation: `${shine} 3s infinite`,
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  animation: `${celebrate} 0.8s ease-in-out`,
  boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
}));

const PointsBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.spacing(2),
  background: theme.palette.warning.main,
  color: theme.palette.common.white,
  fontWeight: 700,
  fontSize: '0.875rem',
}));

export function AchievementModal({
  open,
  onClose,
  achievements,
  streakMilestone,
}: AchievementModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (achievements.length === 0 && !streakMilestone) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];
  const hasMore = currentIndex < achievements.length - 1;
  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  // If only streak milestone, show special message
  if (achievements.length === 0 && streakMilestone) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700} gutterBottom>
              🔥 Streak Milestone! 🔥
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={3}>
            <Typography variant="body1" color="text.secondary">
              Keep up your daily streak! Consistency is the key to success.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleClose}
            sx={{ minWidth: 150 }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={500}
    >
      <DialogTitle>
        <Box textAlign="center">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            🎉 Achievement Unlocked! 🎉
          </Typography>
          {achievements.length > 1 && (
            <Typography variant="body2" color="text.secondary">
              {currentIndex + 1} of {achievements.length}
            </Typography>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Zoom in={open} style={{ transitionDelay: '200ms' }}>
          <Box>
            <AchievementCard elevation={0}>
              <Stack spacing={3} alignItems="center">
                <IconWrapper>
                  <EmojiEventsIcon
                    sx={{
                      fontSize: 48,
                      color: 'common.white',
                    }}
                  />
                </IconWrapper>

                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {currentAchievement?.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {currentAchievement?.description}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <PointsBadge>
                      <StarIcon sx={{ fontSize: 16 }} />
                      <span>+{currentAchievement?.points} XP</span>
                    </PointsBadge>

                    <Typography
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: 1,
                      }}
                    >
                      {currentAchievement?.level}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </AchievementCard>

            {achievements.length > 1 && currentIndex === 0 && (
              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Total: <strong>{totalPoints} XP</strong> earned from {achievements.length} achievements
                </Typography>
              </Box>
            )}
          </Box>
        </Zoom>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        {hasMore ? (
          <>
            <Button variant="outlined" onClick={handleClose}>
              Skip All
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              sx={{ minWidth: 150 }}
            >
              Next Achievement
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={handleClose}
            sx={{ minWidth: 150 }}
          >
            Awesome!
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
