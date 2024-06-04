import {
  Button,
  type ButtonProps,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
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
      <Tooltip
        w="15rem"
        fontSize={'xs'}
        bg="brand.slate.500"
        hasArrow
        label={
          'Payments are automatically recorded through Airtable for this listing'
        }
        rounded="md"
      >
        <Button
          isDisabled
          {...buttonStyle}
          onClick={() => recordPaymentOnOpen()}
        >
          Record Payment
        </Button>
      </Tooltip>
    </>
  );
};
