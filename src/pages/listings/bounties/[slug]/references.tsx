import { Box, Grid, HStack, Text } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';

import ListingHeader from '@/components/listings/listings/ListingHeaderBounty';
import OgImageViewer from '@/components/misc/ogImageViewer';
import ErrorSection from '@/components/shared/ErrorSection';
import type { Bounty } from '@/interface/bounty';
import { Default } from '@/layouts/Default';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Bounty | null;
}

const ReferenceCard = ({ link }: { link: string }) => {
  return (
    <Box
      w="100%"
      borderWidth="2px"
      borderColor={'gray.200'}
      borderRadius={8}
      cursor="pointer"
      onClick={() => window.open(link, '_blank')}
    >
      <OgImageViewer
        externalUrl={link}
        w={{ base: '100%', md: '400px' }}
        h={{ base: '200px', md: '280px' }}
        objectFit="cover"
        borderRadius={6}
      />
    </Box>
  );
};

function BountyDetails({ bounty: initialBounty }: BountyDetailsProps) {
  const [bounty] = useState<typeof initialBounty>(initialBounty);

  return (
    <Default
      meta={
        <Head>
          <title>{`References | ${
            initialBounty?.title || 'Bounty'
          } | Superteam Earn`}</title>
          <meta
            property="og:title"
            content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
          />
          <meta
            property="og:image"
            content={`https://earn.superteam.fun/api/ognew/?title=${initialBounty?.title}&reward=${initialBounty?.rewardAmount}&token=${initialBounty?.token}&sponsor=${initialBounty?.sponsor?.name}&logo=${initialBounty?.sponsor?.logo}&type=${initialBounty?.type}`}
          />
          <meta
            name="twitter:title"
            content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
          />
          <meta
            name="twitter:image"
            content={`https://earn.superteam.fun/api/ognew/?title=${initialBounty?.title}&reward=${initialBounty?.rewardAmount}&token=${initialBounty?.token}&sponsor=${initialBounty?.sponsor?.name}&logo=${initialBounty?.sponsor?.logo}&type=${initialBounty?.type}`}
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
      <Box>
        <>
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
                slug={bounty?.slug}
                region={bounty?.region || Regions.GLOBAL}
                isWinnersAnnounced={bounty?.isWinnersAnnounced}
                hackathonPrize={bounty?.hackathonprize}
                references={bounty?.references}
              />
              <Box mx={4}>
                <HStack
                  align={['center', 'center', 'start', 'start']}
                  justify={[
                    'center',
                    'center',
                    'space-between',
                    'space-between',
                  ]}
                  flexDir={['column', 'column', 'row', 'row']}
                  gap={4}
                  maxW={'7xl'}
                  mt={6}
                  mb={10}
                  mx={'auto'}
                  p={{ base: '2', md: '6' }}
                  bg="white"
                  rounded="lg"
                >
                  <Box w="full" mx={4}>
                    <Text
                      mt={2}
                      mb={6}
                      color="gray.500"
                      fontSize="xl"
                      fontWeight={600}
                    >
                      References
                    </Text>
                    <Grid
                      gap={4}
                      templateColumns={{
                        base: 'repeat(1, 1fr)',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      }}
                    >
                      {bounty.references?.map((reference, i) => (
                        <ReferenceCard link={reference.link} key={i} />
                      ))}
                    </Grid>
                  </Box>
                </HStack>
              </Box>
            </>
          )}
        </>
      </Box>
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
