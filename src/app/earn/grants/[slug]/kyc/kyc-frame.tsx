'use client';

import SumsubWebSdk from '@sumsub/websdk-react';
import type {
  AnyEventPayload,
  ErrorHandler,
  MessageHandler,
} from '@sumsub/websdk/types/types';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { postJson, RequestError } from '@/lib/fetch-json';

import {
  GRANT_KYC_MESSAGE,
  type GrantKycMessage,
} from '@/features/grants/utils/kycMessages';

type MessageType = Parameters<MessageHandler>[0];

const fetchToken = async () =>
  (await postJson<{ token: string }>('/api/sumsub/access-token/')).token;

const config = { lang: 'en', theme: 'light' };

// Framed in the grant page's KYC modal, toasts and the verdict go to the
// page (Earn showed them over the grant page); otherwise they show here.
const embedded = () =>
  typeof window !== 'undefined' && window.parent !== window;

const tell = (message: GrantKycMessage) =>
  window.parent.postMessage(message, window.location.origin);

const showError = (message: string) => {
  if (embedded()) tell({ type: GRANT_KYC_MESSAGE, kind: 'error', message });
  else toast.error(message);
};

const errorHandler: ErrorHandler = (error) => {
  showError(`KYC failed: ${error.error}`);
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

// Earn's grant KYC modal's content: Sumsub's web SDK; once Sumsub has a
// verdict the server records the KYC and the first tranche. The grant
// page's modal frames this page (`embed`); on its own it is a page with a
// close link back to the grant.
export function KycFrame({
  slug,
  applicationId,
  grantHref,
  embed,
}: {
  slug: string;
  applicationId: string;
  grantHref: string;
  embed: boolean;
}) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // The modal sizes its frame to this.
  useEffect(() => {
    const element = root.current;
    if (!embed || !element) return undefined;
    const observer = new ResizeObserver(() =>
      tell({
        type: GRANT_KYC_MESSAGE,
        kind: 'height',
        height: element.scrollHeight,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [embed]);

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
      showError(
        kycRejectionReason(error) ??
          'KYC verification check failed. Please try again.',
      );
      return;
    }
    if (result === 'verified') {
      if (embedded()) {
        tell({ type: GRANT_KYC_MESSAGE, kind: 'verified' });
        return;
      }
      toast.success(
        'Your KYC is verified! You will receive your first tranche in around a week.',
      );
      // The grant page is another document (its own CSP).
      window.location.assign(grantHref);
    }
  }

  return (
    <div ref={root} className={embed ? undefined : 'pb-12'}>
      {!embed && (
        // Plain <a>: the grant page is another document.
        <a href={grantHref} aria-label="Close">
          <X className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6" />
        </a>
      )}
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
