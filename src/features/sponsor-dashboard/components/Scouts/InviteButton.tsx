import { Button } from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    console.log('user id is', userId, invited);
  }, [invited]);

  async function inviteToScout(userId: string) {
    setLoading(true);
    try {
      const a = await axios.post(
        `/api/bounties/scout/invite/${bountyId}/${userId}`,
      );
      console.log('invite - ', a.data);
      setInvited(userId);
      posthog.capture('invite scout', {
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
