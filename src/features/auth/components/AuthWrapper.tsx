import { useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useState } from 'react';

import { Login } from '@/features/auth';
import { CompleteProfileModal } from '@/features/listings';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

interface AuthWrapperProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  showCompleteProfileModal?: boolean;
  completeProfileModalBodyText?: string;
}

export function AuthWrapper({
  children,
  className,
  onClick,
  showCompleteProfileModal = false,
  completeProfileModalBodyText = 'Please complete your profile before proceeding.',
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
              isLoading || shouldAllowInteraction ? 'auto' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
