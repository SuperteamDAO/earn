import { Box, Grid, HStack, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import React, { useState } from 'react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Grant, GrantsHeader } from '@/features/grants';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { getURL } from '@/utils/validUrl';

interface GrantsDetailsProps {
  grant: Grant | null;
}

const ReferenceCard = ({ link }: { link?: string }) => {
  if (!link) return <></>;
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

function Grants({ grant: initialGrant }: GrantsDetailsProps) {
  const [grant] = useState<typeof initialGrant>(initialGrant);
  const encodedTitle = encodeURIComponent(initialGrant?.title || '');

  return (
    <Default
      meta={
        <Head>
          <title>{`References | ${
            initialGrant?.title || 'Grant'
          } | Superteam Earn`}</title>
          <meta
            property="og:title"
            content={`${initialGrant?.title || 'Grant'} | Superteam Earn`}
          />
          <meta
            property="og:image"
            content={`${getURL()}api/dynamic-og/grant/?title=${encodedTitle}&token=${initialGrant?.token}&sponsor=${initialGrant?.sponsor?.name}&logo=${initialGrant?.sponsor?.logo}&minReward=${initialGrant?.minReward}&maxReward=${initialGrant?.maxReward}&isSponsorVerified=${initialGrant?.sponsor?.isVerified}`}
          />
          <meta
            name="twitter:title"
            content={`${initialGrant?.title || 'Grant'} | Superteam Earn`}
          />
          <meta
            name="twitter:image"
            content={`${getURL()}api/dynamic-og/grant/?title=${encodedTitle}&token=${initialGrant?.token}&sponsor=${initialGrant?.sponsor?.name}&logo=${initialGrant?.sponsor?.logo}&minReward=${initialGrant?.minReward}&maxReward=${initialGrant?.maxReward}&isSponsorVerified=${initialGrant?.sponsor?.isVerified}`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Superteam Grant" />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      {grant === null && <LoadingSection />}
      {grant !== null && !grant?.id && <EmptySection />}
      {grant !== null && !!grant?.id && (
        <>
          <GrantsHeader
            title={grant?.title ?? ''}
            sponsor={grant?.sponsor as SponsorType}
            status={grant?.status}
            region={grant?.region}
            slug={grant?.slug}
            references={grant.references}
          />

          <Box mx={4}>
            <HStack
              align={['center', 'center', 'start', 'start']}
              justify={['center', 'center', 'space-between', 'space-between']}
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
                  {grant.references?.map((reference, i) => (
                    <ReferenceCard link={reference.link} key={i} />
                  ))}
                </Grid>
              </Box>
            </HStack>
          </Box>
        </>
      )}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let grantData;
  try {
    const grantDetails = await axios.get(`${getURL()}api/grants/${slug}`);
    grantData = grantDetails.data;
  } catch (e) {
    console.error(e);
    grantData = null;
  }

  return {
    props: {
      grant: grantData,
    },
  };
};
export default Grants;
