'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

// A link inside a card that is itself a link. HTML can't nest <a>s (the
// parser splits them, and server-rendered markup then fails to hydrate),
// so the inner one is a span that navigates on its own.
export function InnerLink({
  href,
  className,
  children,
  onClick,
}: {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
  readonly onClick?: () => void;
}) {
  const router = useRouter();
  const go = (event: React.SyntheticEvent, newTab: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.();
    const external = /^https?:\/\//.test(href);
    if (newTab) window.open(href, '_blank', 'noopener');
    else if (external) window.location.assign(href);
    else router.push(href);
  };
  return (
    <span
      role="link"
      tabIndex={0}
      className={className}
      onClick={(event) => go(event, event.metaKey || event.ctrlKey)}
      onAuxClick={(event) => {
        if (event.button === 1) go(event, true);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') go(event, false);
      }}
    >
      {children}
    </span>
  );
}
