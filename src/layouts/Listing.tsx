import { Box, Flex, HStack, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { useAtom } from 'jotai';
import Head from 'next/head';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { Comments } from '@/features/comments';
import {
  ExtraInfoSection,
  getListingTypeLabel,
  type Listing,
  ListingHeader,
  RightSideBar,
} from '@/features/listings';
import { bountySnackbarAtom } from '@/features/navbar';
import { type User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { getURL } from '@/utils/validUrl';

interface ListingPageProps {
  bounty: Listing | null;
  children: React.ReactNode;
}

export function ListingPageLayout({
  bounty: initialBounty,
  children,
}: ListingPageProps) {
  const [, setBountySnackbar] = useAtom(bountySnackbarAtom);
  const posthog = usePostHog();

  const [bounty] = useState<typeof initialBounty>(initialBounty);
  const [submissionNumber, setSubmissionNumber] = useState<number>(0);
  const [commentCount, setCommentCount] = useState(0);

  const getSubmissionsCount = async () => {
    try {
      const submissionCountDetails = await axios.get(
        `/api/listings/${bounty?.id}/submission-count/`,
      );
      setSubmissionNumber(submissionCountDetails?.data || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (bounty?.type === 'bounty') {
      posthog.capture('open_bounty');
    } else if (bounty?.type === 'project') {
      posthog.capture('open_project');
    }
  }, []);

  useEffect(() => {
    const fetchSubmissions = async () => {
      await getSubmissionsCount();
      if (bounty) {
        setBountySnackbar({
          submissionCount: submissionNumber,
          deadline: bounty?.deadline,
          rewardAmount: bounty?.rewardAmount,
          type: bounty?.type,
          isPublished: bounty?.isPublished,
        });
      }
    };
    fetchSubmissions();
  }, [bounty, submissionNumber]);

  const encodedTitle = encodeURIComponent(initialBounty?.title || '');
  const ogImage = new URL(`${getURL()}api/dynamic-og/listing/`);

  ogImage.searchParams.set('title', encodedTitle);
  ogImage.searchParams.set(
    'reward',
    initialBounty?.rewardAmount?.toString() || '',
  );
  ogImage.searchParams.set('token', initialBounty?.token || '');
  ogImage.searchParams.set('sponsor', initialBounty?.sponsor?.name || '');
  ogImage.searchParams.set('logo', initialBounty?.sponsor?.logo || '');
  ogImage.searchParams.set('type', initialBounty?.type || '');
  ogImage.searchParams.set(
    'compensationType',
    initialBounty?.compensationType || '',
  );
  ogImage.searchParams.set(
    'minRewardAsk',
    initialBounty?.minRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'maxRewardAsk',
    initialBounty?.maxRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'isSponsorVerified',
    initialBounty?.sponsor?.isVerified?.toString() || 'false',
  );

  return (
    <Default
      meta={
        <Head>
          <title>{`${
            initialBounty?.title || 'Apply'
          } by ${initialBounty?.sponsor?.name} | Superteam Earn Listing`}</title>
          <meta
            name="description"
            content={`${getListingTypeLabel(initialBounty?.type ?? 'Listing')} on Superteam Earn | ${
              initialBounty?.sponsor?.name
            } is seeking freelancers and builders ${
              initialBounty?.title
                ? `to work on ${initialBounty.title}`
                : '| Apply Here'
            }`}
          />
          <link
            rel="canonical"
            href={`${getURL()}listings/${bounty?.type}/${bounty?.slug}/`}
          />
          <meta
            property="og:title"
            content={`${initialBounty?.title || 'Listing'} | Superteam Earn`}
          />
          <meta property="og:image" content={ogImage.toString()} />
          <meta
            name="twitter:title"
            content={`${initialBounty?.title || 'Listing'} | Superteam Earn`}
          />
          <meta name="twitter:image" content={ogImage.toString()} />
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
      <Box bg="white">
        <>
          {bounty === null && <ErrorSection />}
          {bounty !== null && !bounty?.id && (
            <ErrorSection message="Sorry! The bounty you are looking for is not available." />
          )}
          {bounty !== null && !!bounty?.id && (
            <Box w="full" maxW={'8xl'} mx="auto" bg="white">
              <ListingHeader commentCount={commentCount} listing={bounty} />
              {/* {bounty?.isWinnersAnnounced && <ListingWinners bounty={bounty} />} */}
              <HStack
                align={['center', 'center', 'start', 'start']}
                justify={['center', 'center', 'space-between', 'space-between']}
                flexDir={{ base: 'column', md: 'row' }}
                gap={4}
                minH="100vh"
                mx={'auto'}
                px={3}
                bg="white"
              >
                <Flex flexGrow={1} w={{ base: 'full', md: '22rem' }} h="full">
                  <RightSideBar
                    listing={bounty}
                    skills={bounty?.skills?.map((e) => e.skills) ?? []}
                  />
                </Flex>
                <VStack
                  flexGrow={1}
                  gap={8}
                  w={'full'}
                  h="full"
                  px={{ base: 2, md: 5 }}
                  pb={10}
                  borderColor="brand.slate.100"
                  borderLeftWidth={{ base: 0, md: '1px' }}
                >
                  <Box>{children}</Box>

                  <Box display={{ base: 'block', md: 'none' }} w="full">
                    <ExtraInfoSection
                      skills={bounty?.skills?.map((e) => e.skills) ?? []}
                      region={bounty.region}
                      requirements={bounty.requirements}
                      pocSocials={bounty.pocSocials}
                      Hackathon={bounty.Hackathon}
                    />
                  </Box>
                  <Comments
                    isAnnounced={bounty?.isWinnersAnnounced ?? false}
                    listingSlug={bounty?.slug ?? ''}
                    listingType={bounty?.type ?? ''}
                    poc={bounty?.poc as User}
                    sponsorId={bounty?.sponsorId}
                    isVerified={bounty?.sponsor?.isVerified}
                    refId={bounty?.id ?? ''}
                    refType="BOUNTY"
                    count={commentCount}
                    setCount={setCommentCount}
                  />
                </VStack>
              </HStack>
            </Box>
          )}
        </>
      </Box>
    </Default>
  );
}
