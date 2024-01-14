/* eslint-disable @next/next/no-img-element */
import {
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { SignIn } from './SignIn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}
export const Login = ({ isOpen, onClose }: Props) => {
  const router = useRouter();

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isCentered
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent w={'22rem'} h={'max'} pt={2}>
        <ModalHeader>
          <Text color="brand.slate.900" fontSize={18} textAlign={'center'}>
            You&apos;re one step away
          </Text>
          <Text
            color="brand.slate.600"
            fontSize={15}
            fontWeight={400}
            textAlign={'center'}
          >
            From earning in global standards
          </Text>
        </ModalHeader>
        <ModalCloseButton mt={4} color={'brand.slate.400'} />
        <ModalBody>
          <SignIn />
          <Text mt={4} color="brand.slate.500" fontSize="xs" textAlign="center">
            By using this website, you agree to our{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={`${router.basePath}/terms-of-service.pdf`}
              isExternal
            >
              Terms of Service
            </Link>{' '}
            and our{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={`${router.basePath}/privacy-policy.pdf`}
              isExternal
            >
              Privacy Policy
            </Link>
            .
          </Text>
        </ModalBody>
        <ModalFooter
          flexDir={'column'}
          py={'6px'}
          bg={'brand.slate.100'}
          borderBottomRadius="6px"
        >
          <Text color="brand.slate.500" fontSize="xs" textAlign="center">
            Trouble Logging in?{' '}
            <Text as="u">
              <Link
                as={NextLink}
                href={
                  'https://discord.com/channels/857091160295866388/1192795350277312662'
                }
                isExternal
              >
                Click here
              </Link>
            </Text>
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
