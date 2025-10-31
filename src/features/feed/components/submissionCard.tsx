import { Lock } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { OgImageViewer } from '@/components/shared/ogImageViewer';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
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
  const [isViewSubmissionHovered, setIsViewSubmissionHovered] = useState(false);

  const firstName = sub?.firstName;
  const lastName = sub?.lastName;
  const photo = sub?.photo;
  const username = sub?.username;

  const isProject = sub?.listingType === 'project';

  const listingLink = `${getURL()}listing/${sub?.listingSlug}`;

  const submissionLink = sub?.link
    ? sub.link
    : `${getURL()}feed/submission/${sub?.id}`;

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
      {!sub?.isPrivate ? (
        <div className="flex items-center gap-1.5 sm:gap-3">
          {sub?.sponsorSlug ? (
            <Link
              href={`/s/${sub.sponsorSlug}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Avatar className="size-5 sm:size-7">
                <AvatarImage src={sub?.sponsorLogo} alt="Sponsor Logo" />
              </Avatar>
            </Link>
          ) : (
            <Avatar className="size-5 sm:size-7">
              <AvatarImage src={sub?.sponsorLogo} alt="Sponsor Logo" />
            </Avatar>
          )}
          <Link
            className={`text-xs font-semibold text-gray-500 sm:text-sm md:text-base ${isViewSubmissionHovered ? '' : 'group-hover:underline'} line-clamp-1 group-hover:decoration-current`}
            href={listingLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            {sub?.listingTitle}
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-500">
          <Lock className="size-4" />
          <p>Private</p>
        </div>
      )}
      {!isProject &&
        (!sub?.id ? (
          <Tooltip
            content={
              sub?.isPrivate
                ? 'This is a private listing.'
                : 'This submission will be accessible once winners for the listing have been announced.'
            }
          >
            <div
              onMouseEnter={() => setIsViewSubmissionHovered(true)}
              onMouseLeave={() => setIsViewSubmissionHovered(false)}
            >
              <FeedCardLink
                href={listingLink}
                style="opacity-50 pointer-events-none"
              >
                View Submission
              </FeedCardLink>
            </div>
          </Tooltip>
        ) : (
          <div
            onMouseEnter={() => setIsViewSubmissionHovered(true)}
            onMouseLeave={() => setIsViewSubmissionHovered(false)}
          >
            <FeedCardLink
              href={submissionLink}
              style="opacity-100 pointer-events-auto"
            >
              View Submission
            </FeedCardLink>
          </div>
        ))}
    </>
  );

  return (
    <FeedCardContainer
      isPrivate={sub?.isPrivate || false}
      content={content}
      actionLinks={actionLinks}
      type={type}
      firstName={firstName}
      lastName={lastName}
      photo={photo}
      username={username}
      id={sub?.id}
      like={sub?.like}
      commentLink={listingLink}
      cardType="submission"
      link={listingLink}
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
          isWinnersAnnounced={sub?.isWinnersAnnounced}
        />
      )}
    </FeedCardContainer>
  );
}
