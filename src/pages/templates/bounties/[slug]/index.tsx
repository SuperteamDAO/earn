import { HStack, VStack } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import { BountyWinners } from '@/components/listings/bounty/BountyWinners';
import { DetailDescriptionBounty } from '@/components/listings/listings/details/detailDescriptionBounty';
import { ListingHeader } from '@/components/listings/listings/ListingHeaderBounty';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface BountyDetailsProps {
  slug: string;
}

function BountyDetails({ slug }: BountyDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [bounty, setBounty] = useState<any | null>(null);
  const getBounty = async () => {
    setIsLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bountiesTemplates/${slug}/`);
      setBounty(bountyDetails.data);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getBounty();
  }, []);

  return (
    <Default
      meta={
        <Meta
          title={`${bounty?.title || 'Bounty'} | Superteam Earn`}
          description="Every crypto opportunity in one place!"
        />
      }
    >
      {isLoading && <LoadingSection />}
      {!isLoading && !!error && <ErrorSection />}
      {!isLoading && !error && !bounty?.id && (
        <ErrorSection message="Sorry! The bounty you are looking for is not available." />
      )}
      {!isLoading && !error && !!bounty?.id && (
        <>
          <ListingHeader
            type={bounty?.type}
            region={(bounty?.region as Regions) || Regions.GLOBAL}
            id={bounty?.id}
            status={bounty?.status}
            deadline={bounty?.deadline}
            title={bounty?.title ?? ''}
            sponsor={bounty?.sponsor}
            slug={bounty?.slug}
            isWinnersAnnounced={bounty?.isWinnersAnnounced}
            isTemplate={true}
            references={bounty?.references}
          />
          {bounty?.isWinnersAnnounced && <BountyWinners bounty={bounty} />}
          <HStack
            align={['center', 'center', 'start', 'start']}
            justify={['center', 'center', 'space-between', 'space-between']}
            flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
            gap={4}
            maxW={'7xl'}
            mx={'auto'}
            mb={10}
          >
            <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={10}>
              <DetailDescriptionBounty
                skills={bounty?.skills?.map((e: any) => e.skills) ?? []}
                description={bounty?.description}
              />
            </VStack>
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
