import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
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
import { type ListingWithSubmissions } from '@/features/listings/types';
import { useUser } from '@/store/user';

interface DeleteDraftModalProps {
  deleteDraftIsOpen: boolean;
  deleteDraftOnClose: () => void;
  listingId: string | undefined;
  listingType: string | undefined;
}

export const DeleteDraftModal = ({
  listingId,
  deleteDraftIsOpen,
  deleteDraftOnClose,
  listingType,
}: DeleteDraftModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (listingType === 'grant') {
        await axios.post(`/api/grants/delete/${listingId}`);
      } else {
        await axios.post(`/api/listings/delete/${listingId}`);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<ListingWithSubmissions[]>(
        ['dashboard', user?.currentSponsorId],
        (oldData) => (oldData ? oldData.filter((x) => x.id !== listingId) : []),
      );
      toast.success('Draft deleted successfully');
      deleteDraftOnClose();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete draft. Please try again.');
    },
  });

  const deleteSelectedDraft = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={deleteDraftIsOpen} onOpenChange={deleteDraftOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Draft?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-slate-500">
            Are you sure you want to delete this draft listing?
          </DialogDescription>
          <DialogDescription className="text-slate-500">
            Note: If this was previously a published listing, all submissions or
            applications received for this listing will also be deleted.
          </DialogDescription>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={deleteDraftOnClose} className="mr-4">
            Close
          </Button>

          <Button
            variant="default"
            disabled={deleteMutation.isPending}
            onClick={deleteSelectedDraft}
          >
            {deleteMutation.isPending ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
