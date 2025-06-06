import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
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
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { type ListingWithSubmissions } from '@/features/listings/types';

interface UnpublishModalProps {
  unpublishIsOpen: boolean;
  unpublishOnClose: () => void;
  listing: ListingWithSubmissions | undefined;
}

export const UnpublishModal = ({
  unpublishIsOpen,
  unpublishOnClose,
  listing,
}: UnpublishModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const updateMutation = useMutation({
    mutationFn: async (status: boolean) => {
      let result;
      if (listing?.type === 'grant') {
        result = await api.post(`/api/grants/update/${listing.id}/`, {
          isPublished: status,
        });
      } else {
        result = await api.post(`/api/listings/unpublish/${listing?.id}/`);
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

      queryClient.invalidateQueries({
        queryKey: ['sponsor-submissions', listing?.slug],
      });

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

  const dialogContent: { header: string; subtext: React.ReactNode } =
    listing?.type === 'project'
      ? {
          header: "Didn't find a suitable candidate?",
          subtext: (
            <>
              You can unpublish this listing if you have not found any suitable
              candidate.{' '}
              <span className="font-semibold text-slate-500">
                Unpublishing the listing will send rejection emails to all
                applicants.
              </span>
            </>
          ),
        }
      : {
          header: 'Unpublish Listing?',
          subtext:
            'This listing will be hidden from the homepage once unpublished. Are you sure you want to unpublish this listing?',
        };

  return (
    <Dialog open={unpublishIsOpen} onOpenChange={unpublishOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{dialogContent.header}</DialogTitle>
          <DialogDescription className="pt-2 text-base text-slate-500">
            {dialogContent.subtext}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={unpublishOnClose} className="mr-4">
            Close
          </Button>
          <Button
            variant="default"
            className="rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            disabled={updateMutation.isPending}
            onClick={() => changeBountyStatus(false)}
          >
            {updateMutation.isPending ? (
              <>
                <span className="loading loading-spinner" />
                <span>Unpublishing...</span>
              </>
            ) : (
              <>
                <X className="size-4" />
                <span>Unpublish</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
