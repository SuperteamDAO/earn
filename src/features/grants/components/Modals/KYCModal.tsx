import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import SumsubWebSdk from '@sumsub/websdk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';

import { userApplicationQuery } from '../../queries/user-application';

type MessageType = Parameters<MessageHandler>[0];

const fetchVerificationStatus = async (grantApplicationId: string) => {
  const { data } = await api.get('/api/sumsub/verify-completion', {
    params: { grantApplicationId },
  });
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
      if (result.data === 'verified') {
        toast.success('KYC verified successfully!');
        await queryClient.invalidateQueries({
          queryKey: userApplicationQuery(grantId).queryKey,
        });
        onClose();
      }
    }
  }

  return (
    <div>
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
          testEnv={true}
        />
      )}
    </div>
  );
};
