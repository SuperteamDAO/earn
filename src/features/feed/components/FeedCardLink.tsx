import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { cn } from '@/utils';

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
      className={
        (cn('group hidden items-center gap-2 whitespace-nowrap md:flex'), style)
      }
    >
      <Link
        href={href ?? '#'}
        rel="noopener noreferrer"
        target="_blank"
        className="flex items-center gap-3 group-hover:underline group-hover:decoration-[#6366F1] group-hover:underline-offset-2"
      >
        <span className="text-sm font-medium text-[#6366F1] md:text-base">
          {children}
        </span>
        <ArrowRight className="h-4 w-4 text-[#6366F1]" />
      </Link>
    </div>
  );
};
