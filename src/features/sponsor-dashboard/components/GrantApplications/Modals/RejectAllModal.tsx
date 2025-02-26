import { X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  applicationIds: string[];
  onRejectGrant: (applicationId: string[]) => void;
}

export const RejectAllGrantApplicationModal = ({
  rejectIsOpen,
  rejectOnClose,
  onRejectGrant,
  applicationIds,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    setLoading(true);
    try {
      await onRejectGrant(applicationIds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md font-semibold text-slate-500">
            Reject Grant Payment
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="text-[0.95rem] font-medium">
          <p className="ml-3 text-slate-500">
            You are about to reject {applicationIds.length} grant request. They
            will be notified via email.
          </p>

          <br />

          <Button
            className="mb-3 w-full bg-rose-600 text-white hover:bg-rose-600/90"
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
                <div className="mr-2 rounded-full bg-white p-[5px]">
                  <X className="h-2.5 w-2.5 text-rose-600" />
                </div>
                Reject Grant
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
