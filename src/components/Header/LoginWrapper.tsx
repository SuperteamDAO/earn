import { useDisclosure } from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { useEffect } from 'react';

import { Login } from '@/components/modals/Login/Login';
import type { User } from '@/interface/user';
import { userStore } from '@/store/user';

interface LoginProps {
  triggerLogin: boolean;
  setTriggerLogin: (arg0: boolean) => void;
  inviteInfo?: {
    emailInvite?: string;
    currentSponsorId?: string;
    memberType?: 'MEMBER' | 'ADMIN';
  };
  acceptUser?: (user: User) => void;
}

function LoginWrapper({
  triggerLogin,
  setTriggerLogin,
  inviteInfo,
  acceptUser,
}: LoginProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connected, publicKey, wallets, select } = useWallet();
  const { setUserInfo, userInfo } = userStore();

  useEffect(() => {
    const makeUser = async () => {
      if (publicKey && connected) {
        const publicKeyString = publicKey.toBase58() as string;
        const userDetails = await axios.post('/api/user/', {
          publicKey: publicKeyString,
        });
        if (!userDetails.data) {
          setUserInfo({ publicKey: publicKeyString });
        } else if (!userDetails.data.isVerified) {
          setUserInfo(userDetails.data);
        } else {
          setUserInfo(userDetails.data);
          if (inviteInfo?.emailInvite && acceptUser) {
            acceptUser(userDetails.data);
          }
          onClose();
        }
      }
    };
    makeUser();
  }, [publicKey, connected]);

  useEffect(() => {
    if (triggerLogin && !userInfo?.id) {
      setTriggerLogin(false);
      onOpen();
    }
  }, [triggerLogin]);

  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      select(solanaWallet.adapter.name);
    } catch (e) {
      console.log('Wallet not found');
    }
  };

  return (
    <>
      {!!isOpen && (
        <Login
          inviteInfo={inviteInfo}
          wallets={wallets}
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
        />
      )}
    </>
  );
}

export default LoginWrapper;
