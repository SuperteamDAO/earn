import { Box } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

interface BountyDetailsProps {
  slug: string;
}

interface Bounty {
  title: string;
}

function BountyDetails({ slug }: BountyDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bounty, setBounty] = useState<Bounty | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    const getBounty = async () => {
      try {
        const bountyDetails = await axios.get(`/api/bounties/${slug}`);
        console.log(
          'file: index.tsx:25 ~ getBounty ~ bountyDetails.data:',
          bountyDetails.data
        );
        setBounty(bountyDetails.data);
      } catch (e) {
        console.log('file: index.tsx:20 ~ getBounty ~ e:', e);
        setError(true);
      }
      setIsLoading(false);
    };
    getBounty();
  }, []);

  if (isLoading) return <Box>Loading...</Box>;

  if (error) return <Box>Error! Please try again or contact support</Box>;

  return <Box>Hello {bounty?.title}</Box>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default BountyDetails;
