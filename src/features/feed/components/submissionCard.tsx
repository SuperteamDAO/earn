import { Avatar, Flex, Text, Tooltip } from '@chakra-ui/react';
import React from 'react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { type FeedDataProps } from '@/pages/feed';
import { getURL } from '@/utils/validUrl';

import { FeedCardContainer, FeedCardLink } from './FeedCardContainer';
import { WinnerFeedImage } from './WinnerFeedImage';

interface SubCardProps {
  sub: FeedDataProps;
  type: 'profile' | 'activity';
}

export function SubmissionCard({ sub, type }: SubCardProps) {
  const firstName = sub?.firstName;
  const lastName = sub?.lastName;
  const photo = sub?.photo;
  const username = sub?.username;

  const isProject = sub?.listingType === 'project';

  const listingLink = `${getURL()}listings/${sub?.listingType}/${sub?.listingSlug}`;

  const submissionLink = `${listingLink}/submission/${sub?.id}`;

  const link = isProject ? listingLink : submissionLink;

  let winningText: string = '';
  let submissionText: string = '';

  switch (sub?.listingType) {
    case 'bounty':
      winningText = 'won a bounty';
      submissionText = 'submitted to a bounty';
      break;
    case 'hackathon':
      winningText = 'won a hackathon track';
      submissionText = 'submitted to a hackathon';
      break;
    case 'project':
      winningText = 'got selected for a project';
      submissionText = 'applied to a project';
      break;
  }

  const content = {
    actionText:
      sub?.isWinner && sub?.isWinnersAnnounced ? winningText : submissionText,
    createdAt: sub?.createdAt,
  };

  const actionLinks = (
    <>
      <Flex align={'center'} gap={3}>
        <Avatar size={'xs'} src={sub?.sponsorLogo} />
        <Text
          color={'brand.slate.500'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {sub?.listingTitle}
        </Text>
      </Flex>
      <Tooltip
        px={4}
        py={2}
        color="brand.slate.500"
        fontFamily={'var(--font-sans)'}
        bg="white"
        borderRadius={'lg'}
        isDisabled={!!sub?.id && !isProject}
        label={
          'This submission will be accessible once winners for the listing have been announced.'
        }
        shouldWrapChildren
      >
        <FeedCardLink
          href={link}
          style={{
            opacity: sub?.id ? '100%' : '50%',
            pointerEvents: sub?.id ? 'all' : 'none',
          }}
        >
          {isProject ? 'View Listing' : 'View Submission'}
        </FeedCardLink>
      </Tooltip>
    </>
  );

  return (
    <FeedCardContainer
      content={content}
      actionLinks={actionLinks}
      type={type}
      firstName={firstName}
      lastName={lastName}
      photo={photo}
      username={username}
      id={sub?.id}
      like={sub?.like}
      commentLink={link}
      cardType="submission"
      link={link}
    >
      {sub?.isWinner && sub?.isWinnersAnnounced ? (
        <WinnerFeedImage
          token={sub?.token}
          rewards={sub?.rewards}
          winnerPosition={sub?.winnerPosition}
        />
      ) : (
        <OgImageViewer
          externalUrl={sub?.link ?? ''}
          w="full"
          h={{ base: '200px', md: '350px' }}
          objectFit="cover"
          borderTopRadius={6}
        />
      )}
    </FeedCardContainer>
  );
}
