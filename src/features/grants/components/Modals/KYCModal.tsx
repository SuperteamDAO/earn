'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { isGrantKycMessage } from '../../utils/kycMessages';

// Earn's KYC modal. Sumsub's SDK runs on the grant's KYC page, a document
// with its own policy, so the modal frames that page; the page reports its
// height, its errors and the verdict here.
export const KYCModal = ({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) => {
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(500);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isGrantKycMessage(event.data)
      ) {
        return;
      }
      const message = event.data;
      if (message.kind === 'height') {
        setHeight(Math.max(message.height, 200));
      } else if (message.kind === 'error') {
        toast.error(message.message);
      } else {
        toast.success(
          'Your KYC is verified! You will receive your first tranche in around a week.',
        );
        // The page loads their application again.
        router.refresh();
        onClose();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router, onClose]);

  return (
    <div className="pb-12">
      {/* Earn's own KYC page, same origin: Sumsub needs its scripts,
          cookies and the camera there, which no sandbox would leave. */}
      {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
      <iframe
        ref={frame}
        title="KYC"
        src={`/earn/grants/${slug}/kyc/?embed=1`}
        allow="camera; microphone"
        className="block w-full border-0"
        style={{ height }}
      />
    </div>
  );
};
