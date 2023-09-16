import { HStack, VStack } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import axios from 'axios';
import { useAtom } from 'jotai';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';

import { bountySnackbarAtom } from '@/components/Header/BountySnackbar';
import BountyWinners from '@/components/listings/bounty/BountyWinners';
import { Comments } from '@/components/listings/listings/comments';
import DetailDescription from '@/components/listings/listings/details/detailDescriptionBounty';
import DetailSideCard from '@/components/listings/listings/details/detailSideCardBounty';
import ListingHeader from '@/components/listings/listings/ListingHeaderBounty';
import ErrorSection from '@/components/shared/ErrorSection';
import type { Bounty } from '@/interface/bounty';
import { Default } from '@/layouts/Default';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Bounty | null;
}

function BountyDetails({ bounty: initialBounty }: BountyDetailsProps) {
  const [, setBountySnackbar] = useAtom(bountySnackbarAtom);

  const [bounty] = useState<typeof initialBounty>(initialBounty);
  const [submissionNumber, setSubmissionNumber] = useState<number>(0);

  const getSubmissionsCount = async () => {
    try {
      const submissionCountDetails = await axios.get(
        `/api/submission/${bounty?.id}/count/`
      );
      setSubmissionNumber(submissionCountDetails?.data || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      await getSubmissionsCount();
      if (bounty) {
        setBountySnackbar({
          submissionCount: submissionNumber,
          deadline: bounty?.deadline,
          rewardAmount: bounty?.rewardAmount,
        });
      }
    };
    fetchSubmissions();
  }, [bounty, submissionNumber]);

  return (
    <Default
      meta={
        <Head>
          <title>{`${
            initialBounty?.title || 'Bounty'
          } | Superteam Earn`}</title>
          <meta
            property="og:title"
            content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
          />
          <meta
            property="og:image"
            content={`https://earn.superteam.fun/api/ognew/?title=${initialBounty?.title}&reward=${initialBounty?.rewardAmount}&token=${initialBounty?.token}&sponsor=${initialBounty?.sponsor?.name}&logo=${initialBounty?.sponsor?.logo}`}
          />
          <meta
            name="twitter:title"
            content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
          />
          <meta
            name="twitter:image"
            content={`https://earn.superteam.fun/api/ognew/?title=${initialBounty?.title}&reward=${initialBounty?.rewardAmount}&token=${initialBounty?.token}&sponsor=${initialBounty?.sponsor?.name}&logo=${initialBounty?.sponsor?.logo}`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Superteam Bounty" />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      {bounty === null && <ErrorSection />}
      {bounty !== null && !bounty?.id && (
        <ErrorSection message="Sorry! The bounty you are looking for is not available." />
      )}
      {bounty !== null && !!bounty?.id && (
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
            hackathonPrize={bounty?.hackathonprize}
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
              pocSocials={bounty?.pocSocials}
              hackathonPrize={bounty?.hackathonprize}
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
    const bountyDetails = await axios.get(`${getURL()}api/bounties/${slug}`);
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    props: {
      bounty: bountyData,
    },
  };
};

export default BountyDetails;
