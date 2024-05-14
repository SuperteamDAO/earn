import { Box, Grid, HStack, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { type Bounty, ListingHeader } from '@/features/listings';
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
        w={'100%'}
        aspectRatio={1.91 / 1}
        objectFit="cover"
        borderRadius={6}
      />
    </Box>
  );
};

function BountyDetails({ bounty: initialBounty }: BountyDetailsProps) {
  const [bounty] = useState<typeof initialBounty>(initialBounty);
  const encodedTitle = encodeURIComponent(initialBounty?.title || '');

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
            content={`${getURL()}api/bounty-og/?title=${encodedTitle}&reward=${initialBounty?.rewardAmount}&token=${initialBounty?.token}&sponsor=${initialBounty?.sponsor?.name}&logo=${initialBounty?.sponsor?.logo}&type=${initialBounty?.type}&compensationType=${initialBounty?.compensationType}&minRewardAsk=${initialBounty?.minRewardAsk}&maxRewardAsk=${initialBounty?.maxRewardAsk}`}
          />
          <meta
            name="twitter:title"
            content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
          />
          <meta
            name="twitter:image"
            content={`${getURL()}api/bounty-og/?title=${encodedTitle}&reward=${initialBounty?.rewardAmount}&token=${initialBounty?.token}&sponsor=${initialBounty?.sponsor?.name}&logo=${initialBounty?.sponsor?.logo}&type=${initialBounty?.type}&compensationType=${initialBounty?.compensationType}&minRewardAsk=${initialBounty?.minRewardAsk}&maxRewardAsk=${initialBounty?.maxRewardAsk}`}
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
              <ListingHeader listing={bounty} />
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
                  maxW={'8xl'}
                  mx={'auto'}
                  mt={6}
                  mb={10}
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
