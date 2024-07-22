import { Button, type ButtonProps, useDisclosure } from '@chakra-ui/react';
import React from 'react';

import { RecordPaymentModal } from './Modals/RecordPaymentModal';

export const RecordPaymentButton = ({
  applicationId,
  buttonStyle,
  approvedAmount,
  token,
  totalPaid,
}: {
  applicationId: string;
  buttonStyle?: ButtonProps;
  approvedAmount: number;
  totalPaid: number;
  token: string;
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
      />
      <Button {...buttonStyle} onClick={() => recordPaymentOnOpen()}>
        Record Payment
      </Button>
    </>
  );
};
