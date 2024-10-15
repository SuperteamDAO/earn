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
  submissionIds: string[];
  onRejectSubmission: (submissionId: string[]) => void;
  allSubmissionsLength: number;
}

export const RejectAllSubmissionModal = ({
  rejectIsOpen,
  rejectOnClose,
  onRejectSubmission,
  submissionIds,
  allSubmissionsLength,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectSubmission = async () => {
    setLoading(true);
    try {
      await onRejectSubmission(submissionIds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  const rejectingAll = submissionIds.length === allSubmissionsLength;

  return (
    <Modal isOpen={rejectIsOpen} onClose={rejectOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={'brand.slate.500'} fontSize={'md'} fontWeight={600}>
          {rejectingAll
            ? 'Reject All Remaining Applications?'
            : 'Reject Application'}
        </ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody fontSize={'0.95rem'} fontWeight={500}>
          <Text mt={3} color="brand.slate.500">
            {rejectingAll
              ? `You are about to reject all ${submissionIds.length} of the remaining applications for this Project lsiting. This action cannot be undone. Are you sure you want to proceed?`
              : `You are about to reject ${submissionIds.length} application.
            They will be notified via email.`}
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
            onClick={rejectSubmission}
          >
            Reject Application
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
