import { ChevronDown, X } from 'lucide-react';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { TokenIcon } from '@/components/ui/token-icon';
import { cn } from '@/utils/cn';

import { useCustomNoteCloseGuard } from '@/features/sponsor-dashboard/components/GrantApplications/hooks/useCustomNoteCloseGuard';
import { CustomNoteEditor } from '@/features/sponsor-dashboard/components/GrantApplications/Modals/CustomNoteEditor';
import {
  getCustomEmailPlainText,
  sanitizeCustomEmailBody,
  validateCustomEmailNote,
} from '@/features/sponsor-dashboard/utils/customEmailSanitizer';
import { getGrantRejectedEmailBody } from '@/features/sponsor-dashboard/utils/grantEmailCopy';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  grantTitle: string | undefined;
  projectTitle: string | null | undefined;
  salutation: string | null | undefined;
  token: string;
  enableCustomEmail: boolean;
  onRejectGrant: (
    applicationId: string,
    customNote?: string,
    skipCooldown?: boolean,
  ) => void;
}

export const RejectGrantApplicationModal = ({
  applicationId,
  rejectIsOpen,
  rejectOnClose,
  ask,
  granteeName,
  grantTitle,
  projectTitle,
  salutation,
  token,
  enableCustomEmail,
  onRejectGrant,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [skipCooldown, setSkipCooldown] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const previewEmailBody = getGrantRejectedEmailBody({
    granteeName,
    grantTitle,
    projectTitle,
    salutation,
    reviewerNote: sanitizeCustomEmailBody(customNote),
  });

  const closeAndDiscardCustomNote = () => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setSkipCooldown(false);
    setEmailError(null);
    rejectOnClose();
  };

  const { closeWithoutGuard, discardChangesDialog, requestClose } =
    useCustomNoteCloseGuard({
      customNote,
      isEnabled: enableCustomEmail && isCustomEmailOpen,
      onDiscard: closeAndDiscardCustomNote,
    });

  const rejectGrant = async () => {
    if (!applicationId) return;

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
      posthog.capture('reject_grant application');
      await onRejectGrant(
        applicationId,
        enableCustomEmail && isCustomEmailOpen
          ? noteValidation.sanitized
          : undefined,
        skipCooldown,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      closeWithoutGuard();
    }
  };

  useEffect(() => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setSkipCooldown(false);
    setEmailError(null);
    setLoading(false);
  }, [applicationId]);

  const rejectButtonText = isCustomEmailOpen
    ? 'Reject with Custom Note'
    : 'Reject Grant';

  const rejectingText = isCustomEmailOpen
    ? 'Rejecting with Custom Note'
    : 'Rejecting';

  return (
    <>
      <Dialog
        open={rejectIsOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent className="m-0 p-0" hideCloseIcon>
          <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
            Reject Grant Payment
          </DialogTitle>
          <Separator />
          <div className="px-6 pb-6 text-[0.95rem]">
            <p className="mb-4 text-slate-500">
              You are about to reject {granteeName}&apos;s grant request. They
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

            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Apply 30-day cooldown
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Turn off to let them reapply immediately.
                </p>
              </div>
              <Switch
                checked={!skipCooldown}
                disabled={loading}
                onCheckedChange={(checked) => setSkipCooldown(!checked)}
              />
            </div>

            {enableCustomEmail && isCustomEmailOpen && (
              <CustomNoteEditor
                id="reject-grant-custom-note"
                value={customNote}
                previewHtml={previewEmailBody}
                emailType="rejection"
                error={emailError}
                onChange={(value) => {
                  const sanitizedNote = sanitizeCustomEmailBody(value);
                  setCustomNote(value);
                  setEmailError(
                    validateCustomEmailNote({
                      noteHtml: value,
                      fullEmailHtml: getGrantRejectedEmailBody({
                        granteeName,
                        grantTitle,
                        projectTitle,
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
                    'flex-1 border border-red-500 bg-red-50 text-red-600 hover:bg-red-100',
                    enableCustomEmail
                      ? 'rounded-l-lg rounded-r-none'
                      : 'rounded-lg',
                  )}
                  disabled={
                    loading ||
                    (enableCustomEmail &&
                      isCustomEmailOpen &&
                      (!getCustomEmailPlainText(customNote) || !!emailError))
                  }
                  onClick={rejectGrant}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner mr-2" />
                      <span>{rejectingText}</span>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full bg-red-600 p-0.5">
                        <X className="size-2 text-white" />
                      </div>
                      <span>{rejectButtonText}</span>
                    </>
                  )}
                </Button>
                {enableCustomEmail && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        className="rounded-l-none rounded-r-lg border border-l-0 border-red-500 bg-red-50 px-2 text-red-600 hover:bg-red-100"
                        disabled={loading}
                        aria-label="Reject options"
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
                          Reject with custom note
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
