import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import posthog from 'posthog-js';
import React, { useEffect, useState } from 'react';

import { RichEditor } from '@/components/shared/RichEditor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TokenIcon } from '@/components/ui/token-icon';

import {
  getCustomEmailPlainText,
  validateCustomEmailBody,
} from '../../../utils/customEmailSanitizer';
import { getGrantApprovedEmailBody } from '../../../utils/grantEmailCopy';

const CustomNumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 100,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  step?: number;
}) => {
  const increment = () => {
    if (max === undefined || value + step <= max) {
      onChange(value + step);
    }
  };

  const decrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue === '') {
      onChange(0);
      return;
    }

    const numericValue = parseFloat(newValue);
    onChange(numericValue);
  };

  return (
    <div className="relative w-[160px]">
      <Input
        value={value || ''}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        className="rounded-r-none pr-8 font-semibold text-slate-600"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <div className="absolute top-0 right-1 flex h-full flex-col">
        <button
          type="button"
          onClick={increment}
          className="flex-1 px-1 text-slate-400 hover:text-slate-600"
          aria-label="Increment value"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={decrement}
          className="flex-1 px-1 text-slate-400 hover:text-slate-600"
          aria-label="Decrement value"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

interface ApproveModalProps {
  approveIsOpen: boolean;
  approveOnClose: () => void;
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  grantTitle: string | undefined;
  projectTitle: string | null | undefined;
  salutation: string | null | undefined;
  token: string;
  enableCustomEmail: boolean;
  onApproveGrant: (
    applicationId: string,
    approvedAmount: number,
    emailBody?: string,
  ) => void;
  max: number | undefined;
}

export const ApproveModal = ({
  applicationId,
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  grantTitle,
  projectTitle,
  salutation,
  token,
  enableCustomEmail,
  onApproveGrant,
  max,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [emailBody, setEmailBody] = useState('');
  const [hasEditedEmail, setHasEditedEmail] = useState(false);
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const defaultEmailBody = getGrantApprovedEmailBody({
    granteeName,
    grantTitle,
    projectTitle,
    approvedAmount,
    token,
    salutation,
  });

  const handleAmountChange = (value: number) => {
    if (value > (ask as number)) {
      setWarningMessage(
        'Approved amount is greater than the requested amount.',
      );
    } else {
      setWarningMessage(null);
    }
    setApprovedAmount(value);
    if (!hasEditedEmail) {
      setEmailBody(
        getGrantApprovedEmailBody({
          granteeName,
          grantTitle,
          projectTitle,
          approvedAmount: value,
          token,
          salutation,
        }),
      );
    }
  };

  const approveGrant = async () => {
    if (approvedAmount === undefined || approvedAmount === 0 || !applicationId)
      return;

    const customEmailBody = emailBody.trim();
    const emailValidation = validateCustomEmailBody(customEmailBody);
    if (enableCustomEmail && isCustomEmailOpen && !emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    setLoading(true);
    try {
      posthog.capture('approve_grant application');
      await onApproveGrant(
        applicationId,
        approvedAmount,
        enableCustomEmail && isCustomEmailOpen
          ? emailValidation.sanitized
          : undefined,
      );
      approveOnClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setApprovedAmount(ask);
    setEmailBody(
      getGrantApprovedEmailBody({
        granteeName,
        grantTitle,
        projectTitle,
        approvedAmount: ask,
        token,
        salutation,
      }),
    );
    setHasEditedEmail(false);
    setIsCustomEmailOpen(false);
    setEmailError(null);
    setWarningMessage(null);
    setLoading(false);
  }, [
    applicationId,
    ask,
    granteeName,
    grantTitle,
    projectTitle,
    salutation,
    token,
  ]);

  return (
    <Dialog open={approveIsOpen} onOpenChange={approveOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Approve Grant Payment
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-slate-500">
            You are about to approve {granteeName}&apos;s grant request. They
            will be notified via email.
          </p>

          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-500">Grant Request</p>
            <div className="flex items-center">
              <TokenIcon
                className="h-5 w-5 rounded-full"
                alt={`${token} icon`}
                symbol={token}
              />
              <p className="ml-1 font-semibold text-slate-600">
                {ask} <span className="text-slate-400">{token}</span>
              </p>
            </div>
          </div>

          <div className="mb-6 flex w-full items-center justify-between">
            <p className="w-full whitespace-nowrap text-slate-500">
              Approved Amount
            </p>
            <div className="flex">
              <CustomNumberInput
                value={approvedAmount || 0}
                onChange={handleAmountChange}
                min={1}
                max={max}
              />
              <div className="flex items-center rounded-r-md border border-l-0 bg-white px-3 text-[0.95rem] text-slate-400">
                <TokenIcon
                  className="mr-1 h-5 w-5 rounded-full"
                  alt={`${token} icon`}
                  symbol={token}
                />
                {token}
              </div>
            </div>
          </div>

          {warningMessage && (
            <p className="mb-4 text-center text-sm text-yellow-500">
              {warningMessage}
            </p>
          )}

          {enableCustomEmail && isCustomEmailOpen && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium text-slate-600">Email Body</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto px-2 py-1 text-xs font-semibold text-slate-500"
                  onClick={() => {
                    setEmailBody(defaultEmailBody);
                    setHasEditedEmail(false);
                    setEmailError(null);
                  }}
                  disabled={loading || emailBody === defaultEmailBody}
                >
                  Reset
                </Button>
              </div>
              <RichEditor
                id="approve-grant-email-body"
                height="h-[190px]"
                value={emailBody}
                onChange={(value) => {
                  setEmailBody(value);
                  setHasEditedEmail(true);
                  setEmailError(validateCustomEmailBody(value).error);
                }}
                error={!!emailError}
                placeholder="Write the email body"
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-500">{emailError}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={approveOnClose} disabled={loading}>
              Close
            </Button>
            <div className="flex flex-1">
              <Button
                className="flex-1 rounded-l-lg rounded-r-none border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                disabled={
                  loading ||
                  approvedAmount === 0 ||
                  (enableCustomEmail &&
                    isCustomEmailOpen &&
                    (!getCustomEmailPlainText(emailBody) || !!emailError))
                }
                onClick={approveGrant}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    <span>
                      {isCustomEmailOpen
                        ? 'Approving with Custom Email'
                        : 'Approving'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="mr-2 rounded-full bg-emerald-600 p-0.5">
                      <Check className="size-2.5 text-white" />
                    </div>
                    <span>
                      {isCustomEmailOpen
                        ? 'Approve with Custom Email'
                        : 'Approve Grant'}
                    </span>
                  </>
                )}
              </Button>
              {enableCustomEmail && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="rounded-l-none rounded-r-lg border border-l-0 border-emerald-500 bg-emerald-50 px-2 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                      disabled={loading}
                      aria-label="Approve options"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-70 w-56">
                    {isCustomEmailOpen ? (
                      <DropdownMenuItem
                        onClick={() => setIsCustomEmailOpen(false)}
                      >
                        Approve
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => setIsCustomEmailOpen(true)}
                      >
                        Approve with custom email
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
