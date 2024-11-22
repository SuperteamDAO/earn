import { Avatar, Flex, Text, Tooltip } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

import { OgImageViewer } from '@/components/shared/ogImageViewer';
import { getURL } from '@/utils/validUrl';

import { type FeedDataProps } from '../types';
import { FeedCardContainer } from './FeedCardContainer';
import { FeedCardLink } from './FeedCardLink';
import { WinnerFeedImage } from './WinnerFeedImage';

interface SubCardProps {
  sub: FeedDataProps;
  type: 'profile' | 'activity';
  commentCount?: number;
}

export function SubmissionCard({ sub, type, commentCount }: SubCardProps) {
  const firstName = sub?.firstName;
  const lastName = sub?.lastName;
  const photo = sub?.photo;
  const username = sub?.username;

  const isProject = sub?.listingType === 'project';

  const listingLink = `${getURL()}listings/${sub?.listingType}/${sub?.listingSlug}`;

  const submissionLink = sub?.link
    ? sub.link
    : `${getURL()}feed/submission/${sub?.id}`;

  const link = sub?.isWinnersAnnounced
    ? isProject
      ? listingLink
      : submissionLink
    : listingLink;

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
          as={NextLink}
          overflow={'hidden'}
          color={'brand.slate.500'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
          _hover={{ textDecoration: 'underline' }}
          textOverflow={'ellipsis'}
          href={listingLink}
          noOfLines={1}
          rel="noopener noreferrer"
          target="_blank"
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
        isDisabled={!!sub?.id || isProject}
        label={
          'This submission will be accessible once winners for the listing have been announced.'
        }
        shouldWrapChildren
      >
        <FeedCardLink
          href={link}
          style={{
            opacity: sub?.id || isProject ? '100%' : '50%',
            pointerEvents: sub?.id || isProject ? 'all' : 'none',
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
      userId={sub?.userId}
      commentCount={commentCount || sub.commentCount}
      recentCommenters={sub?.recentCommenters}
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
          className="h-[200px] w-full rounded-t-md object-cover md:h-[350px]"
          imageUrl={sub?.ogImage}
          type="submission"
          id={sub?.id}
        />
      )}
    </FeedCardContainer>
  );
}
