import Link from 'next/link';

import { cn } from '@/utils/cn';

type ListingTabLinkProps = {
  href: string;
  text: string;
  isActive: boolean;
  subText?: string;
  onClick?: () => void;
  className?: string;
  isPro?: boolean;
};

export const ListingTabLink = ({
  href,
  text,
  isActive,
  onClick,
  className,
  subText,
  isPro,
}: ListingTabLinkProps) => {
  return (
    <Link
      className={cn(
        'ph-no-capture hover:border-brand-purple/80 flex h-full items-center gap-2 border-b-2 px-3 text-sm font-medium no-underline transition-colors',
        isPro ? 'text-zinc-900' : 'text-slate-500',
        isActive ? 'border-brand-purple/80' : 'border-transparent',
        isPro && isActive ? 'border-zinc-900' : 'border-transparent',
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
