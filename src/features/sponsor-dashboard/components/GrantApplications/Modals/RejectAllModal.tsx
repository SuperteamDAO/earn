import { CloseIcon } from '@chakra-ui/icons';
import {
  Button,
  Circle,
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from '@chakra-ui/react';
import React, { useState } from 'react';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  applicationIds: string[];
  onRejectGrant: (applicationId: string[]) => void;
}

export const RejectAllGrantApplicationModal = ({
  rejectIsOpen,
  rejectOnClose,
  onRejectGrant,
  applicationIds,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    setLoading(true);
    try {
      await onRejectGrant(applicationIds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  return (
    <Modal isOpen={rejectIsOpen} onClose={rejectOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={'brand.slate.500'} fontSize={'md'} fontWeight={600}>
          Reject Grant Payment
        </ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody fontSize={'0.95rem'} fontWeight={500}>
          <Text mt={3} color="brand.slate.500">
            You are about to reject {applicationIds.length} grant request. They
            will be notified via email.
          </Text>
          <br />
          <Button
            w="full"
            mb={3}
            color="white"
            bg="#E11D48"
            _hover={{ bg: '#E11D48' }}
            isLoading={loading}
            leftIcon={
              loading ? (
                <Spinner color="#E11D48" size="sm" />
              ) : (
                <Circle p={'5px'} bg="#FFF">
                  <CloseIcon color="#E11D48" boxSize="2.5" />
                </Circle>
              )
            }
            loadingText="Rejecting"
            onClick={rejectGrant}
          >
            Reject Grant
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
