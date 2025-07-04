import { Flag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SubmissionLabels } from '@/interface/prisma/enums';

interface SpamConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | undefined;
  onConfirm: (id: string, label: SubmissionLabels) => void;
  isListing?: boolean;
}

export const SpamConfirmationDialog = ({
  isOpen,
  onClose,
  submissionId,
  onConfirm,
  isListing = true,
}: SpamConfirmationDialogProps) => {
  const handleConfirm = () => {
    if (!submissionId) return;
    onConfirm(submissionId, SubmissionLabels.Spam);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Mark this as spam?
        </DialogTitle>
        <Separator />
        <div className="space-y-4 px-6 pb-6 text-[0.95rem]">
          <div className="text-slate-500">
            {isListing ? (
              <>
                Marking a submission as &quot;Spam&quot; would deduct a
                submission credit from the applicant and flag it in our system.
              </>
            ) : (
              <>
                Marking a grant application as &quot;Spam&quot; would deduct a
                submission credit from the applicant and flag it in our system.
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-lg border border-orange-400 bg-orange-50 text-orange-500 hover:bg-orange-100"
              onClick={handleConfirm}
            >
              <Flag className="size-2 text-orange-500" />
              <span>Mark as Spam</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
