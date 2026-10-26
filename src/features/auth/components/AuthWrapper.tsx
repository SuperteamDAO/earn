'use client';

import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';
import { useSignIn } from '@/lib/auth/sign-in-dialog';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

const CompleteProfileModal = dynamic(() =>
  import('@/features/auth/components/CompleteProfileModal').then(
    (mod) => mod.CompleteProfileModal,
  ),
);

interface AuthWrapperProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  showCompleteProfileModal?: boolean;
  completeProfileModalBodyText?: string;
  // Where sign-in returns to; this page by default.
  redirectTo?: string;
  allowSponsor?: boolean;
}

// Wraps something only a signed-in person (optionally with a finished
// talent profile) may use. Signed out, a tap opens Earn's sign-in dialog. Without a profile,
// it asks them to finish one.
export function AuthWrapper({
  children,
  className,
  onClick,
  showCompleteProfileModal = false,
  completeProfileModalBodyText = 'Please complete your profile before proceeding.',
  redirectTo,
  allowSponsor = false,
}: AuthWrapperProps) {
  const viewer = useViewer();
  const openSignIn = useSignIn();
  const pathname = usePathname() ?? '';
  const search = useSearchParams()?.toString() ?? '';
  const isSponsor = !!viewer?.currentSponsorId;
  const isTalentFilled = !!viewer?.isTalentFilled;

  const {
    isOpen: profileModalIsOpen,
    onOpen: profileModalOnOpen,
    onClose: profileModalOnClose,
  } = useDisclosure();

  const shouldAllowInteraction =
    !!viewer &&
    (!showCompleteProfileModal ||
      isTalentFilled ||
      (allowSponsor && isSponsor));

  const handleTrigger = (event: React.MouseEvent) => {
    if (shouldAllowInteraction) return;
    event.preventDefault();
    event.stopPropagation();
    if (!viewer) {
      onClick?.();
      openSignIn(redirectTo ?? (search ? `${pathname}?${search}` : pathname));
      return;
    }
    profileModalOnOpen();
  };

  return (
    <>
      {profileModalIsOpen && (
        <CompleteProfileModal
          isOpen={profileModalIsOpen}
          onClose={profileModalOnClose}
          bodyText={completeProfileModalBodyText}
          isSponsor={isSponsor}
        />
      )}
      <div
        onClick={handleTrigger}
        className={cn('flex cursor-pointer', className)}
      >
        <div
          className="h-full w-full"
          style={{ pointerEvents: shouldAllowInteraction ? 'auto' : 'none' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
