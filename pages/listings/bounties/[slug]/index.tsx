import { HStack, VStack } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import BountyWinners from '@/components/listings/bounty/BountyWinners';
import { Comments } from '@/components/listings/listings/comments';
import DetailDescription from '@/components/listings/listings/details/detailDescriptionBounty';
import DetailSideCard from '@/components/listings/listings/details/detailSideCardBounty';
import ListingHeader from '@/components/listings/listings/ListingHeaderBounty';
import ErrorSection from '@/components/shared/ErrorSection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
import { Default } from '@/layouts/Default';
import { Mixpanel } from '@/utils/mixpanel';

interface BountyDetailsProps {
  slug: string;
  bounty: Bounty | null;
}

function BountyDetails({ slug, bounty: initialBounty }: BountyDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const getBounty = async () => {
    setIsLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      setBounty(bountyDetails.data);

      Mixpanel.track('bounty_page_load', {
        'Bounty Title': bountyDetails.data.title,
      });
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
        <head>
          <title>{`${
            initialBounty?.title || 'Bounty'
          } | Superteam Earn`}</title>
          <meta
            property="og:image"
            content={`https://earn-frontend-v2-git-feat-og-image-superteam-earn.vercel.app/api/ognew/?title=${initialBounty?.title}&reward=${initialBounty?.rewardAmount}&type=${initialBounty?.type}&sponsor=${initialBounty?.sponsor?.name}`}
          />
        </head>
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
            id={bounty?.id}
            status={bounty?.status}
            deadline={bounty?.deadline}
            title={bounty?.title ?? ''}
            sponsor={bounty?.sponsor}
            poc={bounty?.poc}
            slug={bounty?.slug}
            region={bounty?.region || Regions.GLOBAL}
            isWinnersAnnounced={bounty?.isWinnersAnnounced}
          />
          {bounty?.isWinnersAnnounced && <BountyWinners bounty={bounty} />}
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
                skills={bounty?.skills?.map((e) => e.skills) ?? []}
                description={bounty?.description}
              />
              <Comments refId={bounty?.id ?? ''} refType="BOUNTY" />
            </VStack>
            <DetailSideCard
              bountytitle={bounty.title ?? ''}
              id={bounty?.id || ''}
              token={bounty?.token ?? ''}
              eligibility={bounty?.eligibility}
              type={bounty?.type}
              endingTime={bounty?.deadline ?? ''}
              prizeList={bounty?.rewards}
              total={bounty?.rewardAmount || 0}
              applicationLink={bounty?.applicationLink || ''}
              requirements={bounty?.requirements}
              isWinnersAnnounced={bounty?.isWinnersAnnounced}
            />
          </HStack>
        </>
      )}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `https://beta.earn.superteam.fun/api/bounties/${slug}/`
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    props: {
      slug,
      bounty: bountyData,
    },
  };
};

export default BountyDetails;
