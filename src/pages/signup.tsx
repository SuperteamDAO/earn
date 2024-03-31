import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { InviteView } from '@/features/sponsor-dashboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface Props {
  invite: string;
}

function SignUp({ invite }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<any>();

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
          title="Accept Invite | Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="https://earn.superteam.fun"
        />
      }
    >
      {isLoading && <LoadingSection />}
      {!isLoading && isError && (
        <ErrorSection
          title="Invalid Invite!"
          message="You invite is either invalid or expired. Please try again."
        />
      )}
      {!isLoading && !isError && <InviteView invite={inviteInfo} />}
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
