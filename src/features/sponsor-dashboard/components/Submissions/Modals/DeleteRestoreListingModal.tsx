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

import type { Listing } from '@/features/listings/types';

interface DeleteRestoreListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | undefined;
  onSuccess: () => void;
}

export const DeleteRestoreListingModal = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
}: DeleteRestoreListingModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isDeleted = listing?.isArchived;

  const handleDelete = async () => {
    if (!listing) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        '/api/sponsor-dashboard/god/toggle-listing-archived',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: listing.id,
            isArchived: true,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Listing deleted successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Listing deletion error:', error);
      toast.error('An error occurred while deleting the listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!listing) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        '/api/sponsor-dashboard/god/toggle-listing-archived',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: listing.id,
            isArchived: false,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Listing restored successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to restore listing');
      }
    } catch (error) {
      console.error('Listing restoration error:', error);
      toast.error('An error occurred while restoring the listing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            [GOD MODE] {isDeleted ? 'Restore' : 'Delete'} Listing
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isDeleted
              ? `This will restore the listing `
              : `This will hide the listing from the public view`}
            <span className="font-medium">{listing?.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">
            {isDeleted
              ? 'Restoring this listing will make it visible again.'
              : 'Deleting this listing will hide it from the listings list.'}
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
                  Restore Listing
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
                  Delete Listing
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
