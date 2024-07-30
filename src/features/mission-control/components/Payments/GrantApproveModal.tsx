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
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { tokenList } from '@/constants';

interface ApproveModalProps {
  approveIsOpen: boolean;
  approveOnClose: () => void;
  ask: number | undefined;
  granteeName: string | null | undefined;
  approveFn: (approvedAmount: number) => void;
}

export const GrantApproveModal = ({
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  approveFn,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAmountChange = (valueString: string) => {
    const value = parseFloat(valueString);
    if (value > (ask as number)) {
      setErrorMessage('Approved amount cannot exceed the requested amount.');
    } else {
      setErrorMessage(null);
    }
    setApprovedAmount(value);
  };

  useEffect(() => {
    setApprovedAmount(ask);
    setErrorMessage(null);
    setLoading(false);
  }, [ask]);

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

          <Flex align={'center'} justify="space-between" w="100%" mb={6}>
            <Text w="100%" color="brand.slate.500" whiteSpace={'nowrap'}>
              Approved Amount
            </Text>
            <InputGroup>
              <NumberInput
                w="100px"
                defaultValue={ask}
                max={ask}
                min={1}
                onChange={handleAmountChange}
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
          {errorMessage && (
            <Text align={'center'} color="red.500" fontSize={'sm'}>
              {errorMessage}
            </Text>
          )}

          <Button
            w="full"
            mt={2}
            mb={3}
            color="white"
            bg="#079669"
            _hover={{ bg: '#079669' }}
            isDisabled={!!errorMessage || loading || approvedAmount === 0}
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
            onClick={() => {
              if (!approvedAmount || !ask) {
                toast.error('Something went wrong');
                return;
              }
              approveFn(approvedAmount ?? ask);
            }}
          >
            Approve Grant
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
