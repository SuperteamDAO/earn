import { useAtomValue } from 'jotai';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

import { listingStatusAtom } from '../../atoms';
import { type ListingStatus } from '../../types';

interface StatusBadgeProps {
  className?: string;
}

export function StatusBadge({ className }: StatusBadgeProps) {
  const status = useAtomValue(listingStatusAtom);
  const statusConfig: Record<
    ListingStatus,
    { label: string; className: string }
  > = {
    draft: {
      label: 'Draft',
      className: 'bg-slate-100 text-slate-500 hover:bg-slate-100',
    },
    published: {
      label: 'Published',
      className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50',
    },
    unpublished: {
      label: 'Unpublished',
      className: 'bg-orange-50 text-orange-600 hover:bg-orange-50',
    },
    verifying: {
      label: 'Verifying',
      className: 'bg-pink-50 text-pink-600 hover:bg-pink-50',
    },
    'payment pending': {
      label: 'Payment Pending',
      className: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-50',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-50 text-green-600 hover:bg-green-50',
    },
    'verification failed': {
      label: 'Verification Failed',
      className: 'bg-red-50 text-red-600 hover:bg-red-50',
    },
    blocked: {
      label: 'Blocked',
      className: 'bg-red-50 text-red-600 hover:bg-red-50',
    },
  };

  const config = statusConfig[status || 'draft'];

  return (
    <Badge
      variant="secondary"
      className={cn('rounded-full font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
