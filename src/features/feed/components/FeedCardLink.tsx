import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { useExternalLinkDialog } from '@/components/shared/ExternalLinkDialogProvider';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

export const FeedCardLink = ({
  href,
  linkStyle,
  children,
}: {
  href: string | undefined;
  // Classes for the wrapper (Earn called this prop `style`).
  linkStyle?: React.HTMLAttributes<HTMLDivElement>['className'];
  children: ReactNode;
}) => {
  const { handleExternalLinkClick } = useExternalLinkDialog();
  const sanitizedHref = getURLSanitized(href ?? '#');

  return (
    <div
      className={cn(
        'group-hover:underline-none flex items-center gap-2 whitespace-nowrap',
        linkStyle,
      )}
    >
      <Link
        href={sanitizedHref}
        rel="noopener noreferrer"
        target="_blank"
        className="hover:decoration-brand-purple flex items-center gap-3 hover:underline hover:underline-offset-2"
        onClick={(event) => handleExternalLinkClick(event, sanitizedHref)}
      >
        <span className="text-brand-purple text-xs font-medium md:text-base">
          {children}
        </span>
        <ArrowRight className="text-brand-purple hidden h-4 w-4 sm:block" />
      </Link>
    </div>
  );
};
