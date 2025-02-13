import React from 'react';

import { tokenList } from '@/constants/tokenList';

import { Input } from './input';
import { LocalImage } from './local-image';

export const TokenInput = React.forwardRef<
  HTMLInputElement,
  {
    token: string | undefined;
    onChange?: (e: any) => void;
    value?: number | null;
  }
>(({ token, onChange, value, ...props }, ref) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === '') {
      onChange?.(null);
      return;
    }

    const numericValue = inputValue.replace(/[^0-9]/g, '');
    const finalValue = numericValue ? Number(numericValue) : null;

    onChange?.(finalValue);
  };

  return (
    <div className="flex">
      <div className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 pr-5 pl-3">
        <LocalImage
          className="h-4 w-4 rounded-full"
          alt="token"
          src={
            tokenList.filter((e) => e?.tokenSymbol === token)[0]?.icon ??
            '/assets/dollar.svg'
          }
        />
        <p className="text-sm font-medium text-slate-500 sm:text-base">
          {token}
        </p>
      </div>
      <Input
        className="rounded-l-none"
        ref={ref}
        onChange={handleInputChange}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ''}
        min="0"
        onKeyDown={(e) => {
          if (
            !/[0-9]|\Backspace|\Tab|\Delete|\ArrowLeft|\ArrowRight/.test(e.key)
          ) {
            e.preventDefault();
          }
        }}
        {...props}
      />
    </div>
  );
});

TokenInput.displayName = 'TokenInput';
