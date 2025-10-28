import { ReactNode, useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton, 
  Typography,
  LinearProgress,
  Box,
  SvgIcon
} from '@mui/material';

// Simple replacement for CloseIcon if the MUI icons package is not available
const CloseIcon = () => (
  <SvgIcon>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </SvgIcon>
);

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  disableSubmit?: boolean;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  successMessage?: string;
  autoCloseOnSuccess?: boolean;
  autoCloseDelay?: number;
  hideActions?: boolean;
}

export default function FormDialog({
  open,
  onClose,
  title,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onSubmit,
  disableSubmit = false,
  children,
  maxWidth = 'sm',
  fullWidth = true,
  isSubmitting = false,
  isSuccess = false,
  successMessage,
  autoCloseOnSuccess = false,
  autoCloseDelay = 2000,
  hideActions = false
}: FormDialogProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Handle auto-close on success
  useEffect(() => {
    if (isSuccess && autoCloseOnSuccess) {
      setShowSuccess(true);
      
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, autoCloseOnSuccess, autoCloseDelay, onClose]);

  return (
    <Dialog 
      open={open} 
      onClose={isSubmitting ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      <DialogTitle>
        <Typography variant="h6">{title}</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {isSubmitting && <LinearProgress />}
      
      <DialogContent>
        {showSuccess && successMessage ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography color="success.main" variant="h6">
              {successMessage}
            </Typography>
          </Box>
        ) : children}
      </DialogContent>
      
      {!hideActions && !showSuccess && (
        <DialogActions>
          <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          {onSubmit && (
            <Button 
              onClick={onSubmit} 
              variant="contained" 
              color="primary"
              disabled={disableSubmit || isSubmitting}
            >
              {submitLabel}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}