import React, { useCallback } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { validateDecimalPlaces, validateNumericInput } from '../validation/validators';

type NumericInputProps = Omit<
  TextFieldProps,
  'onChange' | 'onBlur' | 'type' | 'inputMode' | 'error' | 'helperText'
> & {
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  maxDecimals?: number;
  allowNegative?: boolean;
  allowZero?: boolean;
  min?: number;
  max?: number;
  error?: boolean;
  helperText?: string | React.ReactNode;
};

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  onBlur,
  maxDecimals = 2,
  allowNegative = false,
  allowZero = false,
  min,
  max,
  error = false,
  helperText = '',
  ...textFieldProps
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string
      if (inputValue === '') {
        onChange(inputValue);
        return;
      }

      // Reject non-numeric characters except decimal point and minus sign
      if (!/^-?\d*\.?\d*$/.test(inputValue)) {
        return;
      }

      // Check decimal places
      if (!validateDecimalPlaces(inputValue, maxDecimals)) {
        return;
      }

      // Check negative values
      if (!allowNegative && parseFloat(inputValue) < 0) {
        return;
      }

      // Check zero
      if (!allowZero && parseFloat(inputValue) === 0 && inputValue !== '') {
        return;
      }

      // Check range
      if (inputValue !== '' && inputValue !== '-') {
        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue)) {
          if (min !== undefined && numValue < min) {
            return;
          }
          if (max !== undefined && numValue > max) {
            return;
          }
        }
      }

      onChange(inputValue);
    },
    [onChange, maxDecimals, allowNegative, allowZero, min, max]
  );

  const isInvalid = error || (value !== '' && !validateNumericInput(value));

  return (
    <TextField
      {...(textFieldProps as any)}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      error={isInvalid}
      helperText={isInvalid ? helperText : ''}
    />
  );
};

export default NumericInput;
