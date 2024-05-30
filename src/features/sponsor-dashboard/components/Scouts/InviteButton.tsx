import { Button } from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { LuCheck, LuPlus } from 'react-icons/lu';

interface Props {
  bountyId: string;
  userId: string;
  invited: boolean;
  setInvited: (value: string) => void;
}
export function InviteButton({ bountyId, userId, invited, setInvited }: Props) {
  const posthog = usePostHog();

  const [loading, setLoading] = useState(false);

  async function inviteToScout(userId: string) {
    setLoading(true);
    try {
      await axios.post(`/api/bounties/scout/invite/${bountyId}/${userId}`);
      setInvited(userId);
      posthog.capture('invited talent_scout', {
        invitedUser: userId,
      });
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
      isDisabled={invited}
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
