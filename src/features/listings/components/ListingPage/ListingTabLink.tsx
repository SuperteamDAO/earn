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
        'ph-no-capture hover:border-brand-purple/80 flex h-full items-center gap-2 border-b-2 px-3 text-sm font-medium text-slate-500 no-underline transition-colors',
        isActive ? 'border-brand-purple/80' : 'border-transparent',
        className,
      )}
      href={href}
      onClick={onClick}
    >
      {text}
      {subText && (
        <span className="bg-brand-purple/20 rounded-full px-1.5 py-px text-[10px] text-slate-500">
          {subText}
        </span>
      )}
    </Link>
  );
};
