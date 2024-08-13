import { Box, Grid, HStack, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { type Listing } from '@/features/listings';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Listing | null;
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

function BountyDetails({ bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout bounty={bounty}>
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
            <Text mt={2} mb={6} color="gray.500" fontSize="xl" fontWeight={600}>
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
              {bounty?.references?.map((reference, i) => (
                <ReferenceCard link={reference.link} key={i} />
              ))}
            </Grid>
          </Box>
        </HStack>
      </Box>
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, type } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/details/${slug}`,
      {
        params: {
          type,
        },
      },
    );
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
