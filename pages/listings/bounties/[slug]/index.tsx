import { HStack, VStack } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import { Comments } from '@/components/listings/listings/comments';
import DetailDescription from '@/components/listings/listings/details/detailDescriptionBounty';
import DetailSideCard from '@/components/listings/listings/details/detailSideCardBounty';
import ListingHeader from '@/components/listings/listings/ListingHeaderBounty';
import ErrorSection from '@/components/shared/ErrorSection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface BountyDetailsProps {
  slug: string;
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
        setBounty(bountyDetails.data);
      } catch (e) {
        setError(true);
      }
      setIsLoading(false);
    };
    getBounty();
  }, []);

  return (
    <Default
      meta={
        <Meta
          title={`${bounty?.title || 'Bounty'} | Superteam Earn`}
          description="Every Solana opportunity in one place!"
        />
      }
    >
      {isLoading && <LoadingSection />}
      {!isLoading && !!error && <ErrorSection />}
      {!isLoading && !error && (
        <>
          <ListingHeader
            id={bounty?.id}
            status={bounty?.status}
            deadline={bounty?.deadline}
            title={bounty?.title ?? ''}
            sponsor={bounty?.sponsor}
            poc={bounty?.poc}
          />
          <HStack
            align={['center', 'center', 'start', 'start']}
            justify={['center', 'center', 'space-between', 'space-between']}
            flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
            gap={4}
            maxW={'7xl'}
            mb={10}
            mx={'auto'}
          >
            <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={10}>
              <DetailDescription
                skills={bounty?.skills}
                description={bounty?.description}
              />
              <Comments refId={bounty?.id ?? ''} refType="BOUNTY" />
            </VStack>
            <DetailSideCard
              id={bounty?.id || ''}
              token={bounty?.token as string}
              eligibility={bounty?.eligibility}
              endingTime={bounty?.deadline ?? ''}
              prizeList={bounty?.rewards}
              total={bounty?.rewardAmount || 0}
            />
          </HStack>
        </>
      )}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default BountyDetails;
