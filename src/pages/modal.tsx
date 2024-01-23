import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import React from 'react';

export default function ModalPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button onClick={onOpen}>Open Modal</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent px={4} pt={3} pb={8}>
          <ModalHeader>Introducing Email Auth</ModalHeader>
          <ModalCloseButton mt={3} />
          <ModalBody>
            Now sign-in using your email ID, and get straight to earning! Email
            will become the primary form of verifying your email and logging
            into Superteam Earn, while still using wallets to receive rewards.
            <Image
              px={2}
              py={6}
              alt="new feature"
              src="/assets/googleauth.png"
            />
            Happy Earning :)
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
