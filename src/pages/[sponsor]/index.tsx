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
import Head from 'next/head';
import { FaXTwitter } from 'react-icons/fa6';
import { MdOutlineInsertLink } from 'react-icons/md';

import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { Loading } from '@/components/shared/Loading';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { exclusiveSponsorData } from '@/constants';
import { GrantsCard } from '@/features/grants';
import { ListingSection, ListingTabs } from '@/features/listings';
import {
  sponsorGrantsQuery,
  sponsorListingsQuery,
} from '@/features/sponsor-dashboard';
import { type SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { getTwitterUrl, getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

interface Props {
  slug: string;
  title: string;
  description: string;
  sponsor: SponsorType;
}
const SponsorListingsPage = ({ slug, sponsor, title, description }: Props) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    sponsorListingsQuery(slug),
  );

  const { data: grants, isLoading: isGrantsLoading } = useQuery(
    sponsorGrantsQuery(slug),
  );

  const logo = sponsor.logo;
  const url = sponsor.url;
  const twitter = sponsor.twitter;
  const isVerified = sponsor.isVerified;
  const sSlug = sponsor.slug;

  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', logo || '');
  ogImage.searchParams.set('title', title || '');
  ogImage.searchParams.set('slug', sSlug || '');

  return (
    <Default
      className="bg-white"
      hideFooter
      meta={
        <Head>
          <title>{`${title} Opportunities | Superteam Earn`}</title>
          <meta
            name="description"
            content={`
Check out all of ${title}’s latest earning opportunities on a single page.
`}
          />
          <meta property="og:title" content={`${title} on Superteam Earn`} />
          <meta property="og:image" content={ogImage.toString()} />
          <meta name="twitter:title" content={`${title} on Superteam Earn`} />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content={`${title} on Superteam Earn`}
          />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            key="viewport"
          />
        </Head>
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
            <Center rounded="full">
              <Image h={'full'} alt="Category icon" rounded="full" src={logo} />
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
                @{sSlug}
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
                className="mt-2 text-slate-600"
                text={description}
              />
            </SkeletonText>
            <HStack gap={3} mt={3} color="#64748B">
              {url && (
                <Link
                  alignItems="center"
                  display="flex"
                  href={getURLSanitized(url)}
                  isExternal
                >
                  <Icon as={MdOutlineInsertLink} w={5} h={5} />
                </Link>
              )}
              {twitter && (
                <Link
                  alignItems="center"
                  display="flex"
                  href={getTwitterUrl(twitter)}
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
        <Box maxW="5xl" mx="auto" px={4} pb={20}>
          <ListingTabs
            bounties={listings?.bounties}
            isListingsLoading={isListingsLoading}
            title="Earning Opportunities"
            take={20}
            showNotifSub={false}
          />
          {!!grants && !!grants.length && (
            <ListingSection
              type="grants"
              title={`Grants`}
              sub="Equity-free funding opportunities for builders"
            >
              {isGrantsLoading && (
                <Flex
                  align="center"
                  justify="center"
                  direction="column"
                  minH={52}
                >
                  <Loading />
                </Flex>
              )}
              {!isGrantsLoading &&
                grants?.map((grant) => (
                  <GrantsCard grant={grant} key={grant.id} />
                ))}
            </ListingSection>
          )}
        </Box>
      </Box>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const sponsorSlug = params?.sponsor;

  if (typeof sponsorSlug !== 'string') {
    return {
      notFound: true,
    };
  }
  const sponsorExlusiveInfo = exclusiveSponsorData[sponsorSlug as string];
  if (!sponsorExlusiveInfo) {
    return {
      notFound: true,
    };
  }

  const sponsorInfo = await prisma.sponsors.findUnique({
    where: {
      name: sponsorExlusiveInfo.title,
    },
  });

  return {
    props: {
      slug: (sponsorSlug as string).toLowerCase(),
      sponsor: JSON.parse(JSON.stringify(sponsorInfo)),
      title: sponsorExlusiveInfo.title,
      description: sponsorExlusiveInfo.description,
    },
  };
};

export default SponsorListingsPage;
