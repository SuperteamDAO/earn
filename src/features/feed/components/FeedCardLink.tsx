import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { cn } from '@/utils/cn';

export const FeedCardLink = ({
  href,
  style,
  children,
}: {
  href: string | undefined;
  style?: React.HTMLAttributes<HTMLDivElement>['className'];
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        'hidden items-center gap-2 whitespace-nowrap md:flex',
        style,
      )}
    >
      <Link
        href={href ?? '#'}
        rel="noopener noreferrer"
        target="_blank"
        className="flex items-center gap-3 group-hover:underline group-hover:decoration-brand-purple group-hover:underline-offset-2"
      >
        <span className="text-sm font-medium text-brand-purple md:text-base">
          {children}
        </span>
        <ArrowRight className="h-4 w-4 text-brand-purple" />
      </Link>
    </div>
  );
};
