'use client';
import { usePrivy } from '@privy-io/react-auth';
import dynamic from 'next/dynamic';
import { type ReactNode, useEffect, useState } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

const CompleteProfileModal = dynamic(() =>
  import('@/features/auth/components/CompleteProfileModal').then(
    (mod) => mod.CompleteProfileModal,
  ),
);

const Login = dynamic(() =>
  import('@/features/auth/components/Login').then((mod) => mod.Login),
);

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
  allowSponsor?: boolean;
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
  allowSponsor = false,
}: AuthWrapperProps) {
  const { authenticated, ready } = usePrivy();
  const isAuthenticated = authenticated;
  const isLoading = !ready;

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
  }, [loginIsOpen, onLoginOpenCallback, onLoginCloseCallback]);

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
    } else if (
      showCompleteProfileModal &&
      !isTalentFilled &&
      !(allowSponsor && isSponsor)
    ) {
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
  }, [triggerLogin, isAuthenticated, loginOnOpen]);

  const shouldAllowInteraction =
    isAuthenticated &&
    (!showCompleteProfileModal ||
      isTalentFilled ||
      (allowSponsor && isSponsor));

  return (
    <>
      {loginIsOpen && (
        <Login
          hideOverlay={hideLoginOverlay}
          isOpen={loginIsOpen}
          onClose={loginOnClose}
          redirectTo={redirectTo}
          onOpen={loginOnOpen}
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
