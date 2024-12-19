import { useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useState } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { CompleteProfileModal } from './CompleteProfileModal';
import { Login } from './Login';

interface AuthWrapperProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  showCompleteProfileModal?: boolean;
  completeProfileModalBodyText?: string;
  redirectTo?: string;
  hideLoginOverlay?: boolean;
  onLoginOpenCallback?: () => void;
  onLoginCloseCallback?: () => void;
}

export function AuthWrapper({
  children,
  className,
  onClick,
  showCompleteProfileModal = false,
  completeProfileModalBodyText = 'Please complete your profile before proceeding.',
  redirectTo,
  hideLoginOverlay,
  onLoginCloseCallback,
  onLoginOpenCallback,
}: AuthWrapperProps) {
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

  useEffect(() => {
    if (loginIsOpen) onLoginOpenCallback?.();
    else onLoginCloseCallback?.();
  }, [loginIsOpen]);

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
      {loginIsOpen && (
        <Login
          hideOverlay={hideLoginOverlay}
          isOpen={loginIsOpen}
          onClose={loginOnClose}
          redirectTo={redirectTo}
          hideCloseIcon
        />
      )}
      {profileModalIsOpen && (
        <CompleteProfileModal
          isOpen={profileModalIsOpen}
          onClose={profileModalOnClose}
          bodyText={completeProfileModalBodyText}
          isSponsor={isSponsor}
        />
      )}
      <div
        onClick={handleLoginTrigger}
        className={cn('flex cursor-pointer', className)}
      >
        <div
          className="h-full w-full"
          style={{
            pointerEvents:
              isLoading || !shouldAllowInteraction ? 'none' : 'auto',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
