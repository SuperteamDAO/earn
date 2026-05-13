import { ChevronDown, X } from 'lucide-react';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

import { RichEditor } from '@/components/shared/RichEditor';
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

import {
  getCustomEmailPlainText,
  validateCustomEmailBody,
} from '../../../utils/customEmailSanitizer';
import { getGrantRejectedEmailBody } from '../../../utils/grantEmailCopy';

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
  onRejectGrant: (applicationId: string, emailBody?: string) => void;
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
  const [emailBody, setEmailBody] = useState('');
  const [isCustomEmailOpen, setIsCustomEmailOpen] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const defaultEmailBody = getGrantRejectedEmailBody({
    granteeName,
    grantTitle,
    projectTitle,
    salutation,
  });

  const rejectGrant = async () => {
    if (!applicationId) return;

    const customEmailBody = emailBody.trim();
    const emailValidation = validateCustomEmailBody(customEmailBody);
    if (enableCustomEmail && isCustomEmailOpen && !emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    setLoading(true);
    try {
      posthog.capture('reject_grant application');
      await onRejectGrant(
        applicationId,
        enableCustomEmail && isCustomEmailOpen
          ? emailValidation.sanitized
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
    setEmailBody(defaultEmailBody);
    setIsCustomEmailOpen(false);
    setEmailError(null);
    setLoading(false);
  }, [applicationId, defaultEmailBody]);

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
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
                    setEmailError(null);
                  }}
                  disabled={loading || emailBody === defaultEmailBody}
                >
                  Reset
                </Button>
              </div>
              <RichEditor
                id="reject-grant-email-body"
                height="h-[190px]"
                value={emailBody}
                onChange={(value) => {
                  setEmailBody(value);
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
            <Button variant="ghost" onClick={rejectOnClose} disabled={loading}>
              Close
            </Button>
            <div className="flex flex-1">
              <Button
                className="flex-1 rounded-l-lg rounded-r-none border border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                disabled={
                  loading ||
                  (enableCustomEmail &&
                    isCustomEmailOpen &&
                    (!getCustomEmailPlainText(emailBody) || !!emailError))
                }
                onClick={rejectGrant}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    <span>
                      {isCustomEmailOpen
                        ? 'Rejecting with Custom Email'
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
                        ? 'Reject with Custom Email'
                        : 'Reject Grant'}
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
                        Reject with custom email
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
