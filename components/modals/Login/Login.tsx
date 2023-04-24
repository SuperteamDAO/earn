/* eslint-disable @next/next/no-img-element */
import {
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import type { Wallet } from '@solana/wallet-adapter-react';

import ConnectWallet from './ConnectWallet';
import NewUserInfo from './NewUserInfo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectWallet: (wallet: Wallet) => Promise<void>;
  isNewUser: boolean;
  userPublicKey: string;
  wallets: Wallet[];
}
export const Login = ({
  isOpen,
  onClose,
  onConnectWallet,
  isNewUser,
  userPublicKey,
  wallets,
}: Props) => {
  return (
    <>
      <Modal
        closeOnOverlayClick={false}
        isCentered
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent w={'22rem'} h={'max'} minH="xl">
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
            {!userPublicKey && (
              <ConnectWallet
                wallets={wallets}
                onConnectWallet={onConnectWallet}
              />
            )}
            {!!userPublicKey && !!isNewUser && (
              <NewUserInfo userPublicKey={userPublicKey} onClose={onClose} />
            )}
          </ModalBody>
          <ModalFooter>
            <Text color="brand.slate.400" fontSize="xs" textAlign="center">
              By connecting your wallet & signing up, you agree to our{' '}
              <b>Terms of Service</b> and our <b>Privacy Policy</b>.
            </Text>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
