import Link from 'next/link';
import React from 'react';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
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
  const name = grant?.name;
  const photo = grant?.photo;
  const username = grant?.username;

  const listingLink = `${getURL()}grants/${grant?.listingSlug}`;

  const content = {
    actionText: 'won a grant',
    createdAt: grant?.createdAt,
  };

  const actionLinks = (
    <>
      <div className="flex items-center gap-3">
        <Avatar className="h-6 w-6">
          <AvatarImage src={grant?.sponsorLogo} alt="Sponsor Logo" />
        </Avatar>
        <Link
          className="text-sm font-semibold text-gray-500 md:text-base"
          href={listingLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          {grant?.listingTitle}
        </Link>
      </div>
      <FeedCardLink href={listingLink}>View Grant</FeedCardLink>
    </>
  );

  return (
    <FeedCardContainer
      content={content}
      actionLinks={actionLinks}
      type={type}
      name={name}
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
