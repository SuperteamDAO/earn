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
import type { Wallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
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
  inviteInfo?: {
    emailInvite?: string;
    currentSponsorId?: string;
    memberType?: 'MEMBER' | 'ADMIN';
  };
}
export const Login = ({
  isOpen,
  onClose,
  onConnectWallet,
  userInfo,
  setUserInfo,
  wallets,
  initialStep = 1,
  inviteInfo,
}: Props) => {
  const router = useRouter();
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
        <ModalCloseButton />
        <ModalBody>
          {step === 1 && (
            <ConnectWallet
              wallets={wallets}
              onConnectWallet={onConnectWallet}
            />
          )}
          {step === 2 && (
            <NewUserInfo
              inviteInfo={inviteInfo}
              userInfo={userInfo}
              setUserInfo={setUserInfo}
              setStep={setStep}
              setOtp={setOtp}
            />
          )}
          {step === 3 && (
            <VerifyOtp
              inviteInfo={inviteInfo}
              userInfo={userInfo}
              onClose={onClose}
              otp={otp}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Text color="brand.slate.400" fontSize="xs" textAlign="center">
            By connecting your wallet & signing up, you agree to our{' '}
            <Link
              fontWeight={700}
              href={`${router.basePath}/terms-of-service.pdf`}
              isExternal
            >
              Terms of Service
            </Link>{' '}
            and our{' '}
            <Link
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
