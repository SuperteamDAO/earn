import React from 'react';

import { cn } from '@/utils/cn';

export const ShinyButton = ({
  children,
  onClick,
  classNames,
  disabled,
  animate = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  classNames?: {
    button?: string;
    span?: string;
  };
  disabled?: boolean;
  animate?: boolean;
}) => {
  return (
    <button
      className={cn(
        'relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md p-[1.5px] pb-[1.8px]',
        'bg-background shadow-[0px_2px_2.3px_0px_#0000002B]',
        'ph-no-capture cursor-pointer focus:ring-0 focus:outline-hidden',
        'transition-all duration-300 ease-in-out',
        !disabled &&
          'before:absolute before:inset-[-1000%] before:animate-[spin_2s_linear_infinite] before:bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]',
        !disabled && 'hover:scale-105 hover:bg-slate-50 hover:shadow-lg',
        !disabled &&
          animate &&
          'animate-[float_2s_ease-in-out_infinite,pulse_2s_ease-in-out_infinite]',
        !disabled &&
          animate &&
          'shadow-[0px_4px_20px_rgba(255,121,193,0.3),0px_2px_10px_rgba(118,197,255,0.3)]',
        disabled && 'cursor-not-allowed opacity-50',
        classNames?.button,
      )}
      disabled={disabled}
      onClick={onClick}
      tabIndex={-1}
      style={{
        ...(animate &&
          !disabled &&
          ({
            '--float-y': '-4px',
          } as React.CSSProperties)),
      }}
    >
      <span
        className={cn(
          'bg-background relative z-10 inline-flex h-full w-full items-center justify-center gap-2 rounded-[calc(0.375rem-1.5px)] px-4 py-1 text-sm font-medium text-slate-500 backdrop-blur-3xl',
          !disabled && animate && 'font-semibold',
          classNames?.span,
        )}
      >
        {children}
      </span>
    </button>
  );
};
