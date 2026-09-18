import { useMutation } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react';
import posthog from 'posthog-js';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

interface Props {
  bountyId: string;
  userId: string;
  invited: boolean;
  setInvited: (value: string) => void;
  maxInvitesReached: boolean;
  invitesLeft: number;
}

export function InviteButton({
  bountyId,
  userId,
  invited,
  setInvited,
  maxInvitesReached,
  invitesLeft,
}: Props) {
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/api/sponsor-dashboard/listing/${bountyId}/scout/invite/${userId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      setInvited(userId);
      posthog.capture('invited talent_scout', {
        invitedUser: userId,
      });
      const invites = invitesLeft - 1;
      toast.success(
        `Invite sent. ${invites} Invite${invites === 1 ? '' : 's'} Remaining`,
      );
    },
    onError: (error) => {
      console.error('Invite error:', error);
      toast.error('Invite failed, please try again later');
    },
  });

  const handleInvite = () => {
    inviteMutation.mutate();
  };

  return (
    <Button
      onClick={handleInvite}
      disabled={invited || maxInvitesReached || inviteMutation.isPending}
      className={cn(
        'ph-no-capture h-full gap-2 text-xs transition-colors',
        invited
          ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
          : inviteMutation.isPending
            ? 'border border-brand-purple bg-brand-purple text-white shadow-sm'
            : 'border border-brand-purple bg-white text-brand-purple hover:bg-brand-purple hover:text-white active:bg-brand-purple active:text-white',
        'disabled:cursor-not-allowed disabled:opacity-100',
      )}
      variant="outline"
    >
      {invited ? (
        <>
          <Check strokeLinecap="square" strokeWidth={3} />
          <span>Invited</span>
        </>
      ) : (
        <>
          <Plus strokeLinecap="square" strokeWidth={3} />
          <span>Invite</span>
        </>
      )}
    </Button>
  );
}
