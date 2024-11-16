import React from 'react';

import { tokenList } from '@/constants';

import { Input } from './input';

export const TokenInput = React.forwardRef<
  HTMLInputElement,
  {
    token: string | undefined;
    onChange?: (e: any) => void;
    value?: number | null;
  }
>(({ token, onChange, value, ...props }, ref) => {
  return (
    <div className="flex">
      <div className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted pl-3 pr-5">
        <img
          className="h-4 w-4 rounded-full"
          alt="token"
          src={
            tokenList.filter((e) => e?.tokenSymbol === token)[0]?.icon ??
            '/assets/icons/green-dollar.svg'
          }
        />
        <p className="font-medium text-slate-500">{token}</p>
      </div>
      <Input
        className="rounded-l-none"
        ref={ref}
        onChange={(e) => {
          const value = e.target.value === '' ? null : Number(e.target.value);
          onChange?.(value);
        }}
        type="number"
        value={value ?? ''}
        {...props}
      />
    </div>
  );
});

TokenInput.displayName = 'TokenInput';
