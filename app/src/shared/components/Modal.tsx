import React, { type ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
} from '@mui/material';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  variant?: 'info' | 'error' | 'success' | 'warning';
  isAlert?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  onConfirm,
  children,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = true,
  variant = 'info',
  isAlert = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {isAlert ? (
          <Alert severity={variant} sx={{ mt: 1 }}>
            {variant !== 'info' && <AlertTitle>{title}</AlertTitle>}
            {children}
          </Alert>
        ) : (
          children
        )}
      </DialogContent>
      <DialogActions>
        {showCancel && <Button onClick={onClose}>{cancelText}</Button>}
        {onConfirm && (
          <Button onClick={handleConfirm} variant="contained" color="primary">
            {confirmText}
          </Button>
        )}
        {!onConfirm && (
          <Button onClick={onClose} variant="contained" color="primary">
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
