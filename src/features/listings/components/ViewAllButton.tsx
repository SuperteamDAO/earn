import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';

export const ViewAllButton = ({
  posthogEvent,
  href,
}: {
  posthogEvent: string;
  href: string;
}) => {
  const posthog = usePostHog();
  return (
    <Button
      className="my-4 w-full border-slate-300 py-3 text-sm font-medium text-slate-400 sm:py-4.5 sm:text-sm"
      onClick={() => posthog.capture(posthogEvent)}
      size="sm"
      variant="outline"
      asChild
    >
      <Link className="ph-no-capture" href={href}>
        View All
        <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </Button>
  );
};
