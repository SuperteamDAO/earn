import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { type ListingWithSubmissions } from '@/features/listings/types';

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
        await api.post(`/api/grants/delete/${listingId}`);
      } else {
        await api.delete(`/api/sponsor-dashboard/listing/${listingId}/delete`);
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
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Delete Draft?
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-slate-500">
            Are you sure you want to delete this draft listing?
          </p>
          <p className="mb-4 text-slate-500">
            Note: If this was previously a published listing, all submissions or
            applications received for this listing will also be deleted.
          </p>

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button
              variant="ghost"
              onClick={deleteDraftOnClose}
              disabled={deleteMutation.isPending}
            >
              Close
            </Button>
            <Button
              className="flex-1 rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
              disabled={deleteMutation.isPending}
              onClick={deleteSelectedDraft}
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-red-600 p-0.5">
                    <Trash2 className="size-1 text-red-50" />
                  </div>
                  <span>Confirm</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
