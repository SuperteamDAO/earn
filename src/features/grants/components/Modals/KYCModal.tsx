import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import SumsubWebSdk from '@sumsub/websdk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

import { api } from '@/lib/api';

import { userApplicationQuery } from '../../queries/user-application';

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
}: {
  applicationId: string;
  grantId: string;
  onClose: () => void;
}) => {
  const { data: accessToken, refetch } = useQuery({
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

      if (result.data === 'verified') {
        toast.success(
          'Your KYC is verified! You will receive your first tranche in around a week.',
        );
        await queryClient.invalidateQueries({
          queryKey: userApplicationQuery(grantId).queryKey,
        });
        onClose();
      }
    }
  }

  return (
    <div className="pb-12">
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
    </div>
  );
};
