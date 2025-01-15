import React from 'react';
import { createPortal } from 'react-dom';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SideDrawer({
  open,
  onClose,
  children,
  className,
}: DrawerProps) {
  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/80 transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`}
        onClick={onClose}
        data-state={open ? 'open' : 'closed'}
      />
      <div
        className={`fixed inset-y-0 right-0 z-[60] h-full bg-white shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right ${className}`}
        role="dialog"
        aria-modal="true"
        data-state={open ? 'open' : 'closed'}
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
    className={`h-full w-full max-w-2xl px-2 sm:max-w-2xl sm:p-4 ${className}`}
  >
    {children}
  </div>
);
