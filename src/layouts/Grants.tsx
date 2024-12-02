import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Flex, HStack, Image, Link, Text, VStack } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import Head from 'next/head';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { tokenList } from '@/constants';
import {
  DollarIcon,
  grantAmount,
  GrantApplicationButton,
  GrantsHeader,
  type GrantWithApplicationCount,
  PayoutIcon,
  TimeToPayIcon,
} from '@/features/grants';
import { LiveGrants } from '@/features/home';
import { ExtraInfoSection } from '@/features/listings';
import { grantSnackbarAtom } from '@/features/navbar';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

import { Default } from './Default';

interface GrantPageProps {
  grant: GrantWithApplicationCount | null;
  children: React.ReactNode;
}
export function GrantPageLayout({
  grant: initialGrant,
  children,
}: GrantPageProps) {
  const [grant] = useState<typeof initialGrant>(initialGrant);
  const encodedTitle = encodeURIComponent(initialGrant?.title || '');
  const posthog = usePostHog();
  const [, setGrantSnackbar] = useAtom(grantSnackbarAtom);

  const iterableSkills = initialGrant?.skills?.map((e) => e.skills) ?? [];

  useEffect(() => {
    if (initialGrant) {
      setGrantSnackbar({
        isPublished: !!initialGrant?.isPublished,
      });
    }
  }, [initialGrant]);

  return (
    <Default
      meta={
        <Head>
          <title>{`${initialGrant?.title || 'Grant'} | Superteam Earn`}</title>
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
      <Box bg="white">
        {grant === null && <LoadingSection />}
        {grant !== null && !grant?.id && <EmptySection />}
        {grant !== null && !!grant?.id && (
          <Box w="100%" mx="auto" px={{ base: '2', lg: 6 }}>
            <Box w="100%" maxW={'7xl'} mx="auto">
              <GrantsHeader
                title={grant?.title ?? ''}
                sponsor={grant?.sponsor}
                status={grant?.status}
                region={grant?.region}
                slug={grant?.slug}
                references={grant.references}
                isPublished={grant.isPublished || false}
              />

              <HStack
                align={['center', 'center', 'start', 'start']}
                justify={['center', 'center', 'space-between', 'space-between']}
                flexDir={{ base: 'column', md: 'row' }}
                gap={{ base: 0, md: 4 }}
                maxW="6xl"
                mb={10}
              >
                <Box
                  pos={{ base: 'static', md: 'sticky' }}
                  top={14}
                  w={{ base: 'full', md: 'auto' }}
                  px={3}
                >
                  <VStack gap={2}>
                    <VStack
                      justify={'center'}
                      gap={0}
                      w={{ base: 'full', md: '22rem' }}
                      py={4}
                      bg={'#FFFFFF'}
                      rounded={'xl'}
                    >
                      <Flex
                        align={'center'}
                        justify={'space-between'}
                        gap={3}
                        w="full"
                      >
                        <Flex align={'center'} gap={2}>
                          <Image
                            w={9}
                            h={9}
                            alt={'green doller'}
                            rounded={'full'}
                            src={
                              tokenList.filter(
                                (e) => e?.tokenSymbol === grant.token,
                              )[0]?.icon ?? '/assets/icons/green-dollar.svg'
                            }
                          />
                          <Text
                            color="brand.slate.700"
                            fontSize={{ base: 'lg', md: 'xl' }}
                            fontWeight={600}
                          >
                            {grantAmount({
                              maxReward: grant.maxReward!,
                              minReward: grant.minReward!,
                            })}{' '}
                            <Text as="span" color={'brand.slate.500'}>
                              {grant.token}
                            </Text>
                          </Text>
                        </Flex>
                        <Text
                          mt={-1}
                          color={'brand.slate.500'}
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          Cheque Size
                        </Text>
                      </Flex>
                      <Flex
                        justify={'space-between'}
                        display={
                          grant?.link && !grant?.isNative ? 'none' : 'flex'
                        }
                        w="full"
                        mb={{ base: 0, md: 2 }}
                        py={4}
                      >
                        <Flex direction="column" gap={4} w="fit-content">
                          <Flex direction={'column'} w="fit-content">
                            <Flex w="fit-content">
                              <TimeToPayIcon />
                              <Text
                                color="brand.slate.700"
                                fontSize={{ base: 'lg', md: 'xl' }}
                                fontWeight={500}
                              >
                                {grant?.avgResponseTime}
                              </Text>
                            </Flex>
                            <Text
                              w="max-content"
                              pl={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              textTransform={'uppercase'}
                            >
                              Avg. Response Time
                            </Text>
                          </Flex>
                          <Flex direction={'column'} w="fit-content">
                            <div className="flex">
                              <PayoutIcon />
                              <Text
                                color="brand.slate.700"
                                fontSize={{ base: 'lg', md: 'xl' }}
                                fontWeight={500}
                              >
                                {grant.totalApproved
                                  ? new Intl.NumberFormat('en-US', {
                                      maximumFractionDigits: 0,
                                      currency: 'USD',
                                      style: 'currency',
                                    }).format(
                                      Math.round(
                                        grant?.totalApproved /
                                          grant?.totalApplications,
                                      ),
                                    )
                                  : '—'}
                              </Text>
                            </div>
                            <Text
                              w="max-content"
                              pl={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              textTransform={'uppercase'}
                            >
                              Avg. Grant Size
                            </Text>
                          </Flex>
                        </Flex>
                        <Flex direction="column" gap={4} w="fit-content">
                          <Flex direction={'column'}>
                            <div className="flex">
                              <DollarIcon />
                              <Text
                                color="brand.slate.700"
                                fontSize={{ base: 'lg', md: 'xl' }}
                                fontWeight={500}
                              >
                                $
                                {formatNumberWithSuffix(
                                  Math.round(grant?.totalApproved || 0),
                                  1,
                                  true,
                                )}
                              </Text>
                            </div>
                            <Text
                              w="max-content"
                              pl={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              textTransform={'uppercase'}
                            >
                              Approved So Far
                            </Text>
                          </Flex>
                          <Flex direction={'column'}>
                            <div className="flex">
                              <TimeToPayIcon />
                              <Text
                                color="brand.slate.700"
                                fontSize={{ base: 'lg', md: 'xl' }}
                                fontWeight={500}
                              >
                                {grant?.totalApplications}
                              </Text>
                            </div>
                            <Text
                              w="max-content"
                              pl={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              textTransform={'uppercase'}
                            >
                              Recipients
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                      <GrantApplicationButton grant={grant} />
                      <div>
                        <ExtraInfoSection
                          skills={iterableSkills}
                          region={grant.region}
                          requirements={grant.requirements}
                          pocSocials={grant.pocSocials}
                          isGrant
                        />
                      </div>
                      <Box
                        display={{ base: 'none', md: 'block' }}
                        w="full"
                        pt={8}
                      >
                        <LiveGrants
                          excludeIds={grant.id ? [grant.id] : undefined}
                        >
                          <Text
                            h="100%"
                            color={'brand.slate.600'}
                            fontSize={'sm'}
                            fontWeight={600}
                            textAlign="start"
                          >
                            LIVE GRANTS
                          </Text>
                        </LiveGrants>
                      </Box>
                    </VStack>
                  </VStack>
                </Box>
                <VStack
                  gap={8}
                  w={'full'}
                  px={{ base: 2, md: 5 }}
                  borderColor="brand.slate.100"
                  borderLeftWidth={'1px'}
                >
                  {children}
                  <VStack
                    align={'start'}
                    display={{ base: 'flex', md: 'none' }}
                    w="full"
                  >
                    <Text
                      h="100%"
                      color={'brand.slate.600'}
                      fontSize={'sm'}
                      fontWeight={600}
                      textAlign="center"
                    >
                      SKILLS NEEDED
                    </Text>
                    <HStack flexWrap={'wrap'} gap={3}>
                      {iterableSkills?.map((skill) => (
                        <Box
                          key={skill}
                          m={'0px !important'}
                          px={4}
                          py={1}
                          color="#475569"
                          fontSize="sm"
                          fontWeight={500}
                          bg={'#F1F5F9'}
                          rounded={'sm'}
                        >
                          <Text fontSize={'xs'}>{skill}</Text>
                        </Box>
                      ))}
                    </HStack>
                  </VStack>
                  {initialGrant?.pocSocials && (
                    <VStack
                      align={'start'}
                      display={{ base: 'flex', md: 'none' }}
                      w={'full'}
                      fontSize="sm"
                    >
                      <Text
                        h="100%"
                        color={'brand.slate.600'}
                        fontWeight={600}
                        textAlign="center"
                      >
                        CONTACT
                      </Text>
                      <p>
                        <Link
                          className="ph-no-capture"
                          color={'#64768b'}
                          fontWeight={500}
                          href={getURLSanitized(initialGrant?.pocSocials)}
                          isExternal
                          onClick={() => posthog.capture('reach out_listing')}
                        >
                          Reach out
                          <ExternalLinkIcon
                            color={'#64768b'}
                            mb={1}
                            as="span"
                            mx={1}
                          />
                        </Link>
                        <Text as="span" color={'brand.slate.500'}>
                          if you have any questions about this listing
                        </Text>
                      </p>
                    </VStack>
                  )}
                </VStack>
              </HStack>
            </Box>
          </Box>
        )}
      </Box>
    </Default>
  );
}
