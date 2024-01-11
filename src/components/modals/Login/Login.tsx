/* eslint-disable @next/next/no-img-element */
import {
  Flex,
  Image,
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
      <ModalContent w={'22rem'} h={'max'}>
        <ModalHeader>
          <Flex justify="center">
            <Image
              w={32}
              h="100%"
              alt="Superteam Earn"
              src="/assets/logo/new-logo.svg"
            />
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SignIn />
        </ModalBody>
        <ModalFooter>
          <Text color="brand.slate.400" fontSize="xs" textAlign="center">
            By using this website, you agree to our{' '}
            <Link
              as={NextLink}
              fontWeight={700}
              href={`${router.basePath}/terms-of-service.pdf`}
              isExternal
            >
              Terms of Service
            </Link>{' '}
            and our{' '}
            <Link
              as={NextLink}
              fontWeight={700}
              href={`${router.basePath}/privacy-policy.pdf`}
              isExternal
            >
              Privacy Policy
            </Link>
            .
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
