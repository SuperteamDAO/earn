import React, { useCallback, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

import { TokenLabel } from './TokenLabel';

interface TokenNumberInputProps {
  value?: number | null;
  min?: number;
  max?: number;
  onChange?: (value: number | null) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  symbol?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  placeholder?: string;
  hideToken?: boolean;
}

export const TokenNumberInput = React.forwardRef<
  HTMLInputElement,
  TokenNumberInputProps
>(
  (
    {
      value = null,
      min = -Infinity,
      max = 1000000000000000,
      onChange,
      onBlur,
      symbol,
      disabled,
      className,
      name,
      placeholder,
      hideToken = false,
      ...props
    },
    ref,
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
        const numericValue = inputValue.replace(/\D/g, '');
        setInputValue(numericValue);

        const parsedValue = parseNumber(inputValue);
        if (parsedValue !== null) {
          const clampedValue = Math.min(Math.max(parsedValue, min), max);
          onChange?.(clampedValue);
        } else {
          onChange?.(null);
        }
      },
      [parseNumber, onChange, min, max],
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setInputValue(
        value !== null && value !== undefined && !isNaN(value)
          ? value.toString()
          : '',
      );
    }, [value]);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setInputValue(formatNumber(value));
        // Call the external onBlur prop if provided
        onBlur?.(e);
      },
      [value, formatNumber, onBlur],
    );

    return (
      <div
        className={cn(
          'border-input flex w-full items-center rounded-md border bg-transparent font-medium transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          'focus-within:ring-primary focus-within:ring-1',
          className,
        )}
      >
        {!hideToken && (
          <div className="w-max py-2 pl-4">
            <TokenLabel
              showIcon
              showSymbol
              symbol={symbol}
              classNames={{
                symbol: 'text-slate-600',
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
            'border-0 bg-transparent py-2 pl-2 text-left focus-visible:ring-0 focus-visible:ring-offset-0',
            '[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            'placeholder:text-slate-400',
          )}
        />
      </div>
    );
  },
);

TokenNumberInput.displayName = 'TokenNumberInput';
