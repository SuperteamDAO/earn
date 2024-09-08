import { Flex, type FlexProps, useDisclosure } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useState } from 'react';

import { Login } from '@/features/auth';

interface LoginProps {
  children: ReactNode;
  style?: FlexProps;
  onClick?: () => void;
}

export function AuthWrapper({ children, style, onClick }: LoginProps) {
  const [triggerLogin, setTriggerLogin] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { status } = useSession();

  const isAuthenticated = status === 'authenticated';

  const handleLoginTrigger = () => {
    if (!isAuthenticated) {
      onClick && onClick();
      onOpen();
    }
  };

  useEffect(() => {
    if (triggerLogin && !isAuthenticated) {
      setTriggerLogin(false);
      onOpen();
    }
  }, [triggerLogin]);

  return (
    <>
      {!!isOpen && <Login isOpen={isOpen} onClose={onClose} />}
      <Flex onClick={handleLoginTrigger} {...style}>
        {children}
      </Flex>
    </>
  );
}
