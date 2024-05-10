import { useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect } from 'react';

import { Login } from '@/features/auth';
import type { User } from '@/interface/user';

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
    if (triggerLogin) {
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
