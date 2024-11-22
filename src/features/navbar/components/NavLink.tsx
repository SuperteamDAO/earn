import NextLink from 'next/link';
import React from 'react';

import { cn } from '@/utils';

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  href: string;
  label: string | JSX.Element;
  isActive: boolean;
  className?: string;
}

export const NavLink = ({
  href,
  label,
  isActive,
  className,
  ...props
}: NavLinkProps) => {
  return (
    <NextLink
      href={href}
      className={cn(
        'flex items-center py-2 font-medium',
        'h-8 lg:h-14',
        'text-lg lg:text-sm',
        isActive ? 'text-slate-600' : 'text-slate-500',
        'hover:text-slate-600 hover:no-underline',
        'lg:border-b',
        isActive ? 'lg:border-brand-purple' : 'lg:border-transparent',
        className,
      )}
      {...props}
    >
      {label}
    </NextLink>
  );
};
