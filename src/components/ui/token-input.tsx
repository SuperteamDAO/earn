import React from 'react';

import { tokenList } from '@/constants/tokenList';
import { cn } from '@/utils/cn';

import { Input } from './input';
import { LocalImage } from './local-image';

function TokenInput({
  token,
  onChange,
  value,
  isPro = false,
  ...props
}: React.ComponentProps<typeof Input> & {
  token: string | undefined;
  onChange?: (value: number | null) => void;
  value?: number | null;
  isPro?: boolean;
}) {
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
    <div data-slot="token-input" className="flex">
      <div
        data-slot="token-input-token"
        className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 pr-5 pl-3"
      >
        <LocalImage
          data-slot="token-input-icon"
          className="h-4 w-4 rounded-full"
          alt="token"
          src={
            tokenList.filter((e) => e?.tokenSymbol === token)[0]?.icon ??
            '/assets/dollar.svg'
          }
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
        className={cn(
          'rounded-l-none',
          isPro && 'focus-visible:ring-1 focus-visible:ring-zinc-400',
        )}
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
}

export { TokenInput };
