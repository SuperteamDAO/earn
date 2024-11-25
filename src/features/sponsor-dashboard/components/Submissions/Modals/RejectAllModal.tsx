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
              ? `您即将拒绝该项目列表中所有 ${submissionIds.length}个剩余的申请。此操作无法撤销。您确定要继续吗？`
              : `您即将拒绝 ${submissionIds.length} 个申请。他们将通过电子邮件收到通知。`}
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
            loadingText=""
            onClick={rejectSubmission}
          >
            Reject Application
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
