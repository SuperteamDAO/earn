import { useLoginWithOAuth } from '@privy-io/react-auth';
import { useAtomValue } from 'jotai';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { popupTimeoutAtom } from '@/features/conversion-popups/atoms';

import { handleUserCreation } from '../utils/handleUserCreation';
import { SignIn } from './SignIn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSponsor?: boolean;
  redirectTo?: string;
  hideOverlay?: boolean;
  onOpen?: () => void;
}

export const Login = ({
  isOpen,
  onClose,
  isSponsor = false,
  redirectTo,
  hideOverlay,
}: Props) => {
  const router = useRouter();
  const [loginStep, setLoginStep] = useState(0);
  const popupTimeout = useAtomValue(popupTimeoutAtom);

  useLoginWithOAuth({
    onComplete: async ({ isNewUser, user, wasAlreadyAuthenticated }) => {
      if (isNewUser) {
        await handleUserCreation(user.google?.email || '');
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        const currentPath = router.asPath;
        const url = new URL(window.location.origin + currentPath);

        const privyParams = [
          'privy_oauth_state',
          'privy_oauth_provider',
          'privy_oauth_code',
        ];
        privyParams.forEach((param) => url.searchParams.delete(param));

        if (!wasAlreadyAuthenticated) {
          url.searchParams.set('loginState', 'signedIn');
        }

        router.replace(url.toString());
      }
    },
  });

  useEffect(() => {
    if (popupTimeout) {
      if (isOpen) {
        popupTimeout.pause();
      }
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && popupTimeout) {
        popupTimeout.resume();
      }
      onClose();
    },
    [popupTimeout, onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="z-200 w-[23rem] p-0 pt-2"
        classNames={{
          overlay: hideOverlay ? 'hidden' : '',
        }}
        hideCloseIcon
      >
        <div className="py-5">
          {loginStep === 1 && (
            <ArrowLeft
              className="absolute top-8 ml-5 h-5 w-5 cursor-pointer text-slate-500"
              onClick={() => setLoginStep(0)}
            />
          )}
          <p className="text-center text-lg font-semibold text-slate-900">
            You&apos;re one step away
          </p>
          <p className="text-center text-sm text-slate-600">
            {isSponsor
              ? 'from joining Superteam Earn'
              : 'From earning in global standards'}
          </p>
        </div>
        <SignIn
          redirectTo={redirectTo}
          loginStep={loginStep}
          setLoginStep={setLoginStep}
        />
      </DialogContent>
    </Dialog>
  );
};
