import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import SumsubWebSdk from '@sumsub/websdk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { getCombinedRegion } from '../../utils/region';

type MessageType = Parameters<MessageHandler>[0];

const fetchVerificationStatus = async (submissionId: string) => {
  const { data } = await api.get('/api/submission/kyc/verify-completion', {
    params: { submissionId },
  });
  return data;
};

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
    responseData.message === 'KYC_REJECTED'
  ) {
    if (
      'regionDisplayName' in responseData &&
      typeof responseData.regionDisplayName === 'string'
    ) {
      return responseData.regionDisplayName;
    }

    return fallback;
  }

  return null;
};

export const KYCModal = ({
  submissionId,
  listingId,
  onClose,
  isOpen,
  region,
}: {
  submissionId: string;
  listingId: string;
  onClose: () => void;
  isOpen: boolean;
  region?: string;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const verificationProcessedRef = useRef(false);

  const shouldShowDisclaimer = useMemo(() => {
    return Boolean(region && region !== 'Global');
  }, [region]);

  const [showDisclaimer, setShowDisclaimer] = useState(shouldShowDisclaimer);

  useEffect(() => {
    if (isOpen) {
      setShowDisclaimer(shouldShowDisclaimer);
    }
  }, [isOpen, shouldShowDisclaimer]);

  const {
    data: accessToken,
    isLoading: isTokenLoading,
    refetch,
  } = useQuery({
    queryKey: ['sumsubToken'],
    queryFn: async () => {
      const { data } = await api.post('/api/sumsub/access-token');
      return data.token;
    },
  });

  const { user } = useUser();

  const { refetch: checkVerification } = useQuery({
    queryKey: ['verification-status', submissionId],
    queryFn: () => fetchVerificationStatus(submissionId),
    enabled: false,
  });

  const queryClient = useQueryClient();

  const regionDisplayName = useMemo(() => {
    if (!region || region === 'Global') {
      return 'the geo-locked country';
    }
    const regionObject = getCombinedRegion(region);
    return regionObject?.displayValue || regionObject?.name || region;
  }, [region]);

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

        const data = result.data;

        if (
          data === 'verified' ||
          (typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            (data as { message?: string }).message === 'KYC already verified')
        ) {
          verificationProcessedRef.current = true;

          await queryClient.invalidateQueries({
            queryKey: userSubmissionQuery(listingId, user?.id).queryKey,
          });
          onClose();

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
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
            onClick={handleClose}
          />
          {showDisclaimer ? (
            <div className="flex min-h-[400px] flex-col justify-between p-8">
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Disclaimer
                </h2>
                <p className="text-base text-slate-600">
                  Keep your physical KYC documents from {regionDisplayName}{' '}
                  ready to complete KYC.
                </p>
              </div>
              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
