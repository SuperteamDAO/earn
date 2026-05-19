import { ChevronDown, X } from 'lucide-react';
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
import { TokenIcon } from '@/components/ui/token-icon';
import { cn } from '@/utils/cn';

import {
  getCustomEmailPlainText,
  sanitizeCustomEmailBody,
  validateCustomEmailNote,
} from '../../utils/customEmailSanitizer';
import { getTrancheRejectedEmailBody } from '../../utils/grantEmailCopy';
import { CustomNoteEditor } from '../GrantApplications/Modals/CustomNoteEditor';

interface RejectTrancheProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  trancheId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  projectTitle: string | null | undefined;
  sponsorName: string | null | undefined;
  salutation: string | null | undefined;
  token: string;
  enableCustomEmail: boolean;
  onRejectTranche: (trancheId: string, customNote?: string) => void;
}

export const RejectTrancheModal = ({
  trancheId,
  rejectIsOpen,
  rejectOnClose,
  ask,
  granteeName,
  projectTitle,
  sponsorName,
  salutation,
  token,
  enableCustomEmail,
  onRejectTranche,
}: RejectTrancheProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const previewEmailBody = getTrancheRejectedEmailBody({
    granteeName,
    projectTitle,
    sponsorName,
    salutation,
    reviewerNote: sanitizeCustomEmailBody(customNote),
  });

  const rejectTranche = async () => {
    if (!trancheId) return;

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
      await onRejectTranche(
        trancheId,
        enableCustomEmail && isCustomEmailOpen
          ? noteValidation.sanitized
          : undefined,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  useEffect(() => {
    setCustomNote('');
    setIsCustomEmailOpen(false);
    setEmailError(null);
    setLoading(false);
  }, [trancheId]);

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Reject Tranche Payment
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-slate-500">
            You are about to reject {granteeName}&apos;s tranche payment. They
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

          {enableCustomEmail && isCustomEmailOpen && (
            <CustomNoteEditor
              id="reject-tranche-custom-note"
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
                    fullEmailHtml: getTrancheRejectedEmailBody({
                      granteeName,
                      projectTitle,
                      sponsorName,
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
            <Button variant="ghost" onClick={rejectOnClose} disabled={loading}>
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
                onClick={rejectTranche}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    <span>
                      {isCustomEmailOpen
                        ? 'Rejecting with Custom Note'
                        : 'Rejecting'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-red-600 p-0.5">
                      <X className="size-2 text-white" />
                    </div>
                    <span>
                      {isCustomEmailOpen
                        ? 'Reject with Custom Note'
                        : 'Reject Tranche'}
                    </span>
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
                      aria-label="Reject tranche options"
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
  );
};
