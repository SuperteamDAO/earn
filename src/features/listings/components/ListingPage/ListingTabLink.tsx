import Link from 'next/link';

import { cn } from '@/utils/cn';

type ListingTabLinkProps = {
  href: string;
  text: string;
  isActive: boolean;
  subText?: string;
  onClick?: () => void;
  className?: string;
};

export const ListingTabLink = ({
  href,
  text,
  isActive,
  onClick,
  className,
  subText,
}: ListingTabLinkProps) => {
  return (
    <Link
      className={cn(
        'ph-no-capture hover:border-brand-purple flex h-full items-center gap-2 border-b-2 text-sm font-medium text-slate-500 no-underline transition-colors',
        'text-xs md:text-sm',
        isActive ? 'border-brand-purple' : 'border-transparent',
        className,
      )}
      href={href}
      onClick={onClick}
    >
      {text}
      {subText && (
        <span className="text-[10px] text-slate-400 md:text-xs">{subText}</span>
      )}
    </Link>
  );
};
