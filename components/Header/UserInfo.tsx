import { Button, useDisclosure } from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { useEffect } from 'react';

import { Login } from '@/components/modals/Login/Login';
import { userStore } from '@/store/user';

function UserInfo() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connected, publicKey, wallets, select } = useWallet();
  const { setUserInfo, userInfo } = userStore();

  useEffect(() => {
    const makeUser = async () => {
      if (publicKey && connected) {
        const publicKeyString = publicKey.toBase58() as string;
        const userDetails = await axios.post('/api/user', {
          publicKey: publicKeyString,
        });
        if (!userDetails.data) {
          setUserInfo({ publicKey: publicKeyString });
        } else {
          setUserInfo(userDetails.data);
        }
      }
    };
    makeUser();
  }, [publicKey, connected]);

  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      select(solanaWallet.adapter.name);
    } catch (e) {
      console.log('Wallet not found');
    }
  };

  // const onDisconnectWallet = async () => {
  //   if (wallet == null) {
  //     return;
  //   }
  //   await wallet.adapter.disconnect();
  // };

  return (
    <>
      {!!isOpen && (
        <Login
          wallets={wallets}
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
        />
      )}
      <Button
        px={4}
        fontSize="xs"
        onClick={() => {
          onOpen();
        }}
        size="sm"
        variant="ghost"
      >
        Login
      </Button>
      <Button
        px={4}
        fontSize="xs"
        onClick={() => {
          onOpen();
        }}
        size="sm"
        variant="solid"
      >
        Sign Up
      </Button>
    </>
  );
}

export default UserInfo;
