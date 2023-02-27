import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import {
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';
interface Props {
  onClose: () => void;
  isOpen: boolean;
}
export const CreateSponsorModel = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent py={5} h={'max'}>
          <ModalHeader>
            <Text color={'gray.700'} fontWeight={600} fontFamily={'Inter'}>
              Create a Sponsor account to access the listing
            </Text>

            <VStack mt={5}>
              <Button
                w="100%"
                bg={'#6562FF'}
                color={'white'}
                fontSize="1rem"
                fontWeight={600}
                _hover={{ bg: '#6562FF' }}
                onClick={() => {
                  router.push('/sponsor/create');
                }}
              >
                Create Sponsor
              </Button>
              <Button
                w="100%"
                fontSize="1rem"
                fontWeight={600}
                color="gray.500"
                border="1px solid"
                borderColor="gray.200"
                bg="transparent"
                onClick={() => {
                  router.push('/');
                }}
              >
                Home
              </Button>
            </VStack>
          </ModalHeader>
        </ModalContent>
      </Modal>
    </>
  );
};
