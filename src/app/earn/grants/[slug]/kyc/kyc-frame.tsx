'use client';

import SumsubWebSdk from '@sumsub/websdk-react';
import type {
  AnyEventPayload,
  ErrorHandler,
  MessageHandler,
} from '@sumsub/websdk/types/types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { postJson, RequestError } from '@/lib/fetch-json';

type MessageType = Parameters<MessageHandler>[0];

const fetchToken = async () =>
  (await postJson<{ token: string }>('/api/sumsub/access-token/')).token;

const config = { lang: 'en', theme: 'light' };

const errorHandler: ErrorHandler = (error) => {
  toast.error(`KYC failed: ${error.error}`);
};

const kycRejectionReason = (error: unknown): string | null => {
  if (!(error instanceof RequestError)) return null;
  const body = error.body;
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    body.message === 'KYC_REJECTED' &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error;
  }
  return null;
};

// Earn's grant KYC modal, as a page: Sumsub's web SDK; once Sumsub has a
// verdict the server records the KYC and the first tranche.
export function KycFrame({
  slug,
  applicationId,
  grantHref,
}: {
  slug: string;
  applicationId: string;
  grantHref: string;
}) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchToken()
      .then((token) => {
        if (live) setAccessToken(token);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  async function onMessage(type: MessageType, payload: AnyEventPayload) {
    if (
      type !== 'idCheck.onApplicantStatusChanged' ||
      !('reviewStatus' in payload)
    ) {
      return;
    }
    let result: unknown;
    try {
      result = await postJson<unknown>(`/earn/grants/${slug}/kyc/verify/`, {
        applicationId,
      });
    } catch (error) {
      toast.error(
        kycRejectionReason(error) ??
          'KYC verification check failed. Please try again.',
      );
      return;
    }
    if (result === 'verified') {
      toast.success(
        'Your KYC is verified! You will receive your first tranche in around a week.',
      );
      // The grant page is another document (its own CSP).
      window.location.assign(grantHref);
    }
  }

  return (
    <div className="pb-12">
      {/* Plain <a>: the grant page is another document. */}
      <a href={grantHref} aria-label="Close">
        <X className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6" />
      </a>
      {accessToken && (
        <SumsubWebSdk
          accessToken={accessToken}
          expirationHandler={fetchToken}
          config={config}
          onMessage={(type: MessageType, payload: AnyEventPayload) => {
            void onMessage(type, payload);
          }}
          onError={errorHandler}
          testEnv={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
}
