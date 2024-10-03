import { Box, Grid, HStack, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';

import { type Listing, ReferenceCard } from '@/features/listings';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Listing | null;
}

function BountyDetails({ bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout isTemplate bounty={bounty}>
      <Box>
        <HStack
          align={['center', 'center', 'start', 'start']}
          justify={['center', 'center', 'space-between', 'space-between']}
          flexDir={['column', 'column', 'row', 'row']}
          gap={4}
          mt={6}
          mb={10}
          bg="white"
          rounded="lg"
        >
          <Box w="full">
            <Text mt={2} mb={6} color="gray.500" fontSize="xl" fontWeight={600}>
              References
            </Text>
            <Grid
              gap={6}
              templateColumns={{
                base: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
            >
              {bounty?.references?.map((reference, i) => (
                <ReferenceCard
                  title={reference.title}
                  link={reference.link}
                  key={i}
                />
              ))}
            </Grid>
          </Box>
        </HStack>
      </Box>
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/templates/${slug}/`,
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
