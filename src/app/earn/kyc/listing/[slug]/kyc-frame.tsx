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

type MessageType = Parameters<MessageHandler>[0];

const VERIFICATION_PENDING_ERROR = 'VERIFICATION_PENDING';

const fetchToken = async () =>
  (await postJson<{ token: string }>('/api/sumsub/access-token/')).token;

const config = { lang: 'en', theme: 'light' };

const errorHandler: ErrorHandler = (error) => {
  toast.error(`KYC failed: ${error.error}`);
};

// Earn's KYC modal, as a page: Sumsub's web SDK, then the server asks Sumsub
// for the verdict and, once verified, sends the winnings for payment.
export function KycFrame({
  slug,
  listingHref,
}: {
  slug: string;
  listingHref: string;
}) {
  const verificationProcessedRef = useRef(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetchToken()
      .then((token) => {
        if (live) setAccessToken(token);
      })
      .catch(() => {
        if (live) toast.error('KYC failed: unable to start verification');
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
    <>
      {/* Plain <a>: the listing is another document, with its own CSP. */}
      <a href={listingHref} aria-label="Close">
        <X className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6" />
      </a>
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
    </>
  );
}
