import React from 'react';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/utils/cn';

import { RecordPaymentModal } from './Modals/RecordPaymentModal';

interface RecordPaymentButtonProps {
  applicationId: string;
  className?: string;
  approvedAmount: number;
  totalPaid: number;
  token: string;
  onPaymentRecorded: (updatedApplication: any) => void;
}

export const RecordPaymentButton = ({
  applicationId,
  className,
  approvedAmount,
  token,
  totalPaid,
  onPaymentRecorded,
}: RecordPaymentButtonProps) => {
  const {
    isOpen: recordPaymentIsOpen,
    onOpen: recordPaymentOnOpen,
    onClose: recordPaymentOnClose,
  } = useDisclosure();

  return (
    <>
      <RecordPaymentModal
        applicationId={applicationId}
        recordPaymentIsOpen={recordPaymentIsOpen}
        recordPaymentOnClose={recordPaymentOnClose}
        approvedAmount={approvedAmount}
        totalPaid={totalPaid}
        token={token}
        onPaymentRecorded={onPaymentRecorded}
      />
      <Button
        className={cn('bg-brand-purple text-sm', className)}
        onClick={() => recordPaymentOnOpen()}
      >
        Record Payment
      </Button>
    </>
  );
};
