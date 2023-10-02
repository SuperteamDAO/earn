import { EmailIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  PinInput,
  PinInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import type { SponsorType } from '../../interface/sponsor';
import { userStore } from '../../store/user';
import { createSponsor, UpdateUser } from '../../utils/functions';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  email: string;
  sponsor: SponsorType;
  totp: Totp;
}
interface Totp {
  current: number;
  last: number;
}
export const Emailverification = ({
  onClose,
  isOpen,
  email,
  sponsor,
  totp,
}: Props) => {
  const [success, setSuccess] = useState<boolean>(false);
  const [xpin, setXpin] = useState<string>('');
  const router = useRouter();
  const { userInfo } = userStore();
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent h={'max'} py={10}>
        <ModalHeader>
          {success ? (
            ''
          ) : (
            <Text
              color={'gray.700'}
              fontFamily={'Inter'}
              fontWeight={600}
              textAlign={'center'}
            >
              Please Confirm Your Email
            </Text>
          )}
        </ModalHeader>
        {success ? '' : <ModalCloseButton />}
        {success ? (
          <ModalBody>
            <VStack>
              <Image alt={'green tick'} src={'/assets/icons/green-tick.svg'} />
              <Text
                pb={3}
                color={'gray.600'}
                fontFamily={'Inter'}
                fontWeight={600}
                textAlign={'center'}
              >
                Success
              </Text>
              <Button
                w={'full'}
                mt={10}
                color={'white'}
                bg={'#6562FF'}
                _hover={{ bg: '#6562FF' }}
                onClick={() => {
                  router.push('/dashboard/team');
                }}
              >
                Continue
              </Button>
            </VStack>
          </ModalBody>
        ) : (
          <ModalBody>
            <VStack gap={3}>
              <Flex
                align="center"
                justify="center"
                w="100px"
                h="100px"
                mt={4}
                bg="gray.50"
                borderRadius="100%"
              >
                <EmailIcon color={'gray.400'} w="24px" h="30px"></EmailIcon>
              </Flex>
              <Text
                color={'gray.600'}
                fontFamily={'Inter'}
                fontWeight={600}
                textAlign={'center'}
              >
                Enter the OTP sent on {email}
              </Text>
              <Box mt={3}>
                <PinInput
                  manageFocus
                  mask
                  onComplete={(e) => {
                    setXpin(e);
                  }}
                  type="alphanumeric"
                >
                  <PinInputField mx={2} />
                  <PinInputField mx={2} />
                  <PinInputField mx={2} />
                  <PinInputField mx={2} />
                  <PinInputField mx={2} />
                  <PinInputField mx={2} />
                </PinInput>
              </Box>
              <Button
                w={'full'}
                mt={10}
                color={'white'}
                bg={'#6562FF'}
                _hover={{ bg: '#6562FF' }}
                isDisabled={loading}
                isLoading={loading}
                onClick={async () => {
                  if (
                    totp.current === Number(xpin) ||
                    totp.last === Number(xpin)
                  ) {
                    setLoading(true);
                    toast.success('Success');
                    const a = await createSponsor(sponsor);
                    const res = await UpdateUser(userInfo?.id as string, {
                      sponsor: true,
                    });
                    console.log(a);
                    if (a.data && res) {
                      setSuccess(true);
                      setLoading(false);
                    }
                  } else {
                    toast.error('Wrong OTP');
                  }
                }}
              >
                Verify
              </Button>
              <Toaster />
            </VStack>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};
