import React, { useState, useCallback, useEffect } from 'react';
import { TokenLabel } from './TokenLabel';
import { cn } from '@/utils';
import { Input } from '@/components/ui/input';

interface TokenNumberInputProps {
  value?: number | null;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number | null) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  symbol?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  name?: string;
  placeholder?: string;
  hideToken?: boolean;
}

export const TokenNumberInput = React.forwardRef<HTMLInputElement, TokenNumberInputProps>(
  (
    {
      value = null,
      min = -Infinity,
      max = 1000000000000000,
      step = 1,
      onChange,
      onBlur,
      symbol,
      error,
      disabled,
      className,
      name,
      placeholder,
      hideToken = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState<string>('');

    const formatNumber = useCallback((num: number | null) => {
      if (num === null || num === undefined || isNaN(num)) return '';
      return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }, []);

    useEffect(() => {
      if (!isFocused) {
        setInputValue(formatNumber(value));
      }
    }, [value, isFocused, formatNumber]);

    const parseNumber = useCallback((str: string) => {
      if (!str) return null;
      const cleanStr = str.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? null : parsed;
    }, []);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setInputValue(inputValue);

        const parsedValue = parseNumber(inputValue);
        if (parsedValue !== null) {
          const clampedValue = Math.min(Math.max(parsedValue, min), max);
          onChange?.(clampedValue);
        } else {
          onChange?.(null);
        }
      },
      [parseNumber, onChange, min, max]
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setInputValue(value !== null && value !== undefined && !isNaN(value) ? value.toString() : '');
    }, [value]);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setInputValue(formatNumber(value));
        // Call the external onBlur prop if provided
        onBlur?.(e);
      },
      [value, formatNumber, onBlur]
    );

    return (
      <div
        className={cn(
          'flex items-center w-full rounded-md border border-input bg-transparent transition-colors font-medium',
          disabled && 'cursor-not-allowed opacity-50',
          'focus-within:ring-1 focus-within:ring-primary',
          className
        )}
      >
        {!hideToken && (
          <div className="pl-4 py-2 w-max">
            <TokenLabel
              showIcon
              showSymbol
              symbol={symbol}
              classNames={{
                symbol: 'text-slate-500',
              }}
            />
          </div>
        )}
        <Input
          {...props}
          ref={ref}
          name={name}
          placeholder={placeholder}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'border-0 pl-2 py-2 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-left',
            '[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            'placeholder:text-slate-400 '
          )}
        />
      </div>
    );
  }
);

TokenNumberInput.displayName = 'TokenNumberInput';
