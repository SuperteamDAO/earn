import { useSession } from 'next-auth/react';
import React from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

import { getColorStyles } from '@/features/listings/utils/getColorStyles';

interface ListingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListingStatusModal = ({
  isOpen,
  onClose,
}: ListingStatusModalProps) => {
  const { data: session } = useSession();
  const isGod = session?.user?.role === 'GOD';
  const statusGuide = [
    {
      status: 'Draft',
      description:
        'The sponsor has created the listing, but it is not yet published.',
    },
    {
      status: 'In Progress',
      description: 'The listing is published and accepting submissions.',
    },
    {
      status: 'In Review',
      description:
        'The submission deadline has passed, and the sponsor is reviewing submissions.',
    },
    {
      status: 'Payment Pending',
      description:
        'The sponsor has selected recipient(s), but payment or verification is pending.',
    },
    {
      status: 'Completed',
      description:
        'The sponsor processed and verified payment to the recipient(s).',
    },
  ];
  if (isGod) {
    statusGuide.push({
      status: 'Deleted',
      description: 'The listing has been hidden from the platform.',
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
          Listing Status Guide
        </DialogTitle>
        <div className="flex flex-col">
          {statusGuide.map((item) => {
            const colorStyles = getColorStyles(item.status);

            return (
              <React.Fragment key={item.status}>
                <div className="grid grid-cols-[160px_1fr] items-start py-3">
                  <div
                    className={cn(
                      'inline-flex h-fit w-fit items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
                      colorStyles.color,
                      colorStyles.bgColor,
                    )}
                  >
                    {item.status}
                  </div>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="h-[1px] w-full bg-slate-200 last:hidden" />
              </React.Fragment>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
