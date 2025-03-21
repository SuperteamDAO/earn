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
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-60 h-full bg-white shadow-xl duration-300',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          className,
        )}
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
  <div className={cn('h-full w-full max-w-2xl sm:max-w-2xl', className)}>
    {children}
  </div>
);
