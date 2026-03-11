import SumsubWebSdk from '@sumsub/websdk-react';
import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

import { chaptersQuery } from '@/features/chapters/queries/chapters';
import { getCombinedRegion } from '@/features/listings/utils/region';

import { userApplicationQuery } from '../../queries/user-application';

type MessageType = Parameters<MessageHandler>[0];
const VERIFICATION_PENDING_ERROR = 'VERIFICATION_PENDING';

const getMismatchRegionDisplayName = (
  error: unknown,
  fallback: string,
): string | null => {
  if (!isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;

  if (
    responseData &&
    typeof responseData === 'object' &&
    'message' in responseData &&
    responseData.message === 'KYC_REJECTED' &&
    'regionDisplayName' in responseData &&
    typeof responseData.regionDisplayName === 'string'
  ) {
    return responseData.regionDisplayName || fallback;
  }

  return null;
};

const getKycRejectionReason = (error: unknown): string | null => {
  if (!isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;

  if (
    responseData &&
    typeof responseData === 'object' &&
    'message' in responseData &&
    responseData.message === 'KYC_REJECTED' &&
    'error' in responseData &&
    typeof responseData.error === 'string'
  ) {
    return responseData.error;
  }

  return null;
};

const fetchVerificationStatus = async (grantApplicationId: string) => {
  const { data } = await api.get(
    '/api/grant-application/kyc/verify-completion',
    {
      params: { grantApplicationId },
    },
  );
  return data;
};

export const KYCModal = ({
  applicationId,
  grantId,
  onClose,
  region,
}: {
  applicationId: string;
  grantId: string;
  onClose: () => void;
  region?: string;
}) => {
  const verificationProcessedRef = useRef(false);
  const shouldShowDisclaimer = useMemo(() => {
    return Boolean(region && region !== 'Global');
  }, [region]);
  const [showDisclaimer, setShowDisclaimer] = useState(shouldShowDisclaimer);

  const {
    data: accessToken,
    refetch,
    isLoading: isTokenLoading,
  } = useQuery({
    queryKey: ['sumsubToken'],
    queryFn: async () => {
      const { data } = await api.post('/api/sumsub/access-token');
      return data.token;
    },
  });

  const { refetch: checkVerification } = useQuery({
    queryKey: ['verification-status', applicationId],
    queryFn: () => fetchVerificationStatus(applicationId),
    enabled: false,
  });

  const queryClient = useQueryClient();
  const { data: chapters = [] } = useQuery(chaptersQuery);

  const regionDisplayName = useMemo(() => {
    if (!region || region === 'Global') {
      return 'the geo-locked country';
    }

    const regionObject = getCombinedRegion(region, false, chapters);
    return regionObject?.displayValue || regionObject?.name || region;
  }, [chapters, region]);

  const config = {
    lang: 'en',
    theme: 'light',
  };

  const errorHandler = (error: any) => {
    toast.error(`KYC failed: ${error.message}`);
  };

  async function onMessage(type: MessageType, payload: AnyEventPayload) {
    if (
      type === 'idCheck.onApplicantStatusChanged' &&
      'reviewStatus' in payload
    ) {
      if (verificationProcessedRef.current) {
        return;
      }

      const verificationPromise = checkVerification().then(async (result) => {
        if (result.error) {
          throw result.error;
        }

        if (result.data === 'verified') {
          verificationProcessedRef.current = true;

          await queryClient.invalidateQueries({
            queryKey: userApplicationQuery(grantId).queryKey,
          });
          onClose();

          return result.data;
        }

        throw new Error(VERIFICATION_PENDING_ERROR);
      });

      const verificationToast = toast.promise(verificationPromise, {
        loading: 'Verifying your KYC submission...',
        success:
          'Your KYC is verified! You will receive your first tranche in around a week.',
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

          const mismatchRegionDisplayName = getMismatchRegionDisplayName(
            error,
            regionDisplayName,
          );

          if (mismatchRegionDisplayName) {
            return (
              <div className="flex flex-col gap-1 text-left">
                <p className="text-sm font-semibold text-red-600">
                  KYC Rejected
                </p>
                <p className="text-xs text-red-600">
                  {`Your KYC document doesn't belong to ${mismatchRegionDisplayName}. Please verify again with a KYC document that belongs to ${mismatchRegionDisplayName}.`}
                </p>
              </div>
            );
          }

          const kycRejectionReason = getKycRejectionReason(error);

          if (kycRejectionReason) {
            return (
              <div className="flex flex-col gap-1 text-left">
                <p className="text-sm font-semibold text-red-600">
                  KYC Rejected
                </p>
                <p className="text-xs text-red-600">{kycRejectionReason}</p>
              </div>
            );
          }

          return 'KYC verification check failed. Please try again.';
        },
      });
    }
  }

  const handleContinue = () => {
    setShowDisclaimer(false);
  };

  const handleClose = () => {
    setShowDisclaimer(shouldShowDisclaimer);
    onClose();
  };

  return (
    <div className="pb-12">
      {showDisclaimer ? (
        <div className="flex flex-col justify-between px-6 pt-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Disclaimer</h2>
            <p className="text-base text-slate-600">
              Keep your physical KYC documents from {regionDisplayName} ready to
              complete KYC.
            </p>
          </div>
          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <>
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
              expirationHandler={async () => {
                const result = await refetch();
                return result.data;
              }}
              config={config}
              onMessage={onMessage}
              onError={errorHandler}
              testEnv={process.env.NODE_ENV === 'development'}
            />
          )}
        </>
      )}
    </div>
  );
};
