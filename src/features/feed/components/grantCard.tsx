import { Lock } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
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
  const [isViewGrantHovered, setIsViewGrantHovered] = useState(false);

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
      {!grant?.isPrivate ? (
        <div className="flex items-center gap-1.5 sm:gap-3">
          {grant?.sponsorSlug ? (
            <Link
              href={`/s/${grant.sponsorSlug}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Avatar className="size-5 sm:size-7">
                <AvatarImage src={grant?.sponsorLogo} alt="Sponsor Logo" />
              </Avatar>
            </Link>
          ) : (
            <Avatar className="size-5 sm:size-7">
              <AvatarImage src={grant?.sponsorLogo} alt="Sponsor Logo" />
            </Avatar>
          )}
          <Link
            className={`text-xs font-semibold text-gray-500 sm:text-sm md:text-base ${isViewGrantHovered ? '' : 'group-hover:underline'} line-clamp-1 group-hover:decoration-current`}
            href={listingLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            {grant?.listingTitle}
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-500">
          <Lock className="size-4" />
          <p>Private</p>
        </div>
      )}

      <Tooltip content={grant?.isPrivate ? 'This is a private grant.' : ''}>
        <div
          onMouseEnter={() => setIsViewGrantHovered(true)}
          onMouseLeave={() => setIsViewGrantHovered(false)}
        >
          <FeedCardLink
            href={listingLink}
            style={grant?.isPrivate ? 'opacity-50 pointer-events-none' : ''}
          >
            View Grant
          </FeedCardLink>
        </div>
      </Tooltip>
    </>
  );

  return (
    <FeedCardContainer
      isPrivate={grant?.isPrivate || false}
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
