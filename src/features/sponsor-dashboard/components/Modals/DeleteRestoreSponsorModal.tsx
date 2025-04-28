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
import type { SponsorType } from '@/interface/sponsor';

interface DeleteRestoreSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsor: SponsorType | undefined;
  onSuccess: () => void;
}

export const DeleteRestoreSponsorModal = ({
  isOpen,
  onClose,
  sponsor,
  onSuccess,
}: DeleteRestoreSponsorModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isDeleted = sponsor?.isArchived;

  const handleDelete = async () => {
    if (!sponsor) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        '/api/sponsor-dashboard/god/toggle-sponsor-archived',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: sponsor.id,
            isArchived: true,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Sponsor deleted successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to delete sponsor');
      }
    } catch (error) {
      console.error('Sponsor deletion error:', error);
      toast.error('An error occurred while deleting the sponsor');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!sponsor) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        '/api/sponsor-dashboard/god/toggle-sponsor-archived',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: sponsor.id,
            isArchived: false,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Sponsor restored successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to restore sponsor');
      }
    } catch (error) {
      console.error('Sponsor restoration error:', error);
      toast.error('An error occurred while restoring the sponsor');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            [GOD MODE] {isDeleted ? 'Restore' : 'Delete'} Sponsor
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isDeleted
              ? `This will restore the sponsor `
              : `This will hide the sponsor and their listings from public view `}
            <span className="font-medium">{sponsor?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">
            {isDeleted
              ? 'Restoring this sponsor will make it and its listings visible again.'
              : 'Deleting this sponsor will hide it and its listings from the public.'}
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
                  Restore Sponsor
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
                  Delete Sponsor
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
