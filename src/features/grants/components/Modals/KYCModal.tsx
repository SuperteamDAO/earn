import SumsubWebSdk from '@sumsub/websdk-react';
import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

import { chaptersQuery } from '@/features/chapters/queries/chapters';

import { userApplicationQuery } from '../../queries/user-application';
import { getCombinedRegion } from '../../../listings/utils/region';

type MessageType = Parameters<MessageHandler>[0];

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
  const stageRef = useRef<'identity' | 'poa'>('identity');
  const [stage, setStage] = useState<'identity' | 'poa'>('identity');

  const shouldShowDisclaimer = useMemo(() => {
    return Boolean(region && region !== 'Global');
  }, [region]);

  const [showDisclaimer, setShowDisclaimer] = useState(shouldShowDisclaimer);

  const { data: chapters = [] } = useQuery(chaptersQuery);

  const regionDisplayName = useMemo(() => {
    if (!region || region === 'Global') return 'the required region';
    const regionObject = getCombinedRegion(region, false, chapters);
    return regionObject?.displayValue || regionObject?.name || region;
  }, [region, chapters]);

  const { data: accessToken, refetch } = useQuery({
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

  const { refetch: checkVerification } = useQuery({
    queryKey: ['verification-status', applicationId],
    queryFn: () => fetchVerificationStatus(applicationId),
    enabled: false,
  });

  const { refetch: checkPoaVerification } = useQuery({
    queryKey: ['poa-verification-status', applicationId],
    queryFn: async () => {
      const { data } = await api.get(
        '/api/grant-application/kyc/verify-poa',
        { params: { grantApplicationId: applicationId } },
      );
      return data;
    },
    enabled: false,
  });

  const queryClient = useQueryClient();

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
        const result = await checkVerification();
        if (result.error) {
          const kycRejectionReason = getKycRejectionReason(result.error);
          if (kycRejectionReason) {
            toast.error(kycRejectionReason);
          } else {
            toast.error('KYC verification check failed. Please try again.');
          }
          return;
        }

        if (
          result.data === 'verified' ||
          (typeof result.data === 'object' &&
            result.data !== null &&
            'message' in result.data &&
            (result.data as { message?: string }).message ===
              'KYC already verified')
        ) {
          verificationProcessedRef.current = true;
          toast.success(
            'Your KYC is verified! You will receive your first tranche in around a week.',
          );
          await queryClient.invalidateQueries({
            queryKey: userApplicationQuery(grantId).queryKey,
          });
          onClose();
          return;
        }

        if (
          typeof result.data === 'object' &&
          result.data !== null &&
          'status' in result.data &&
          (result.data as { status?: string }).status === 'poa_required'
        ) {
          stageRef.current = 'poa';
          setStage('poa');
          return;
        }

        if (
          typeof result.data === 'object' &&
          result.data !== null &&
          'status' in result.data &&
          (result.data as { status?: string }).status === 'region_mismatch'
        ) {
          toast.error(
            `Sorry, we couldn't verify that you are a resident of ${regionDisplayName}. Only the residents of ${regionDisplayName} are eligible for this reward. Please contact support@superteamearn.com if there's been a mistake.`,
          );
          return;
        }
      } else {
        const result = await checkPoaVerification();
        if (result.error) {
          toast.error('Proof of address verification failed. Please try again.');
          return;
        }

        const data = result.data;

        if (
          typeof data === 'object' &&
          data !== null &&
          'status' in data &&
          (data as { status?: string }).status === 'verified'
        ) {
          verificationProcessedRef.current = true;
          toast.success(
            'Verified! You will receive your first tranche in around a week.',
          );
          await queryClient.invalidateQueries({
            queryKey: userApplicationQuery(grantId).queryKey,
          });
          onClose();
          return;
        }

        if (
          typeof data === 'object' &&
          data !== null &&
          'status' in data &&
          (data as { status?: string }).status === 'ineligible'
        ) {
          toast.error(
            `Sorry, we couldn't verify that you are a resident of ${regionDisplayName}. Only the residents of ${regionDisplayName} are eligible for this reward. Please contact support@superteamearn.com if there's been a mistake.`,
          );
        }
      }
    }
  }

  const handleContinue = () => setShowDisclaimer(false);
  const handleClose = () => {
    setShowDisclaimer(shouldShowDisclaimer);
    onClose();
  };

  return (
    <div className="pb-12">
      {showDisclaimer ? (
        <div className="flex flex-col justify-between px-6 pt-6">
          <X
            className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400"
            onClick={handleClose}
          />
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Before You Start
            </h2>
            <p className="text-base text-slate-600">
              This grant is only open to residents of {regionDisplayName}.
              We'll ask you to verify your identity. If your ID document
              doesn't confirm your {regionDisplayName} residency, we'll also
              ask for a proof of address (utility bill, bank statement, or
              lease agreement).
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
    </div>
  );
};
