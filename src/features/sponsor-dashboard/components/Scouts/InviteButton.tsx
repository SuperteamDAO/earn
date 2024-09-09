import { Button } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import { LuCheck, LuPlus } from 'react-icons/lu';
import { toast } from 'sonner';

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
  const posthog = usePostHog();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `/api/listings/scout/invite/${bountyId}/${userId}`,
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
      className="ph-no-capture"
      gap={2}
      h="full"
      color="brand.purple"
      fontSize="xs"
      bg="#E0E7FF"
      _disabled={{
        bg: 'brand.slate.100',
        color: 'brand.slate.400',
        cursor: 'not-allowed',
      }}
      isDisabled={invited || maxInvitesReached}
      isLoading={inviteMutation.isPending}
      onClick={handleInvite}
    >
      {invited ? (
        <>
          <LuCheck strokeLinecap="square" strokeWidth={3} /> Invited
        </>
      ) : (
        <>
          <LuPlus strokeLinecap="square" strokeWidth={3} /> Invite
        </>
      )}
    </Button>
  );
}
