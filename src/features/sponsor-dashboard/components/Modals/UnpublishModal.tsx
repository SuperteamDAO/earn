import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { EyeOff } from 'lucide-react';
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

interface UnpublishModalProps {
  unpublishIsOpen: boolean;
  unpublishOnClose: () => void;
  listingId: string | undefined;
  listingType: string | undefined;
}

export const UnpublishModal = ({
  unpublishIsOpen,
  unpublishOnClose,
  listingId,
  listingType,
}: UnpublishModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const updateMutation = useMutation({
    mutationFn: async (status: boolean) => {
      let result;
      if (listingType === 'grant') {
        result = await axios.post(`/api/grants/update/${listingId}/`, {
          isPublished: status,
        });
      } else {
        result = await axios.post(`/api/listings/unpublish/${listingId}/`);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ListingWithSubmissions[]>(
        ['dashboard', user?.currentSponsorId],
        (oldData) =>
          oldData
            ? oldData.map((listing) =>
                listing.id === data.id
                  ? { ...listing, isPublished: data.isPublished }
                  : listing,
              )
            : [],
      );
      toast.success('Listing unpublished successfully');
      unpublishOnClose();
    },
    onError: (error) => {
      console.error('Unpublish error:', error);
      toast.error('Failed to unpublish listing. Please try again.');
    },
  });

  const changeBountyStatus = (status: boolean) => {
    updateMutation.mutate(status);
  };

  return (
    <Dialog open={unpublishIsOpen} onOpenChange={unpublishOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unpublish Listing?</DialogTitle>
          <DialogDescription className="text-slate-500">
            This listing will be hidden from the homepage once unpublished. Are
            you sure you want to unpublish this listing?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={unpublishOnClose} className="mr-4">
            Close
          </Button>

          <Button
            variant="default"
            disabled={updateMutation.isPending}
            onClick={() => changeBountyStatus(false)}
          >
            {updateMutation.isPending ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Unpublishing...
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
