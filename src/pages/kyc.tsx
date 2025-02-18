import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import SumsubWebSdk from '@sumsub/websdk-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';

type MessageType = Parameters<MessageHandler>[0];

type ReviewStatus =
  | 'completed'
  | 'init'
  | 'onHold'
  | 'pending'
  | 'prechecked'
  | 'queued';

const fetchVerificationStatus = async () => {
  const { data } = await api.get('/api/sumsub/verify-completion');
  return data;
};

export default function KYC() {
  const { data: accessToken, refetch } = useQuery({
    queryKey: ['sumsubToken'],
    queryFn: async () => {
      const { data } = await api.post('/api/sumsub/access-token');
      return data.token;
    },
  });

  const { data: verificationStatus, refetch: checkVerification } = useQuery({
    queryKey: ['verification-status'],
    queryFn: fetchVerificationStatus,
    enabled: false,
  });

  const config = {
    lang: 'en',
  };

  const errorHandler = (error: any) => {
    toast.error(`KYC failed: ${error.message}`);
  };

  async function onMessage(type: MessageType, payload: AnyEventPayload) {
    if (
      type === 'idCheck.onApplicantStatusChanged' &&
      'reviewStatus' in payload
    ) {
      const status = payload.reviewStatus as ReviewStatus;
      console.log({ status });
      await checkVerification();
      console.log({ verificationStatus });
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
}
