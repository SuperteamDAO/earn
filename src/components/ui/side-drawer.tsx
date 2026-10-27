import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SideDrawer({
  isOpen,
  onClose,
  children,
  className,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={cn(
          'fixed inset-0 z-60 bg-black/80 transition-all',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        )}
        onClick={onClose}
        data-state={isOpen ? 'open' : 'closed'}
      />
      {/* react-doctor-disable-next-line react-doctor/dialog-has-accessible-name -- the name has to come from each caller's content (SubmissionDrawer, WalletDrawer, CreditDrawer, SponsorVerificationForm), which this generic shell cannot know */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-60 h-full max-w-full overflow-x-hidden bg-white shadow-xl duration-300',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          className,
        )}
        // react-doctor-disable-next-line react-doctor/prefer-html-dialog -- moving to a native <dialog> means reworking open/close, the portal overlay and the slide animations for all four drawers, which is its own change
        role="dialog"
        aria-modal="true"
        data-state={isOpen ? 'open' : 'closed'}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

export const SideDrawerContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn('h-full w-full max-w-2xl min-w-0 sm:max-w-2xl', className)}
  >
    {children}
  </div>
);
