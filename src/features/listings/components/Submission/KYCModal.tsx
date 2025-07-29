import {
  type AnyEventPayload,
  type MessageHandler,
} from '@sumsub/websdk/types/types';
import SumsubWebSdk from '@sumsub/websdk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { userSubmissionQuery } from '../../queries/user-submission-status';

type MessageType = Parameters<MessageHandler>[0];

const fetchVerificationStatus = async (submissionId: string) => {
  const { data } = await api.get('/api/submission/kyc/verify-completion', {
    params: { submissionId },
  });
  return data;
};

export const KYCModal = ({
  submissionId,
  listingId,
  onClose,
  isOpen,
}: {
  submissionId: string;
  listingId: string;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: accessToken, refetch } = useQuery({
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
        toast.success(
          'Your KYC is verified! You will receive your payment in around a week.',
        );
        await queryClient.invalidateQueries({
          queryKey: userSubmissionQuery(listingId, user?.id).queryKey,
        });
        onClose();
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
            onClick={onClose}
          />
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
