import { Button } from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  async function inviteToScout(userId: string) {
    setLoading(true);
    try {
      await axios.post(`/api/listings/scout/invite/${bountyId}/${userId}`);
      setInvited(userId);
      posthog.capture('invited talent_scout', {
        invitedUser: userId,
      });
      const invites = invitesLeft - 1;
      toast.success(
        `Invite sent. ${invites} Invite${invites === 1 ? '' : 's'} Remaining`,
      );
    } catch (err) {
      toast.error('Invite failed, please try again later');
      console.log(err);
    }
    setLoading(false);
  }

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
      isLoading={loading}
      onClick={async () => {
        await inviteToScout(userId);
      }}
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
