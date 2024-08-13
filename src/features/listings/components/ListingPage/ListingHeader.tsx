import {
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import {
  LuCheck,
  LuClock,
  LuFile,
  LuMessageSquare,
  LuPause,
} from 'react-icons/lu';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { type Listing } from '@/features/listings';
import { PulseIcon } from '@/svg/pulse-icon';
import { dayjs } from '@/utils/dayjs';

import { ListingTabLink } from './ListingTabLink';
import { RegionLabel } from './RegionLabel';
import { ListingHeaderSeparator } from './Separator';
import { StatusBadge } from './StatusBadge';
import { SubscribeListing } from './SubscribeListing';

export function ListingHeader({
  listing,
  isTemplate,
  commentCount,
}: {
  listing: Listing;
  isTemplate?: boolean;
  commentCount?: number;
}) {
  const {
    type,
    status,
    deadline,
    title,
    sponsor,
    slug,
    region,
    isWinnersAnnounced,
    references,
    publishedAt,
    isPublished,
    Hackathon,
  } = listing;
  const router = useRouter();
  const posthog = usePostHog();
  const hasDeadlineEnded = dayjs().isAfter(deadline);
  const hasHackathonStarted = dayjs().isAfter(Hackathon?.startDate);

  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';

  const statusIconStyles = { w: 5, h: 5 };
  let statusText = '';
  let statusBgColor = '';
  let statusTextColor = '';
  let statusIcon = (
    <PulseIcon
      {...statusIconStyles}
      bg={statusBgColor}
      text={statusTextColor}
    />
  );

  if (!isPublished && !publishedAt) {
    statusIcon = (
      <Icon as={LuFile} {...statusIconStyles} color="brand.slate.400" />
    );
    statusText = 'Draft';
    statusBgColor = 'brand.slate.200';
    statusTextColor = 'brand.slate.500';
  } else if (!isPublished && publishedAt) {
    statusIcon = <Icon as={LuPause} {...statusIconStyles} color="#ffecb3" />;
    statusText = 'Submissions Paused';
    statusBgColor = '#ffecb3';
    statusTextColor = '#F59E0B';
  } else if (isHackathon && !hasDeadlineEnded && !hasHackathonStarted) {
    statusIcon = <Icon as={LuClock} {...statusIconStyles} color="#F3E8FF" />;
    statusText = 'Opens Soon';
    statusBgColor = '#F3E8FF';
    statusTextColor = '#8B5CF6';
  } else if (status === 'OPEN' && isWinnersAnnounced) {
    statusIcon = (
      <Icon as={LuCheck} {...statusIconStyles} color={'brand.slate.400'} />
    );
    statusText = 'Completed';
    statusBgColor = 'brand.slate.200';
    statusTextColor = 'brand.slate.400';
  } else if (!isWinnersAnnounced && hasDeadlineEnded && status === 'OPEN') {
    statusIcon = (
      <PulseIcon {...statusIconStyles} bg={'orange.100'} text={'orange.600'} />
    );
    statusText = 'In Review';
    statusBgColor = 'orange.100';
    statusTextColor = 'orange.600';
  } else if (!hasDeadlineEnded && !isWinnersAnnounced && status === 'OPEN') {
    statusIcon = (
      <PulseIcon {...statusIconStyles} bg={'green.100'} text="green.600" />
    );
    statusText = 'Submissions Open';
    statusBgColor = 'green.100';
    statusTextColor = 'green.600';
  }

  const ListingTitle = () => {
    return (
      <Heading
        color={'brand.slate.700'}
        fontFamily={'var(--font-sans)'}
        fontSize={'xl'}
        fontWeight={700}
      >
        {title}
      </Heading>
    );
  };

  const ListingStatus = () => {
    return (
      <StatusBadge
        Icon={statusIcon}
        textColor={statusTextColor}
        text={statusText}
      />
    );
  };

  const CommentCount = () => {
    return (
      !!commentCount && (
        <HStack ml={4}>
          <Icon
            as={LuMessageSquare}
            color="brand.slate.500"
            fill="brand.slate.600"
          />
          <Text fontSize={'sm'}>{commentCount}</Text>
        </HStack>
      )
    );
  };

  const HeaderSub = () => {
    return (
      <Flex align={'center'} wrap={'wrap'} gap={{ base: 1, md: 3 }}>
        <Flex align={'center'} gap={1}>
          <Text
            color={'#94A3B8'}
            fontSize={{ base: 'xs', sm: 'md' }}
            fontWeight={500}
            whiteSpace={'nowrap'}
          >
            by {sponsor?.name}
          </Text>
          {!!sponsor?.isVerified && <VerifiedBadge />}
        </Flex>
        <ListingHeaderSeparator />
        {isHackathon ? (
          <Flex align={'center'}>
            <Image h="2.5rem" alt={type} src={Hackathon?.altLogo} />
          </Flex>
        ) : (
          <Flex>
            <Tooltip
              px={4}
              py={2}
              color="brand.slate.400"
              fontFamily={'var(--font-sans)'}
              fontSize="sm"
              bg="white"
              borderRadius={'lg'}
              label={
                isProject
                  ? 'A Project is a short-term gig where sponsors solicit applications from multiple people, and select the best one to work on the Project.'
                  : 'Bounties are open for anyone to participate in and submit their work (as long as they meet the eligibility requirements mentioned below). The best submissions win!'
              }
            >
              <Flex>
                <Image
                  h="4"
                  mt={{ base: '1px', sm: 1 }}
                  mr={{ base: '1px', sm: 1 }}
                  alt={type}
                  src={
                    isProject
                      ? '/assets/icons/briefcase.svg'
                      : '/assets/icons/bolt.svg'
                  }
                />
                <Text
                  color={'gray.400'}
                  fontSize={{ base: 'xs', sm: 'md' }}
                  fontWeight={500}
                >
                  {isProject ? 'Project' : 'Bounty'}
                </Text>
              </Flex>
            </Tooltip>
          </Flex>
        )}
        <ListingHeaderSeparator />
        <Flex display={'flex'}>
          <ListingStatus />
        </Flex>
        <ListingHeaderSeparator />
        <RegionLabel region={region} />
        <CommentCount />
      </Flex>
    );
  };

  const SponsorLogo = () => {
    return (
      <Image
        w={{ base: 12, md: 16 }}
        h={{ base: 12, md: 16 }}
        objectFit={'cover'}
        alt={'phantom'}
        rounded={'md'}
        src={sponsor?.logo || `${router.basePath}/assets/logo/sponsor-logo.png`}
      />
    );
  };

  return (
    <VStack px={{ base: 3, md: 3 }} bg={'white'}>
      <VStack
        justify={'space-between'}
        flexDir={'row'}
        gap={5}
        w={'full'}
        maxW={'8xl'}
        mx={'auto'}
        py={{ base: 4, md: 10 }}
      >
        <HStack align="center">
          <SponsorLogo />
          <VStack align={'start'} gap={isHackathon ? 0 : 1}>
            <HStack>
              <Flex display={{ base: 'none', md: 'flex' }}>
                <ListingTitle />
              </Flex>
            </HStack>
            {!isTemplate && (
              <Flex display={{ base: 'none', md: 'flex' }}>
                <HeaderSub />
              </Flex>
            )}
          </VStack>
        </HStack>
        {!isTemplate && listing.id && <SubscribeListing id={listing.id} />}
      </VStack>
      <Flex
        direction={'column'}
        gap={1}
        display={{ base: 'flex', md: 'none' }}
        w="full"
        mb={5}
      >
        <ListingTitle />
        <HeaderSub />
      </Flex>
      {!isTemplate && (
        <Flex align={'center'} w={'full'} maxW="8xl" h={10}>
          <HStack
            align="center"
            justifyContent="start"
            gap={10}
            w={'full'}
            maxW={'8xl'}
            h={'full'}
            mx={'auto'}
            my={'auto'}
            borderColor="brand.slate.200"
            borderBottomWidth={'1px'}
          >
            <ListingTabLink
              w={{ md: '22rem' }}
              href={`/listings/${type}/${slug}/`}
              text="Prizes"
              isActive={false}
              styles={{
                pointerEvents: 'none',
                display: { base: 'none', md: 'flex' },
              }}
            />
            <ListingTabLink
              href={`/listings/${type}/${slug}/`}
              text="Details"
              isActive={
                !router.asPath.split('/')[4]?.includes('submission') &&
                !router.asPath.split('/')[4]?.includes('references')
              }
            />

            {!isProject && isWinnersAnnounced && (
              <ListingTabLink
                onClick={() => posthog.capture('submissions tab_listing')}
                href={`/listings/${type}/${slug}/submission`}
                text="Submissions"
                isActive={!!router.asPath.split('/')[4]?.includes('submission')}
              />
            )}

            {isProject && references && references?.length > 0 && (
              <>
                <ListingTabLink
                  href={`/listings/${type}/${slug}/references`}
                  text="References"
                  isActive={
                    !!router.asPath.split('/')[4]?.includes('references')
                  }
                />
              </>
            )}
          </HStack>
        </Flex>
      )}
    </VStack>
  );
}
