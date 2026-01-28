import { X } from 'lucide-react';
import posthog from 'posthog-js';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getTokenIcon } from '@/constants/tokenList';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  token: string;
  onRejectGrant: (applicationId: string) => void;
}

export const RejectGrantApplicationModal = ({
  applicationId,
  rejectIsOpen,
  rejectOnClose,
  ask,
  granteeName,
  token,
  onRejectGrant,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      posthog.capture('reject_grant application');
      await onRejectGrant(applicationId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

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
              <img
                className="h-5 w-5 rounded-full"
                alt={`${token} icon`}
                src={getTokenIcon(token)}
              />
              <p className="ml-1 font-semibold text-slate-600">
                {ask} <span className="text-slate-400">{token}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={rejectOnClose} disabled={loading}>
              Close
            </Button>
            <Button
              className="flex-1 rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
              disabled={loading}
              onClick={rejectGrant}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Rejecting</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-red-600 p-0.5">
                    <X className="size-2 text-white" />
                  </div>
                  <span>Reject Grant</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
