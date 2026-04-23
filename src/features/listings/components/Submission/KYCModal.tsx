import SumsubWebSdk from '@sumsub/websdk-react';
import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { chaptersQuery } from '@/features/chapters/queries/chapters';

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
  const stageRef = useRef<'identity' | 'poa'>('identity');
  const [stage, setStage] = useState<'identity' | 'poa'>('identity');

  const shouldShowDisclaimer = useMemo(() => {
    return Boolean(region && region !== 'Global');
  }, [region]);

  const [showDisclaimer, setShowDisclaimer] = useState(shouldShowDisclaimer);
  const {
    data: accessToken,
    isLoading: isTokenLoading,
    refetch,
  } = useQuery({
    queryKey: ['sumsubToken', stage],
    queryFn: async () => {
      const endpoint =
        stage === 'poa'
          ? '/api/sumsub/poa-access-token'
          : '/api/sumsub/access-token';
      const { data } = await api.post(endpoint);
      return data.token;
    },
  });

  const { user } = useUser();

  const { refetch: checkVerification } = useQuery({
    queryKey: ['verification-status', submissionId],
    queryFn: () => fetchVerificationStatus(submissionId),
    enabled: false,
  });

  const { refetch: checkPoaVerification } = useQuery({
    queryKey: ['poa-verification-status', submissionId],
    queryFn: async () => {
      const { data } = await api.get('/api/submission/kyc/verify-poa', {
        params: { submissionId },
      });
      return data;
    },
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

      if (stageRef.current === 'identity') {
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

          if (
            typeof data === 'object' &&
            data !== null &&
            'status' in data &&
            (data as { status?: string }).status === 'poa_required'
          ) {
            stageRef.current = 'poa';
            setStage('poa');
            throw new Error(VERIFICATION_PENDING_ERROR);
          }

          if (
            typeof data === 'object' &&
            data !== null &&
            'status' in data &&
            (data as { status?: string }).status === 'region_mismatch'
          ) {
            throw new Error('REGION_MISMATCH');
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
                    Not Eligible
                  </p>
                  <p className="text-xs text-red-600">
                    {`Sorry, we couldn't verify that you are a resident of ${mismatchRegionDisplayName}. Only the residents of ${mismatchRegionDisplayName} are eligible for this reward. Please contact support@superteamearn.com if there's been a mistake.`}
                  </p>
                </div>
              );
            }

            if (
              error instanceof Error &&
              error.message === 'REGION_MISMATCH'
            ) {
              return (
                <div className="flex flex-col gap-1 text-left">
                  <p className="text-sm font-semibold text-red-600">
                    Not Eligible
                  </p>
                  <p className="text-xs text-red-600">
                    {`Sorry, we couldn't verify that you are a resident of ${regionDisplayName}. Only the residents of ${regionDisplayName} are eligible for this reward. Please contact support@superteamearn.com if there's been a mistake.`}
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
      } else {
        const poaPromise = checkPoaVerification().then(async (result) => {
          if (result.error) {
            throw result.error;
          }

          const data = result.data;

          if (
            typeof data === 'object' &&
            data !== null &&
            'status' in data &&
            (data as { status?: string }).status === 'verified'
          ) {
            verificationProcessedRef.current = true;

            await queryClient.invalidateQueries({
              queryKey: userSubmissionQuery(listingId, user?.id).queryKey,
            });
            onClose();

            return data;
          }

          if (
            typeof data === 'object' &&
            data !== null &&
            'status' in data &&
            (data as { status?: string }).status === 'ineligible'
          ) {
            throw new Error('POA_INELIGIBLE');
          }

          throw new Error(VERIFICATION_PENDING_ERROR);
        });

        toast.promise(poaPromise, {
          loading: 'Verifying your proof of address...',
          success:
            'Verified! You will receive your payment in around a week.',
          error: (error) => {
            if (
              error instanceof Error &&
              error.message === 'POA_INELIGIBLE'
            ) {
              return (
                <div className="flex flex-col gap-1 text-left">
                  <p className="text-sm font-semibold text-red-600">
                    Not Eligible
                  </p>
                  <p className="text-xs text-red-600">
                    {`Sorry, we couldn't verify that you are a resident of ${regionDisplayName}. Only the residents of ${regionDisplayName} are eligible for this reward. Please contact support@superteamearn.com if there's been a mistake.`}
                  </p>
                </div>
              );
            }

            if (
              error instanceof Error &&
              error.message === VERIFICATION_PENDING_ERROR
            ) {
              return undefined;
            }

            return 'Proof of address verification failed. Please try again.';
          },
        });
      }
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
            <div className="flex flex-col justify-between px-6 pt-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Before You Start
                </h2>
                <p className="text-base text-slate-600">
                  This reward is only open to residents of {regionDisplayName}.
                  We'll ask you to verify your identity. If your ID document
                  doesn't confirm your {regionDisplayName} residency, we'll
                  also ask for a proof of address (utility bill, bank
                  statement, or lease agreement).
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
                  key={stage}
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
