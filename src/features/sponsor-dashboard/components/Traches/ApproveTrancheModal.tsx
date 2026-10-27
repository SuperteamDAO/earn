import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';

import { useCustomNoteCloseGuard } from '@/features/sponsor-dashboard/components/GrantApplications/hooks/useCustomNoteCloseGuard';
import { ApprovedAmountRow } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/ApprovedAmountRow';
import { CustomNoteEditor } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/CustomNoteEditor';
import { RequestedAmountRow } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/RequestedAmountRow';
import {
  getCustomEmailPlainText,
  sanitizeCustomEmailBody,
  validateCustomEmailNote,
} from '@/features/sponsor-dashboard/utils/customEmailSanitizer';
import { getTrancheApprovedEmailBody } from '@/features/sponsor-dashboard/utils/grantEmailCopy';

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
      closeWithoutGuard();
    } catch (e) {
      console.error(e);
    } finally {
      // react-doctor-disable-next-line react-doctor/no-unowned-async-error-clear -- the submit button is disabled while `loading`, and the parent keys this modal by tranche id, so no other request can own this flag
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={approveIsOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent className="m-0 p-0" hideCloseIcon>
          <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
            Approve Tranche Payment
          </DialogTitle>
          <Separator />
          <div className="px-6 pb-6 text-[0.95rem]">
            <p className="mb-4 text-slate-500">
              You are about to approve {granteeName}&apos;s tranche payment.
              They will be notified via email.
            </p>

            <RequestedAmountRow
              label="Tranche Payment"
              ask={ask}
              token={token}
            />

            <ApprovedAmountRow
              value={approvedAmount || 0}
              onChange={handleAmountChange}
              max={maxApprovalAmount}
              token={token}
            />

            {warningMessage && (
              <p className="mb-4 text-center text-sm text-red-500">
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
              <Button variant="ghost" onClick={requestClose} disabled={loading}>
                Close
              </Button>
              <div className="flex flex-1">
                <Button
                  className={cn(
                    'flex-1 border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600 disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100',
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
      {discardChangesDialog}
    </>
  );
};
