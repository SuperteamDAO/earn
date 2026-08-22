import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import posthog from 'posthog-js';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
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

import { useCustomNoteCloseGuard } from '@/features/sponsor-dashboard/components/GrantApplications/hooks/useCustomNoteCloseGuard';
import { CustomNoteEditor } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/CustomNoteEditor';
import {
  getCustomEmailPlainText,
  sanitizeCustomEmailBody,
  validateCustomEmailNote,
} from '@/features/sponsor-dashboard/utils/customEmailSanitizer';
import { getGrantApprovedEmailBody } from '@/features/sponsor-dashboard/utils/grantEmailCopy';

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
    <div className="relative w-full max-w-[160px]">
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
    customNote?: string,
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
  const [customNote, setCustomNote] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const previewEmailBody = getGrantApprovedEmailBody({
    granteeName,
    grantTitle,
    projectTitle,
    approvedAmount,
    token,
    salutation,
    reviewerNote: sanitizeCustomEmailBody(customNote),
  });

  const closeAndDiscardCustomNote = () => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    approveOnClose();
  };

  const { closeWithoutGuard, discardChangesDialog, requestClose } =
    useCustomNoteCloseGuard({
      customNote,
      isEnabled: enableCustomEmail && isCustomEmailOpen,
      onDiscard: closeAndDiscardCustomNote,
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
  };

  const approveGrant = async () => {
    if (approvedAmount === undefined || approvedAmount === 0 || !applicationId)
      return;

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
      posthog.capture('approve_grant application');
      await onApproveGrant(
        applicationId,
        approvedAmount,
        enableCustomEmail && isCustomEmailOpen
          ? noteValidation.sanitized
          : undefined,
      );
      closeWithoutGuard();
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
    applicationId,
    ask,
    granteeName,
    grantTitle,
    projectTitle,
    salutation,
    token,
  ]);

  return (
    <>
      <Dialog
        open={approveIsOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className="m-0 max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:max-w-lg"
          hideCloseIcon
        >
          <DialogTitle className="text-md -mb-1 px-4 pt-4 font-semibold text-slate-900 sm:px-6">
            Approve Grant Payment
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the requested amount, choose the approved amount, and confirm
            the grant approval.
          </DialogDescription>
          <Separator />
          <div className="px-4 pb-5 text-[0.95rem] sm:px-6 sm:pb-6">
            <p className="mb-4 text-sm leading-6 text-slate-500 sm:text-[0.95rem]">
              You are about to approve {granteeName}&apos;s grant request. They
              will be notified via email.
            </p>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">Grant Request</p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <TokenIcon
                  className="h-5 w-5 rounded-full"
                  alt={`${token} icon`}
                  symbol={token}
                />
                <p className="font-semibold text-slate-600">
                  {ask} <span className="text-slate-400">{token}</span>
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">Approved Amount</p>
              <div className="flex w-full items-stretch overflow-hidden sm:w-auto">
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
              <CustomNoteEditor
                id="approve-grant-custom-note"
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
                      fullEmailHtml: getGrantApprovedEmailBody({
                        granteeName,
                        grantTitle,
                        projectTitle,
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="hidden sm:block sm:flex-1" />
              <Button
                variant="outline"
                onClick={requestClose}
                disabled={loading}
                className="w-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 sm:ml-auto sm:w-auto"
              >
                Close
              </Button>
              <div className="flex w-full flex-1">
                <Button
                  className={cn(
                    'flex-1 border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600',
                    enableCustomEmail
                      ? 'rounded-l-lg rounded-r-none'
                      : 'rounded-lg',
                  )}
                  disabled={
                    loading ||
                    approvedAmount === 0 ||
                    (enableCustomEmail &&
                      isCustomEmailOpen &&
                      (!getCustomEmailPlainText(customNote) || !!emailError))
                  }
                  onClick={approveGrant}
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
                        className="shrink-0 rounded-l-none rounded-r-lg border border-l-0 border-emerald-500 bg-emerald-50 px-2 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
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
      {discardChangesDialog}
    </>
  );
};
