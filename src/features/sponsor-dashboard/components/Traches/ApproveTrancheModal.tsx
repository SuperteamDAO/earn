import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
import { cn } from '@/utils/cn';

import {
  getCustomEmailPlainText,
  sanitizeCustomEmailBody,
  validateCustomEmailNote,
} from '../../utils/customEmailSanitizer';
import { getTrancheApprovedEmailBody } from '../../utils/grantEmailCopy';
import { CustomNoteEditor } from '../GrantApplications/Modals/CustomNoteEditor';

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
  trancheId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  projectTitle: string | null | undefined;
  sponsorName: string | null | undefined;
  salutation: string | null | undefined;
  token: string;
  enableCustomEmail: boolean;
  onApproveTranche: (
    trancheId: string,
    approvedAmount: number,
    customNote?: string,
  ) => void;
  grantApprovedAmount: number;
  grantTotalPaid: number;
}

export const ApproveTrancheModal = ({
  trancheId,
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  projectTitle,
  sponsorName,
  salutation,
  token,
  enableCustomEmail,
  onApproveTranche,
  grantApprovedAmount,
  grantTotalPaid,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [customNote, setCustomNote] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const remainingAmount = grantApprovedAmount - grantTotalPaid;
  const maxApprovalAmount =
    ask === undefined ? remainingAmount : Math.min(remainingAmount, ask);
  const isInvalidApprovalAmount =
    approvedAmount === undefined ||
    !Number.isFinite(approvedAmount) ||
    approvedAmount === 0 ||
    approvedAmount > maxApprovalAmount;
  const previewEmailBody = getTrancheApprovedEmailBody({
    granteeName,
    projectTitle,
    sponsorName,
    approvedAmount,
    token,
    salutation,
    reviewerNote: sanitizeCustomEmailBody(customNote),
  });

  const handleAmountChange = (value: number) => {
    if (value > remainingAmount) {
      setWarningMessage(
        `Amount exceeds remaining grant budget (${remainingAmount} ${token})`,
      );
    } else if (value > (ask as number)) {
      setWarningMessage('Approved amount is greater than the requested amount');
    } else {
      setWarningMessage(null);
    }
    setApprovedAmount(value);
  };

  const approveTranche = async () => {
    if (isInvalidApprovalAmount || !trancheId) return;

    const noteValidation = validateCustomEmailNote({
      noteHtml: customNote.trim(),
      fullEmailHtml: previewEmailBody,
    });
    if (enableCustomEmail && isCustomEmailOpen && !noteValidation.isValid) {
      setEmailError(noteValidation.error);
      return;
    }

    setLoading(true);
    try {
      await onApproveTranche(
        trancheId,
        approvedAmount,
        enableCustomEmail && isCustomEmailOpen
          ? noteValidation.sanitized
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
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    setWarningMessage(null);
    setLoading(false);
  }, [
    trancheId,
    ask,
    granteeName,
    projectTitle,
    sponsorName,
    salutation,
    token,
  ]);

  return (
    <Dialog open={approveIsOpen} onOpenChange={approveOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Approve Tranche Payment
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-slate-500">
            You are about to approve {granteeName}&apos;s tranche payment. They
            will be notified via email.
          </p>

          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-500">Tranche Payment</p>
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
                max={maxApprovalAmount}
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
            <CustomNoteEditor
              id="approve-tranche-custom-note"
              value={customNote}
              previewHtml={previewEmailBody}
              emailType="approval"
              error={emailError}
              onChange={(value) => {
                const sanitizedNote = sanitizeCustomEmailBody(value);
                setCustomNote(value);
                setEmailError(
                  validateCustomEmailNote({
                    noteHtml: value,
                    fullEmailHtml: getTrancheApprovedEmailBody({
                      granteeName,
                      projectTitle,
                      sponsorName,
                      approvedAmount,
                      token,
                      salutation,
                      reviewerNote: sanitizedNote,
                    }),
                  }).error,
                );
              }}
            />
          )}

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={approveOnClose} disabled={loading}>
              Close
            </Button>
            <div className="flex flex-1">
              <Button
                className={cn(
                  'flex-1 border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600',
                  enableCustomEmail
                    ? 'rounded-l-lg rounded-r-none'
                    : 'rounded-lg',
                )}
                disabled={
                  loading ||
                  isInvalidApprovalAmount ||
                  (enableCustomEmail &&
                    isCustomEmailOpen &&
                    (!getCustomEmailPlainText(customNote) || !!emailError))
                }
                onClick={approveTranche}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    <span>
                      {isCustomEmailOpen
                        ? 'Approving with Custom Note'
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
                        ? 'Approve with Custom Note'
                        : 'Approve Tranche'}
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
                      aria-label="Approve tranche options"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-70 w-56">
                    {isCustomEmailOpen ? (
                      <DropdownMenuItem
                        onClick={() => setIsCustomEmailOpen(false)}
                      >
                        Use default email
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => setIsCustomEmailOpen(true)}
                      >
                        Approve with custom note
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
