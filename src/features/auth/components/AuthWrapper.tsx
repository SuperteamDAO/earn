'use client';

import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { useDisclosure } from '@/hooks/use-disclosure';
import { signInHref } from '@/lib/safe-next';
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
// talent profile) may use. Signed out, a tap goes to sign-in, a page of its
// own (Privy's SDK loads only there), and comes back. Without a profile,
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
      // A full page load: sign-in is a document with its own CSP.
      window.location.assign(
        signInHref(redirectTo ?? (search ? `${pathname}?${search}` : pathname)),
      );
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
