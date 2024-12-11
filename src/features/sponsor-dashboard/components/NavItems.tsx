import Link from 'next/link';
import { useRouter } from 'next/router';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';

import { cn } from '@/utils';

interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: IconType;
  link?: string;
  children: ReactNode;
  isExpanded: boolean;
}

export const NavItem = ({
  icon,
  link,
  children,
  isExpanded,
  ...rest
}: NavItemProps) => {
  const router = useRouter();
  const currentPath = router.asPath.split('?')[0];
  const isExternalLink = link?.startsWith('https://');
  const resolvedLink = isExternalLink ? link : `/dashboard${link}`;
  const isActiveLink = resolvedLink
    ? currentPath?.startsWith(resolvedLink)
    : false;

  const LinkComponent = (
    <NavItemContent
      icon={icon}
      isActiveLink={isActiveLink!}
      isExpanded={isExpanded}
      {...rest}
    >
      {children}
    </NavItemContent>
  );

  if (isExternalLink) {
    return (
      <a
        href={resolvedLink}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        {LinkComponent}
      </a>
    );
  }

  return (
    <Link href={resolvedLink || '#'} className="no-underline">
      {LinkComponent}
    </Link>
  );
};

const NavItemContent = ({
  icon: Icon,
  isActiveLink,
  isExpanded,
  children,
  ...rest
}: {
  icon: IconType;
  isActiveLink: boolean;
  isExpanded: boolean;
  children: ReactNode;
}) => (
  <div
    className={cn(
      'flex cursor-pointer items-center px-6 py-3 transition-colors duration-300',
      isExpanded ? 'mr-0' : 'mr-4',
      isActiveLink
        ? 'bg-[#EEF2FF] text-[#3730A3]'
        : 'bg-transparent text-slate-500',
      'hover:bg-[#F5F8FF] hover:text-brand-purple',
    )}
    role="group"
    {...rest}
  >
    {Icon && (
      <Icon
        className={cn(
          'transition-all duration-300 ease-in-out group-hover:text-brand-purple',
          isExpanded ? 'mr-4 text-base' : 'mr-0 text-xl',
        )}
      />
    )}
    <span
      className={cn(
        'nav-item-text transition-opacity duration-200 ease-in-out',
        isExpanded ? 'static opacity-100' : 'absolute -ml-[9999px] opacity-0',
      )}
    >
      {children}
    </span>
  </div>
);
