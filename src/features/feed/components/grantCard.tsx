import { Avatar, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

import { getURL } from '@/utils/validUrl';

import { type FeedDataProps } from '../types';
import { FeedCardContainer } from './FeedCardContainer';
import { FeedCardLink } from './FeedCardLink';
import { WinnerFeedImage } from './WinnerFeedImage';

interface GrantCardProps {
  grant: FeedDataProps;
  type: 'profile' | 'activity';
  commentCount?: number;
}

export function GrantCard({ grant, type, commentCount }: GrantCardProps) {
  const firstName = grant?.firstName;
  const lastName = grant?.lastName;
  const photo = grant?.photo;
  const username = grant?.username;

  const listingLink = `${getURL()}grants/${grant?.listingSlug}`;

  const content = {
    actionText: 'won a grant',
    createdAt: grant?.createdAt,
  };

  const actionLinks = (
    <>
      <Flex align={'center'} gap={3}>
        <Avatar size={'xs'} src={grant?.sponsorLogo} />
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
          {grant?.listingTitle}
        </Text>
      </Flex>
      <FeedCardLink href={listingLink}>View Grant</FeedCardLink>
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
      id={grant?.id}
      like={grant?.like}
      commentLink={listingLink}
      cardType="grant-application"
      link={listingLink}
      userId={grant?.userId}
      commentCount={commentCount || grant.commentCount}
      recentCommenters={grant?.recentCommenters}
    >
      {
        <WinnerFeedImage
          token={grant?.token}
          rewards={grant?.rewards}
          winnerPosition={grant?.winnerPosition}
          grantApplicationAmount={grant?.grantApplicationAmount}
        />
      }
    </FeedCardContainer>
  );
}
