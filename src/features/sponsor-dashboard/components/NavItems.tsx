import Link from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';

import { cn } from '@/utils/cn';

interface NavItemProps {
  icon: IconType;
  link?: string;
  children: ReactNode;
  isExpanded: boolean;
  className?: string;
  onClick?: () => void;
}

export const NavItem = ({
  icon: Icon,
  link,
  children,
  isExpanded,
  className,
  onClick,
}: NavItemProps) => {
  const router = useRouter();
  const currentPath = router.asPath.split('?')[0];
  const isExternalLink = link?.startsWith('https://');
  const resolvedLink = isExternalLink ? link : `/dashboard${link}`;
  const isActiveLink = resolvedLink
    ? currentPath?.startsWith(resolvedLink)
    : false;

  return (
    <Link
      href={resolvedLink || '#'}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noopener noreferrer' : undefined}
      className="no-underline focus:outline-none"
    >
      <div
        className={cn(
          'flex cursor-pointer items-center px-6 py-3 transition-colors',
          isExpanded ? 'mr-0' : 'mr-4',
          isActiveLink
            ? 'bg-indigo-50 text-indigo-800'
            : 'bg-transparent text-slate-500',
          'hover:bg-blue-50 hover:text-indigo-700',
          className,
        )}
        onClick={onClick}
      >
        {Icon && (
          <Icon
            className={cn(
              'transition-all duration-300 ease-in-out hover:text-indigo-700',
              isExpanded ? 'mr-4 text-base' : 'mr-0 text-xl',
            )}
          />
        )}
        <span
          className={cn(
            'text-sm font-medium transition-opacity duration-200 ease-in-out',
            isExpanded
              ? 'static opacity-100'
              : 'absolute -ml-[9999px] opacity-0',
          )}
        >
          {children}
        </span>
      </div>
    </Link>
  );
};
