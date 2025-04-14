import React, { useCallback, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

import { TokenLabel } from './TokenLabel';

interface TokenNumberInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
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
  maxDecimals?: number;
}

function TokenNumberInput({
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
  maxDecimals = 2,
  ...props
}: TokenNumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');

  const formatNumber = useCallback(
    (num: number | null) => {
      if (num === null || num === undefined || isNaN(num)) return '';
      return num.toLocaleString('en-US', {
        maximumFractionDigits: maxDecimals,
      });
    },
    [maxDecimals],
  );

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatNumber(value));
    }
  }, [value, isFocused, formatNumber]);

  const parseNumber = useCallback((str: string) => {
    if (!str) return null;
    const cleanStr = str.replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(cleanStr);
    return isNaN(parsed) ? null : parsed;
  }, []);

  const limitDecimals = useCallback(
    (value: string): string => {
      if (!value.includes('.')) return value;
      if (value.endsWith('.')) return value;
      const [integer, fraction] = value.split('.');
      if (fraction && fraction.length > maxDecimals) {
        return `${integer}.${fraction.substring(0, maxDecimals)}`;
      }
      return value;
    },
    [maxDecimals],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      if (/^(\d*\.?\d*)$/.test(rawInput) || rawInput === '') {
        const limitedInput = limitDecimals(rawInput);
        setInputValue(limitedInput);

        const parsedValue = parseNumber(limitedInput);
        if (parsedValue !== null) {
          const clampedValue = Math.min(Math.max(parsedValue, min), max);
          onChange?.(clampedValue);
        } else {
          onChange?.(null);
        }
      }
    },
    [parseNumber, onChange, min, max, limitDecimals],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (value !== null && value !== undefined && !isNaN(value)) {
      const valueStr = value.toString();
      setInputValue(limitDecimals(valueStr));
    } else {
      setInputValue('');
    }
  }, [value, limitDecimals]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      if (value !== null && value !== undefined && !isNaN(value)) {
        const roundedValue = Number(value.toFixed(maxDecimals));
        setInputValue(formatNumber(roundedValue));
        if (value !== roundedValue) {
          onChange?.(roundedValue);
        }
      } else {
        setInputValue('');
      }
      onBlur?.(e);
    },
    [value, formatNumber, onBlur, maxDecimals, onChange],
  );

  return (
    <div
      data-slot="token-number-input"
      className={cn(
        'border-input flex w-full items-center rounded-md border bg-transparent font-medium transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        'focus-within:ring-primary focus-within:ring-1',
        className,
      )}
    >
      {!hideToken && (
        <div data-slot="token-label-container" className="w-max py-2 pl-4">
          <TokenLabel
            data-slot="token-label"
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
        data-slot="token-number-input-field"
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
}

export { TokenNumberInput };
