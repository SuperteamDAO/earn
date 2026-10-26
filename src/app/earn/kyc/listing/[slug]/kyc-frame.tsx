'use client';

import SumsubWebSdk from '@sumsub/websdk-react';
import type {
  AnyEventPayload,
  ErrorHandler,
  MessageHandler,
} from '@sumsub/websdk/types/types';
import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { postJson } from '@/lib/fetch-json';

import {
  LISTING_KYC_MESSAGE,
  type ListingKycMessage,
} from '@/features/listings/utils/kycMessages';

type MessageType = Parameters<MessageHandler>[0];

const VERIFICATION_PENDING_ERROR = 'VERIFICATION_PENDING';

const fetchToken = async () =>
  (await postJson<{ token: string }>('/api/sumsub/access-token/')).token;

const config = { lang: 'en', theme: 'light' };

// Framed in the listing page's KYC modal, toasts and the verdict go to the
// page (Earn showed them over the listing); otherwise they show here.
const embedded = () =>
  typeof window !== 'undefined' && window.parent !== window;

const tell = (message: ListingKycMessage) =>
  window.parent.postMessage(message, window.location.origin);

const showError = (message: string) => {
  if (embedded()) tell({ type: LISTING_KYC_MESSAGE, kind: 'error', message });
  else toast.error(message);
};

const errorHandler: ErrorHandler = (error) => {
  showError(`KYC failed: ${error.error}`);
};

// Earn's KYC modal's content: Sumsub's web SDK, then the server asks Sumsub
// for the verdict and, once verified, sends the winnings for payment. The
// listing page's modal frames this page (`embed`); on its own it is a page
// with a close link back to the listing.
export function KycFrame({
  slug,
  listingHref,
  embed,
}: {
  slug: string;
  listingHref: string;
  embed: boolean;
}) {
  const verificationProcessedRef = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  // The modal sizes its frame to this.
  useEffect(() => {
    const element = root.current;
    if (!embed || !element) return undefined;
    const observer = new ResizeObserver(() =>
      tell({
        type: LISTING_KYC_MESSAGE,
        kind: 'height',
        height: element.scrollHeight,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [embed]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetchToken()
      .then((token) => {
        if (live) setAccessToken(token);
      })
      .catch(() => {
        if (live) showError('KYC failed: unable to start verification');
      })
      .finally(() => {
        if (live) setIsTokenLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const checkVerification = useCallback(
    () => postJson<unknown>(`/earn/kyc/listing/${slug}/verify/`),
    [slug],
  );

  function onMessage(type: MessageType, payload: AnyEventPayload) {
    if (
      type !== 'idCheck.onApplicantStatusChanged' ||
      !('reviewStatus' in payload) ||
      verificationProcessedRef.current
    ) {
      return;
    }

    if (embedded()) {
      // The listing page shows Earn's toasts, refreshes and closes.
      tell({ type: LISTING_KYC_MESSAGE, kind: 'checking' });
      checkVerification().then(
        (data) => {
          if (data === 'verified') {
            verificationProcessedRef.current = true;
            tell({ type: LISTING_KYC_MESSAGE, kind: 'verified' });
          } else {
            tell({ type: LISTING_KYC_MESSAGE, kind: 'pending' });
          }
        },
        () => showError('KYC verification check failed. Please try again.'),
      );
      return;
    }

    const verificationPromise = checkVerification().then((data) => {
      if (data === 'verified') {
        verificationProcessedRef.current = true;
        setTimeout(() => window.location.assign(listingHref), 2500);
        return data;
      }
      throw new Error(VERIFICATION_PENDING_ERROR);
    });

    const verificationToast = toast.promise(verificationPromise, {
      loading: 'Verifying your KYC submission...',
      success:
        'Your KYC is verified! You will receive your payment in around a week.',
      error: (error) => {
        if (
          error instanceof Error &&
          error.message === VERIFICATION_PENDING_ERROR
        ) {
          setTimeout(() => {
            if (
              typeof verificationToast === 'string' ||
              typeof verificationToast === 'number'
            ) {
              toast.dismiss(verificationToast);
            } else {
              toast.dismiss();
            }
          }, 0);
          return undefined;
        }
        return 'KYC verification check failed. Please try again.';
      },
    });
  }

  return (
    <div ref={root}>
      {!embed && (
        // Plain <a>: the listing is another document, with its own CSP.
        <a href={listingHref} aria-label="Close">
          <X className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6" />
        </a>
      )}
      {isTokenLoading && (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-slate-600" />
            <p className="text-sm text-slate-600">
              Loading KYC verification...
            </p>
          </div>
        </div>
      )}
      {accessToken && (
        <SumsubWebSdk
          accessToken={accessToken}
          expirationHandler={fetchToken}
          config={config}
          onMessage={onMessage}
          onError={errorHandler}
          testEnv={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
}
