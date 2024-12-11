import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { SignIn } from './SignIn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSponsor?: boolean;
  redirectTo?: string;
  hideOverlay?: boolean;
}

export const Login = ({
  isOpen,
  onClose,
  isSponsor = false,
  redirectTo,
  hideOverlay,
}: Props) => {
  const [loginStep, setLoginStep] = useState(0);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[23rem] p-0 pt-2"
        classNames={{
          overlay: hideOverlay ? 'hidden' : '',
        }}
      >
        <div className="py-6">
          {loginStep === 1 && (
            <ArrowLeft
              className="ml-5 h-5 w-5 cursor-pointer text-slate-500"
              onClick={() => setLoginStep(0)}
            />
          )}
          <p className="text-center text-lg font-semibold text-slate-900">
            You&apos;re one step away
          </p>
          <p className="text-center text-[15px] text-slate-600">
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
