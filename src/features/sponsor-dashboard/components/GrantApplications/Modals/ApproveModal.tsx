import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import {
  Button,
  Circle,
  Divider,
  Flex,
  Image,
  InputGroup,
  InputRightAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { GrantApplicationStatus } from '@prisma/client';
import axios from 'axios';
import React, { type Dispatch, type SetStateAction, useState } from 'react';

import { tokenList } from '@/constants';
import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard';

interface ApproveModalProps {
  approveIsOpen: boolean;
  approveOnClose: () => void;
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  setApplications: Dispatch<SetStateAction<GrantApplicationWithUser[]>>;
  applications: GrantApplicationWithUser[];
  setSelectedApplication: Dispatch<
    SetStateAction<GrantApplicationWithUser | undefined>
  >;
}

export const ApproveModal = ({
  applicationId,
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  setApplications,
  applications,
  setSelectedApplication,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [loading, setLoading] = useState<boolean>(false);

  const approveGrant = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/grantApplication/updateApplicationStatus`, {
        id: applicationId,
        applicationStatus: 'Approved',
        approvedAmount,
      });

      const updatedApplications = applications.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              applicationStatus: GrantApplicationStatus.Approved,
              approvedAmount: approvedAmount as number,
            }
          : application,
      );

      setApplications(updatedApplications);
      const updatedApplication = updatedApplications.find(
        (application) => application.id === applicationId,
      );
      setSelectedApplication(updatedApplication);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      approveOnClose();
    }
  };

  return (
    <Modal isOpen={approveIsOpen} onClose={approveOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={'brand.slate.500'} fontSize={'md'} fontWeight={600}>
          Approve Grant Payment
        </ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody fontSize={'0.95rem'} fontWeight={500}>
          <Text mt={3} color="brand.slate.500">
            You are about to approve {granteeName}’s grant request. They will be
            notified via email.
          </Text>
          <br />
          <Flex align={'center'} justify="space-between" mb={6}>
            <Text color="brand.slate.500">Grant Request</Text>
            <Flex align="center">
              <Image
                boxSize="5"
                alt={`USDC icon`}
                src={
                  tokenList.find((t) => t.tokenSymbol === 'USDC')?.icon || ''
                }
              />
              <Text ml={1} color="brand.slate.600" fontWeight={600}>
                {ask}{' '}
                <Text as="span" color="brand.slate.400">
                  USDC
                </Text>
              </Text>
            </Flex>
          </Flex>

          <Flex align={'center'} justify="space-between" w="100%" mb={8}>
            <Text w="100%" color="brand.slate.500" whiteSpace={'nowrap'}>
              Approved Amount
            </Text>
            <InputGroup>
              <NumberInput
                w="100px"
                defaultValue={ask}
                max={ask}
                min={0}
                onChange={(valueString) =>
                  setApprovedAmount(parseFloat(valueString))
                }
                step={100}
              >
                <NumberInputField
                  color="brand.slate.600"
                  fontWeight={600}
                  borderRightRadius={2}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper border="none">
                    <ChevronUpIcon />
                  </NumberIncrementStepper>
                  <NumberDecrementStepper border="none">
                    <ChevronDownIcon />
                  </NumberDecrementStepper>
                </NumberInputStepper>
              </NumberInput>
              <InputRightAddon
                color="brand.slate.400"
                fontSize={'0.95rem'}
                bgColor="white"
              >
                <Image
                  boxSize="5"
                  mr={1}
                  alt={`USDC icon`}
                  src={
                    tokenList.find((t) => t.tokenSymbol === 'USDC')?.icon || ''
                  }
                />
                USDC
              </InputRightAddon>
            </InputGroup>
          </Flex>

          <Button
            w="full"
            mb={3}
            color="white"
            bg="#079669"
            _hover={{ bg: '#079669' }}
            isLoading={loading}
            leftIcon={
              loading ? (
                <Spinner color="white" size="sm" />
              ) : (
                <Circle p={'5px'} bg="#FFF">
                  <CheckIcon color="#079669" boxSize="2.5" />
                </Circle>
              )
            }
            loadingText="Approving"
            onClick={approveGrant}
          >
            Approve Grant
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
