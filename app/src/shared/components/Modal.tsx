import React, { type ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  onConfirm,
  children,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: 'calc(100dvh - 32px)',
          display: 'flex',
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2, overflowY: 'auto' }}>{children}</DialogContent>
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
