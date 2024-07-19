import { Button, type ButtonProps, useDisclosure } from '@chakra-ui/react';
import React from 'react';

import { RecordPaymentModal } from './Modals/RecordPaymentModal';

export const RecordPaymentButton = ({
  applicationId,
  buttonStyle,
}: {
  applicationId: string;
  buttonStyle?: ButtonProps;
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
      />
      <Button {...buttonStyle} onClick={() => recordPaymentOnOpen()}>
        Record Payment
      </Button>
    </>
  );
};
