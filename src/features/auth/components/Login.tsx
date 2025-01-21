import { useAtomValue } from 'jotai';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { popupTimeoutAtom } from '@/features/conversion-popups/atoms';

import { isOAuthInProgress } from '../utils/isOAuthInProgress';
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
  onOpen,
}: Props) => {
  const [loginStep, setLoginStep] = useState(0);
  const popupTimeout = useAtomValue(popupTimeoutAtom);

  useEffect(() => {
    if (popupTimeout) {
      if (isOpen) {
        popupTimeout.pause();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOAuthInProgress()) {
      onOpen?.();
    }
  }, [onOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!isOAuthInProgress()) {
        if (!open && popupTimeout) {
          popupTimeout.resume();
        }
        onClose();
      }
    },
    [popupTimeout, onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="z-[200] w-[23rem] p-0 pt-2"
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
