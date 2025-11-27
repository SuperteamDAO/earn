import React, { useCallback, useEffect, useState } from 'react';

import { tokenList } from '@/constants/tokenList';

import { Input } from './input';
import { LocalImage } from './local-image';

const MAX_DECIMALS = 4;

function TokenInput({
  token,
  onChange,
  value,
  ...props
}: React.ComponentProps<typeof Input> & {
  readonly token: string | undefined;
  readonly onChange?: (value: number | null) => void;
  readonly value?: number | null;
}) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  const formatNumber = useCallback((num: number | null): string => {
    if (num === null || num === undefined || isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      maximumFractionDigits: MAX_DECIMALS,
    });
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatNumber(value ?? null));
    }
  }, [value, isFocused, formatNumber]);

  const limitDecimals = useCallback((val: string): string => {
    if (!val.includes('.')) return val;
    if (val.endsWith('.')) return val;
    const [integer, fraction] = val.split('.');
    if (fraction && fraction.length > MAX_DECIMALS) {
      return `${integer}.${fraction.substring(0, MAX_DECIMALS)}`;
    }
    return val;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;

      if (/^(\d*\.?\d*)$/.test(rawInput) || rawInput === '') {
        const limitedInput = limitDecimals(rawInput);
        setInputValue(limitedInput);

        if (limitedInput === '' || limitedInput === '.') {
          onChange?.(null);
          return;
        }

        const parsed = parseFloat(limitedInput);
        if (!isNaN(parsed)) {
          onChange?.(parsed);
        } else {
          onChange?.(null);
        }
      }
    },
    [onChange, limitDecimals],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (value !== null && value !== undefined && !isNaN(value)) {
      setInputValue(limitDecimals(value.toString()));
    } else {
      setInputValue('');
    }
  }, [value, limitDecimals]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (value !== null && value !== undefined && !isNaN(value)) {
      const rounded = Number(value.toFixed(MAX_DECIMALS));
      setInputValue(formatNumber(rounded));
      if (value !== rounded) {
        onChange?.(rounded);
      }
    } else {
      setInputValue('');
    }
  }, [value, formatNumber, onChange]);

  const tokenIcon =
    tokenList.find((e) => e?.tokenSymbol === token)?.icon ??
    '/assets/dollar.svg';

  return (
    <div data-slot="token-input" className="flex">
      <div
        data-slot="token-input-token"
        className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 pr-5 pl-3"
      >
        <LocalImage
          data-slot="token-input-icon"
          className="h-4 w-4 rounded-full"
          alt="token"
          src={tokenIcon}
        />
        <p
          data-slot="token-input-symbol"
          className="text-sm font-medium text-slate-500 sm:text-base"
        >
          {token}
        </p>
      </div>
      <Input
        data-slot="token-input-field"
        className="rounded-l-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        type="text"
        inputMode="decimal"
        value={inputValue}
        {...props}
      />
    </div>
  );
}

export { TokenInput };
