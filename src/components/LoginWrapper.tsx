import { useDisclosure } from '@chakra-ui/react';
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

export function LoginWrapper({
  triggerLogin,
  setTriggerLogin,
  inviteInfo,
  acceptUser,
}: LoginProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userInfo } = userStore();

  useEffect(() => {
    const makeUser = async () => {
      const userDetails = await axios.post('/api/user/');
      if (inviteInfo?.emailInvite && acceptUser) {
        acceptUser(userDetails.data);
      }
    };
    inviteInfo && makeUser();
  }, []);

  useEffect(() => {
    if (triggerLogin && !userInfo?.id) {
      setTriggerLogin(false);
      onOpen();
    }
  }, [triggerLogin]);

  const isSponsor = inviteInfo && Object.keys(inviteInfo).length > 0;

  return (
    <>
      {!!isOpen && (
        <Login isSponsor={isSponsor} isOpen={isOpen} onClose={onClose} />
      )}
    </>
  );
}
