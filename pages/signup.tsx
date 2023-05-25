import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import InviteView from '@/components/Members/InviteView';
import ErrorSection from '@/components/shared/ErrorSection';
import LoadingSection from '@/components/shared/LoadingSection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface Props {
  invite: string;
}

function SignUp({ invite }: Props) {
  const { userInfo } = userStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<any>();
  const isUserPresent =
    !!userInfo?.isTalentFilled || !!userInfo?.currentSponsorId;

  const getInvite = async () => {
    setIsLoading(true);
    try {
      const result = await axios.get('/api/invite/', {
        params: {
          invite,
        },
      });
      if (!result.data) {
        setIsError(true);
      } else {
        setInviteInfo(result.data);
      }
      setIsLoading(false);
    } catch (e) {
      setIsError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invite) {
      getInvite();
    } else {
      setIsError(true);
      setIsLoading(false);
    }
  }, [invite]);

  return (
    <Default
      meta={
        <Meta
          title="Signup | Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="/assets/logo/og.svg"
        />
      }
    >
      {!!isUserPresent && (
        <ErrorSection
          title="Already Signed In!"
          message="Please log out and then click on the invite link."
        />
      )}
      {!isUserPresent && isLoading && <LoadingSection />}
      {!isUserPresent && !isLoading && isError && (
        <ErrorSection
          title="Invalid Invite!"
          message="You invite is either invalid or expired. Please try again."
        />
      )}
      {!isUserPresent && !isLoading && !isError && (
        <InviteView invite={inviteInfo} />
      )}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { invite } = context.query;
  return {
    props: { invite: invite || undefined },
  };
};

export default SignUp;
