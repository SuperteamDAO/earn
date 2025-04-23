import { AlertTriangle, RefreshCw, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SubmissionWithUser } from '@/interface/submission';

interface DeleteRestoreSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionWithUser | undefined;
  onSuccess: () => void;
}

export const DeleteRestoreSubmissionModal = ({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: DeleteRestoreSubmissionModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isDeleted = submission?.isArchived;

  const handleDelete = async () => {
    if (!submission) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        '/api/sponsor-dashboard/god/toggle-submission-archived',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: submission.id,
            isArchived: true,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission deleted successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Submission deletion error:', error);
      toast.error('An error occurred while deleting the submission');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!submission) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        '/api/sponsor-dashboard/god/toggle-submission-archived',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: submission.id,
            isArchived: false,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission restored successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to restore submission');
      }
    } catch (error) {
      console.error('Submission restoration error:', error);
      toast.error('An error occurred while restoring the submission');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            [GOD MODE] {isDeleted ? 'Restore' : 'Delete'} Submission
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isDeleted
              ? `This will restore the submission from `
              : `This will permanently delete the submission from `}
            <span className="font-medium">
              {submission?.user?.firstName} {submission?.user?.lastName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">
            {isDeleted
              ? 'Restoring this submission will make it visible again.'
              : 'Deleting this submission will hide it from the submission list.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="mr-4">
            Cancel
          </Button>
          {isDeleted ? (
            <Button
              variant="default"
              onClick={handleRestore}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Restore Submission
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-1 h-4 w-4" />
                  Delete Submission
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
