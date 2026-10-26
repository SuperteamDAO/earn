'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { isListingKycMessage } from '../../utils/kycMessages';

// Earn's submission KYC modal. Sumsub's SDK runs on the listing's KYC page,
// a document with its own policy, so the modal frames that page; the page
// reports its height, its errors and the verdict here, and the toasts show
// over the listing as they did.
export const KYCModal = ({
  slug,
  onClose,
  isOpen,
}: {
  slug: string;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(400);
  const checking = useRef<string | number | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isListingKycMessage(event.data)
      ) {
        return;
      }
      const message = event.data;
      const id = checking.current;
      switch (message.kind) {
        case 'height':
          setHeight(Math.max(message.height, 200));
          return;
        case 'checking':
          checking.current = toast.loading('Verifying your KYC submission...');
          return;
        case 'pending':
          // No verdict yet: Earn dropped the toast quietly.
          if (id !== null) toast.dismiss(id);
          checking.current = null;
          return;
        case 'error':
          toast.error(message.message, id !== null ? { id } : undefined);
          checking.current = null;
          return;
        case 'verified':
          toast.success(
            'Your KYC is verified! You will receive your payment in around a week.',
            id !== null ? { id } : undefined,
          );
          checking.current = null;
          // The page loads their entry again.
          router.refresh();
          onClose();
          return;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router, onClose]);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        hideCloseIcon
        className="!max-h-none max-w-xl overflow-hidden !overflow-y-visible p-0 pb-6"
        ref={modalRef}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <ScrollArea className="h-full max-h-[100svh] md:h-auto md:max-h-[90svh]">
          <X
            className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6"
            onClick={onClose}
          />
          {/* Earn's own KYC page, same origin: Sumsub needs its scripts,
              cookies and the camera there, which no sandbox would leave. */}
          {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
          <iframe
            ref={frame}
            title="KYC"
            src={`/earn/kyc/listing/${slug}/?embed=1`}
            allow="camera; microphone"
            className="block w-full border-0"
            style={{ height }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
