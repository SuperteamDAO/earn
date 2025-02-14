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
  submissionIds: string[];
  onRejectSubmission: (submissionId: string[]) => void;
  allSubmissionsLength: number;
}

export const RejectAllSubmissionModal = ({
  rejectIsOpen,
  rejectOnClose,
  onRejectSubmission,
  submissionIds,
  allSubmissionsLength,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectSubmission = async () => {
    setLoading(true);
    try {
      await onRejectSubmission(submissionIds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  const rejectingAll = submissionIds.length === allSubmissionsLength;

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md font-semibold text-slate-500">
            {rejectingAll
              ? 'Reject All Remaining Applications?'
              : `Reject Application${submissionIds.length > 1 ? 's' : ''}`}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="text-[0.95rem] font-medium">
          <p className="mt-3 text-slate-500">
            {rejectingAll
              ? `You are about to reject all ${submissionIds.length} of the remaining applications for this Project listing. This action cannot be undone. Are you sure you want to proceed?`
              : `You are about to reject ${submissionIds.length} application${submissionIds.length > 1 ? 's' : ''}.
             They will be notified via email.`}
          </p>

          <br />

          <Button
            className="mb-3 w-full bg-rose-600 text-white hover:bg-rose-600/90"
            disabled={loading}
            onClick={rejectSubmission}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Rejecting
              </>
            ) : (
              <>
                <div className="mr-2 rounded-full bg-white p-[5px]">
                  <X className="h-2.5 w-2.5 text-rose-600" />
                </div>
                Reject {`Application${submissionIds.length > 1 ? 's' : ''}`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
