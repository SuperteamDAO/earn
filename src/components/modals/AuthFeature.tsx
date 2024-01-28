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
import React, { useState } from 'react';

import { LoginWrapper } from '../Header/LoginWrapper';

export const AuthFeatureModal = ({
  isOpen,
  onClose,
  showCTA,
}: {
  isOpen: boolean;
  onClose: () => void;
  showCTA: boolean;
}) => {
  const [triggerLogin, setTriggerLogin] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'xs', md: 'lg' }}>
      <LoginWrapper
        triggerLogin={triggerLogin}
        setTriggerLogin={setTriggerLogin}
      />
      <ModalOverlay />
      <ModalContent
        px={{ base: 1, md: 4 }}
        pt={{ base: 1, md: 3 }}
        pb={{ base: 3, md: 8 }}
      >
        <ModalHeader>Introducing Email Auth</ModalHeader>
        <ModalCloseButton mt={{ base: 2, md: 3 }} />
        <ModalBody fontSize={{ base: 14, md: 16 }}>
          Now sign-in using your email ID, and get straight to earning! Email
          will become the primary form of logging into Superteam Earn, while
          still using wallets to receive rewards.
          <br />
          <br />
          PS: Remember to log in using the email id associated with your
          existing Earn account.
          <Image
            w="996px"
            h="1054px"
            px={2}
            py={{ base: 1, md: 6 }}
            alt="new feature"
            aspectRatio={996 / 1054}
            src="/assets/googleauth.webp"
          />
          {showCTA && (
            <Button w="full" onClick={() => setTriggerLogin(true)}>
              Sign In
            </Button>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
