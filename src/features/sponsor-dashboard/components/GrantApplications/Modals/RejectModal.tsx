import { CloseIcon } from '@chakra-ui/icons';
import {
  Button,
  Circle,
  Divider,
  Flex,
  Image,
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

import { tokenList } from '@/constants';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  token: string;
  onRejectGrant: (applicationId: string) => void;
}

export const RejectGrantApplicationModal = ({
  applicationId,
  rejectIsOpen,
  rejectOnClose,
  ask,
  granteeName,
  token,
  onRejectGrant,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      await onRejectGrant(applicationId);
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
            You are about to reject {granteeName}’s grant request. They will be
            notified via email.
          </Text>
          <br />
          <Flex align={'center'} justify="space-between" mb={8}>
            <Text color="brand.slate.500">Grant Request</Text>
            <Flex align="center">
              <Image
                boxSize="6"
                alt={`${token} icon`}
                rounded={'full'}
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              />
              <Text ml={1} color="brand.slate.500" fontWeight={600}>
                {ask} <Text as="span">{token}</Text>
              </Text>
            </Flex>
          </Flex>
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
