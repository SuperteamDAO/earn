import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { InKindRewardDisplay } from '@/features/listings/components/InKindRewardDisplay';
import { type Listing, type Rewards } from '@/features/listings/types';

interface Props {
  bounty: Listing;
  submission: SubmissionWithUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FulfillInKindRewardModal({
  bounty,
  submission,
  isOpen,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReference(submission?.inKindFulfillment?.reference ?? '');
      setNotes(submission?.inKindFulfillment?.notes ?? '');
    }
  }, [isOpen, submission]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(
        '/api/sponsor-dashboard/submission/fulfill-in-kind',
        {
          submissionId: submission?.id,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['sponsor-submissions', bounty.slug],
        }),
        queryClient.invalidateQueries({
          queryKey: ['sponsor-dashboard-listing', bounty.slug],
        }),
      ]);
      toast.success(`${bounty.inKindReward?.name} marked as fulfilled`);
      onClose();
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : undefined;
      toast.error(message || 'Could not mark the reward as fulfilled');
    },
  });

  if (!submission || !bounty.inKindReward) return null;

  const winnerName =
    [submission.user.firstName, submission.user.lastName]
      .filter(Boolean)
      .join(' ') ||
    submission.user.username ||
    'Winner';
  const quantity =
    submission.inKindFulfillment?.quantity ??
    bounty.rewards?.[submission.winnerPosition as keyof Rewards] ??
    0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark reward as fulfilled</DialogTitle>
          <DialogDescription>
            Confirm that the in-kind reward has been delivered to {winnerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <InKindRewardDisplay item={bounty.inKindReward} quantity={quantity} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fulfillment-reference">Delivery reference</Label>
          <Input
            id="fulfillment-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            maxLength={500}
            placeholder="Ticket ID, email confirmation, or link"
            autoComplete="off"
          />
          <p className="text-xs text-slate-500">
            Optional. Add a reference that helps your team verify delivery.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fulfillment-notes">Internal notes</Label>
          <Textarea
            id="fulfillment-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={5000}
            placeholder="Add any fulfillment details"
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending ? (
              'Saving...'
            ) : (
              <>
                <Check className="size-4" aria-hidden="true" />
                Mark as fulfilled
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
