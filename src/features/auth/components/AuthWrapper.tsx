import { Flex, type FlexProps, useDisclosure } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Login } from '@/features/auth';
import { CompleteProfileModal } from '@/features/listings';
import { useUser } from '@/store/user';

interface AuthWrapperProps {
  children: ReactNode;
  style?: FlexProps;
  onClick?: () => void;
  showCompleteProfileModal?: boolean;
  completeProfileModalBodyText?: string;
}

export function AuthWrapper({
  children,
  style,
  onClick,
  showCompleteProfileModal = false,
  completeProfileModalBodyText,
}: AuthWrapperProps) {
  const { t } = useTranslation('common');
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const { user } = useUser();
  const isSponsor = !!user?.currentSponsorId || false;
  const isTalentFilled = !!user?.isTalentFilled || false;

  const [triggerLogin, setTriggerLogin] = useState(false);

  const {
    isOpen: loginIsOpen,
    onOpen: loginOnOpen,
    onClose: loginOnClose,
  } = useDisclosure();
  const {
    isOpen: profileModalIsOpen,
    onOpen: profileModalOnOpen,
    onClose: profileModalOnClose,
  } = useDisclosure();

  const handleLoginTrigger = (e: React.MouseEvent) => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      e.preventDefault();
      e.stopPropagation();
      onClick && onClick();
      loginOnOpen();
    } else if (showCompleteProfileModal && !isTalentFilled) {
      e.preventDefault();
      e.stopPropagation();
      profileModalOnOpen();
    }
  };

  useEffect(() => {
    if (triggerLogin && !isAuthenticated) {
      setTriggerLogin(false);
      loginOnOpen();
    }
  }, [triggerLogin, isAuthenticated]);

  const shouldAllowInteraction =
    isAuthenticated && (!showCompleteProfileModal || isTalentFilled);

  return (
    <>
      {loginIsOpen && <Login isOpen={loginIsOpen} onClose={loginOnClose} />}
      {profileModalIsOpen && (
        <CompleteProfileModal
          isOpen={profileModalIsOpen}
          onClose={profileModalOnClose}
          bodyText={
            completeProfileModalBodyText ||
            t('AuthWrapper.completeProfileModalDefaultText')
          }
          isSponsor={isSponsor}
        />
      )}
      <Flex onClick={handleLoginTrigger} {...style}>
        <div
          style={{
            pointerEvents:
              isLoading || shouldAllowInteraction ? 'auto' : 'none',
            width: '100%',
            height: '100%',
          }}
        >
          {children}
        </div>
      </Flex>
    </>
  );
}
