import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import {
  type Listing,
  type ListingWithSubmissions,
} from '@/features/listings/types';
import { unpublishAllowedQuery } from '@/features/sponsor-dashboard/queries/unpublish-allowed';

interface UnpublishModalProps {
  unpublishIsOpen: boolean;
  unpublishOnClose: () => void;
  listingId: string | undefined;
  listingSlug: string | undefined;
  listingType: Listing['type'] | undefined;
}

export const UnpublishModal = ({
  unpublishIsOpen,
  unpublishOnClose,
  listingId,
  listingSlug,
  listingType,
}: UnpublishModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: isUnpublishAllowed, isFetching } = useQuery({
    ...unpublishAllowedQuery(listingId || ''),
    enabled: !!listingId && listingType === 'project',
    initialData: listingType === 'project' ? false : true,
  });

  const updateMutation = useMutation({
    mutationFn: async (status: boolean) => {
      if (!isUnpublishAllowed) throw new Error('Unpublish not allowed');
      let result;
      if (listingType === 'grant') {
        result = await api.post(`/api/grants/update/${listingId}/`, {
          isPublished: status,
        });
      } else {
        result = await api.post(`/api/listings/unpublish/${listingId}/`);
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

  const dialogContent: { header: string; subtext: string } = useMemo(() => {
    if (isUnpublishAllowed) {
      return {
        header: 'Unpublish Listing?',
        subtext:
          'This listing will be hidden from the homepage once unpublished. Are you sure you want to unpublish this listing?',
      };
    } else {
      return {
        header: 'Accept/Reject applications before unpublishing',
        subtext:
          'You must either pick a winner or reject all applications before unpublishing this Project listing. It takes a few minutes to do so, but it makes sure that applicants hear back and retain trust on your future listings',
      };
    }
  }, [isUnpublishAllowed]);

  return (
    <Dialog open={unpublishIsOpen} onOpenChange={unpublishOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isFetching ? (
              <Skeleton className="h-5 w-3/4" />
            ) : (
              dialogContent.header
            )}
          </DialogTitle>
          <DialogDescription className="pt-2 text-slate-500">
            {isFetching ? (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              dialogContent.subtext
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={unpublishOnClose} className="mr-4">
            Close
          </Button>
          {isFetching && <Skeleton className="h-10 w-24" />}
          {!isFetching && isUnpublishAllowed && (
            <Button
              variant="default"
              disabled={updateMutation.isPending}
              onClick={() => changeBountyStatus(false)}
            >
              {updateMutation.isPending ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Unpublishing...</span>
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  <span>Unpublish</span>
                </>
              )}
            </Button>
          )}
          {!isFetching && !isUnpublishAllowed && (
            <Button asChild>
              <Link
                href={`/dashboard/${listingType === 'grant' ? 'grants' : 'listings'}/${listingSlug}/submissions`}
              >
                Review Applications
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
