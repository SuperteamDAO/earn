import { X } from 'lucide-react';
import React from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

interface XVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'error';
}

export const XVerificationModal = ({
  isOpen,
  onClose,
  status,
}: XVerificationModalProps) => {
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="h-full">
            <div className="mx-auto flex max-w-[20rem] flex-col items-center pt-20 pb-16">
              <div className="flex gap-1.5">
                <p className="text-brand-purple font-medium">
                  Verifying your X profile
                </p>
                <div className="flex items-end gap-1 pb-[0.45rem]">
                  <span className="sr-only">Loading...</span>
                  <style>{`
                     @keyframes bigBounce {
                       0%, 100% {
                         transform: translateY(0);
                         opacity: 0.3;
                         animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                       }
                       50% {
                         transform: translateY(-100%);
                         opacity: 1;
                         animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                       }
                     }
                   `}</style>
                  <div
                    className="bg-brand-purple size-1 rounded-full"
                    style={{
                      animation: 'bigBounce 1s infinite',
                      animationDelay: '-0.3s',
                    }}
                  ></div>
                  <div
                    className="bg-brand-purple size-1 rounded-full"
                    style={{
                      animation: 'bigBounce 1s infinite',
                      animationDelay: '-0.15s',
                    }}
                  ></div>
                  <div
                    className="bg-brand-purple size-1 rounded-full"
                    style={{
                      animation: 'bigBounce 1s infinite',
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="bg-slate-50 py-2 text-center text-xs font-medium text-slate-500">
              X verification is open in a different tab
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="flex h-full flex-col">
            <div className="pt-12">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-red-50 p-6">
                  <div className="rounded-full bg-red-600 p-2.5">
                    <X className="size-7 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-[24rem] flex-col items-center gap-1 pb-12">
                <p className="mt-6 font-medium text-slate-900">
                  Uh-Oh Verification Failed
                </p>
                <p className="text-center text-sm text-slate-500">
                  We couldn&apos;t verify your twitter account. <br /> Please
                  try again to make your submission.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (status === 'loading' && !open) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal>
      <DialogContent
        className="m-0 max-w-md rounded-none p-0 sm:rounded-none"
        hideCloseIcon
      >
        <div>{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
