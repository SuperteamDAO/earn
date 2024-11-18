import { Button, type ButtonProps } from '@chakra-ui/react';
import React from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';

import { RecordPaymentModal } from './Modals/RecordPaymentModal';

export const RecordPaymentButton = ({
  applicationId,
  buttonStyle,
  approvedAmount,
  token,
  totalPaid,
  onPaymentRecorded,
}: {
  applicationId: string;
  buttonStyle?: ButtonProps;
  approvedAmount: number;
  totalPaid: number;
  token: string;
  onPaymentRecorded: (updatedApplication: any) => void;
}) => {
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
      <Button {...buttonStyle} onClick={() => recordPaymentOnOpen()}>
        Record Payment
      </Button>
    </>
  );
};
