import {
  Box,
  Center,
  Flex,
  HStack,
  Icon,
  Image,
  Link,
  SkeletonCircle,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { MdOutlineInsertLink } from 'react-icons/md';

import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ListingTabs } from '@/features/listings';
import { sponsorListingsQuery } from '@/features/sponsor-dashboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

const SponsorListingsPage = ({ slug }: { slug: string }) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    sponsorListingsQuery(slug),
  );

  const { title = '', description = '' } = listings?.sponsorInfo || {};

  // const [] = useState()
  //
  useEffect(() => {
    console.log('listings', listings);
  }, [listings]);

  const logo = listings?.bounties[0]?.sponsor?.logo;
  const url = listings?.bounties[0]?.sponsor?.url;
  const twitter = listings?.bounties[0]?.sponsor?.twitter;
  const isVerified = listings?.bounties[0]?.sponsor?.isVerified;

  return (
    <Default
      bg="white"
      hideFooter
      meta={
        <Meta
          title={`${title} Opportunities | Superteam Earn`}
          description={description}
        />
      }
    >
      <Flex px={4} bg="#F8FAFC">
        <Flex
          direction={{ md: 'row', base: 'column' }}
          gap={8}
          w={{ md: 'brand.120', base: '100%' }}
          maxW="5xl"
          h={{ md: 'auto', base: 'fit-content' }}
          mx={'auto'}
          py={14}
          rounded={10}
        >
          <SkeletonCircle w={28} h={28} isLoaded={!isListingsLoading}>
            <Center
              borderWidth={5}
              borderColor={'black'}
              borderRadius={'full'}
              rounded="full"
            >
              <Image h={'full'} alt="Category icon" src={logo} />
            </Center>
          </SkeletonCircle>
          <Box w={{ md: '80%', base: '100%' }}>
            <SkeletonText
              w={isListingsLoading ? '12rem' : 'auto'}
              mt={{ base: 4, md: '0' }}
              isLoaded={!isListingsLoading}
              noOfLines={1}
              skeletonHeight="1rem"
            >
              <HStack>
                <Text fontSize="xl" fontWeight={'600'}>
                  {title}
                </Text>
                {!!isVerified && (
                  <VerifiedBadge
                    style={{
                      width: '1rem',
                      height: '1rem',
                    }}
                  />
                )}
              </HStack>
            </SkeletonText>
            <SkeletonText
              w={isListingsLoading ? '6rem' : 'auto'}
              mt={isListingsLoading ? 3 : 0}
              isLoaded={!isListingsLoading}
              noOfLines={1}
              skeletonHeight="0.75rem"
            >
              <Text maxW="600px" color={'brand.slate.500'}>
                @{slug}
              </Text>
            </SkeletonText>
            <SkeletonText
              maxW="600px"
              mt={isListingsLoading ? 2 : 0}
              isLoaded={!isListingsLoading}
              noOfLines={2}
              spacing={2}
            >
              <LinkTextParser
                color={'brand.slate.600'}
                mt={2}
                text={description}
              />
            </SkeletonText>
            <HStack gap={3} mt={3} color="#64748B">
              {url && (
                <Link alignItems="center" display="flex" href={url} isExternal>
                  <Icon as={MdOutlineInsertLink} w={5} h={5} />
                </Link>
              )}
              {twitter && (
                <Link
                  alignItems="center"
                  display="flex"
                  href={twitter}
                  isExternal
                >
                  <Icon as={FaXTwitter} w={4} h={4} />
                </Link>
              )}
            </HStack>
          </Box>
        </Flex>
      </Flex>

      <Box w={'100%'} bg="white">
        <Box maxW="5xl" mx="auto" px={4}>
          <ListingTabs
            bounties={listings?.bounties}
            isListingsLoading={isListingsLoading}
            title="Bounties"
            take={20}
          />
        </Box>
      </Box>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  if (
    !params ||
    !params.sponsor ||
    !['solana-gaming', 'pyth', 'dreader', 'networkschool'].includes(
      (params.sponsor as string).toLowerCase(),
    )
  ) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug: (params.sponsor as string).toLowerCase() },
  };
};

export default SponsorListingsPage;
