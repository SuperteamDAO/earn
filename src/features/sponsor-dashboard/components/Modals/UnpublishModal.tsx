'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { postJson } from '@/lib/fetch-json';

interface UnpublishModalProps {
  unpublishIsOpen: boolean;
  unpublishOnClose: () => void;
  listing: { id?: string | null; type?: string | null } | undefined;
}

export const UnpublishModal = ({
  unpublishIsOpen,
  unpublishOnClose,
  listing,
}: UnpublishModalProps) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const changeBountyStatus = async (status: boolean) => {
    if (!listing) return;
    setIsPending(true);
    try {
      if (listing.type === 'grant') {
        await postJson(`/api/grants/update/${listing.id}/`, {
          isPublished: status,
        });
      } else {
        await postJson(
          `/api/sponsor-dashboard/listing/${listing.id}/unpublish/`,
        );
      }
      router.refresh();
      toast.success('Listing unpublished successfully');
      unpublishOnClose();
    } catch (error) {
      console.error('Unpublish error:', error);
      toast.error('Failed to unpublish listing. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const dialogContent = {
    header: 'Unpublish Listing?',
    subtext:
      'This listing will be hidden from the homepage once unpublished. Are you sure you want to unpublish this listing?',
  };

  return (
    <Dialog open={unpublishIsOpen} onOpenChange={unpublishOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          {dialogContent.header}
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <div className="mb-4 text-slate-500">{dialogContent.subtext}</div>

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button
              variant="ghost"
              onClick={unpublishOnClose}
              disabled={isPending}
            >
              Close
            </Button>
            <Button
              className="flex-1 rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
              disabled={isPending}
              onClick={() => void changeBountyStatus(false)}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Unpublishing...</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-red-600 p-0.5">
                    <X className="size-2 text-white" />
                  </div>
                  <span>Unpublish</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
