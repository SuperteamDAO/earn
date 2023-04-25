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
import { useEffect, useState } from 'react';

import type { User } from '@/interface/user';

import ConnectWallet from './ConnectWallet';
import NewUserInfo from './NewUserInfo';
import VerifyOtp from './VerifyOtp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectWallet: (wallet: Wallet) => Promise<void>;
  userInfo: User | null;
  setUserInfo: (userInfo: User) => void;
  wallets: Wallet[];
  initialStep?: number;
}
export const Login = ({
  isOpen,
  onClose,
  onConnectWallet,
  userInfo,
  setUserInfo,
  wallets,
  initialStep = 1,
}: Props) => {
  const [step, setStep] = useState(initialStep);
  const [otp, setOtp] = useState({
    current: 0,
    last: 0,
  });

  useEffect(() => {
    if (userInfo?.publicKey && !userInfo?.email && step !== 2) {
      setStep(2);
    }
  }, [userInfo]);

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isCentered
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent w={'22rem'} h={'max'} minH="md">
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
        {step === 1 && <ModalCloseButton />}
        <ModalBody>
          {step === 1 && (
            <ConnectWallet
              wallets={wallets}
              onConnectWallet={onConnectWallet}
            />
          )}
          {step === 2 && (
            <NewUserInfo
              userInfo={userInfo}
              setUserInfo={setUserInfo}
              setStep={setStep}
              setOtp={setOtp}
            />
          )}
          {step === 3 && (
            <VerifyOtp userInfo={userInfo} onClose={onClose} otp={otp} />
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
  );
};
