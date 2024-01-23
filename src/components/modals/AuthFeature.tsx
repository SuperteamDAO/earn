import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import React from 'react';

export const AuthFeatureModal = ({
  isOpen,
  onClose,
  showCTA,
}: {
  isOpen: boolean;
  onClose: () => void;
  showCTA: boolean;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent px={4} pt={3} pb={8}>
        <ModalHeader>Introducing Email Auth</ModalHeader>
        <ModalCloseButton mt={3} />
        <ModalBody>
          Now sign-in using your email ID, and get straight to earning! Email
          will become the primary form of logging into Superteam Earn, while
          still using wallets to receive rewards.
          <br />
          <br />
          PS: Remember to log in using the email id associated with your
          existing Earn account.
          <Image px={2} py={6} alt="new feature" src="/assets/googleauth.png" />
          {showCTA && <Button w="full">Sign In</Button>}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
