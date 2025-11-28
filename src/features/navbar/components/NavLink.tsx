import Link from 'next/link';
import React, { type JSX } from 'react';

import { cn } from '@/utils/cn';

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  href: string;
  label: string | JSX.Element;
  isActive: boolean;
  className?: string;
  isPro?: boolean;
}

export const NavLink = ({
  href,
  label,
  isActive,
  className,
  isPro = false,
  ...props
}: NavLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center py-2 font-medium',
        'h-14',
        'text-sm',
        isActive ? 'text-slate-600' : 'text-slate-500',
        'hover:text-slate-600 hover:no-underline',
        'relative border-b',
        isActive
          ? isPro
            ? 'border-zinc-700'
            : 'border-brand-purple'
          : 'border-transparent',
        className,
      )}
      {...props}
    >
      {label}
    </Link>
  );
};
