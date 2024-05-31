import { Box, Grid, HStack, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Grant, GrantsHeader } from '@/features/grants';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface GrantsDetailsProps {
  slug: string;
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

const Grants = ({ slug }: GrantsDetailsProps) => {
  const [grants, setGrants] = useState<Grant | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const posthog = usePostHog();

  const getGrants = async () => {
    setIsLoading(true);
    try {
      const grantsDetails = await axios.post('/api/grants/getGrantBySlug', {
        slug,
      });

      setGrants(grantsDetails.data);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    posthog.capture('open_grant');
    getGrants();
  }, []);

  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
          />
        }
      >
        {isLoading && <LoadingSection />}
        {!isLoading && !!error && <EmptySection />}
        {!isLoading && !error && !grants?.id && (
          <EmptySection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isLoading && !error && !!grants?.id && (
          <>
            <GrantsHeader
              title={grants?.title ?? ''}
              sponsor={grants?.sponsor as SponsorType}
              status={grants?.status}
              region={grants?.region}
              slug={grants?.slug}
              references={grants.references}
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
                    {grants.references?.map((reference, i) => (
                      <ReferenceCard link={reference.link} key={i} />
                    ))}
                  </Grid>
                </Box>
              </HStack>
            </Box>
          </>
        )}
      </Default>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  return {
    props: { slug: id },
  };
};
export default Grants;
