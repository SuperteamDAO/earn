import Link from 'next/link';
import React from 'react';

import { OgImageViewer } from '@/components/shared/ogImageViewer';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { getBountyUrlBySponsorAndId } from '@/utils/bounty-urls';

import { type FeedDataProps } from '../types';
import { FeedCardContainer } from './FeedCardContainer';
import { FeedCardButton, FeedCardLink } from './FeedCardLink';
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
  const isSponsorship = sub?.listingType === 'sponsorship';
  const listingLink = getBountyUrlBySponsorAndId(
    sub?.sponsorSlug,
    sub?.bountySequentialId.toString(),
  );

  const submissionLink = sub?.link
    ? sub.link
    : `${listingLink}/${sub?.sequentialId}`;

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
    case 'sponsorship':
      winningText = 'got selected for a sponsorship';
      submissionText = 'applied to a sponsorship';
      break;
  }

  const content = {
    actionText:
      sub?.isWinner &&
      (sub?.isWinnersAnnounced || sub?.listingType === 'sponsorship')
        ? winningText
        : submissionText,
    createdAt: sub?.createdAt,
  };

  const actionLinks = (
    <>
      <div className="flex items-center gap-3">
        <Avatar className="h-3 w-3">
          <AvatarImage src={sub?.sponsorLogo} alt="Sponsor Logo" />
        </Avatar>
        <Link
          className="text-sm font-semibold text-gray-500 md:text-base"
          href={listingLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          {sub?.listingTitle}
        </Link>
      </div>
      {!sub?.id && !isProject && !isSponsorship ? (
        <Tooltip
          disabled={true}
          content="This submission will be accessible once winners for the listing have been announced."
        >
          <FeedCardButton
            style="pointer-events-none opacity-50"
            onClick={() => {}}
          >
            {isProject ? 'View Listing' : 'View Submission'}
          </FeedCardButton>
        </Tooltip>
      ) : !isProject ? (
        <FeedCardLink
          style="pointer-events-auto opacity-100"
          href={`${submissionLink}`}
        >
          {'View Submission'}
        </FeedCardLink>
      ) : (
        <FeedCardLink
          href={listingLink}
          style="pointer-events-auto opacity-100"
        >
          {'View Listing'}
        </FeedCardLink>
      )}
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
      {sub?.isWinner &&
      (sub?.isWinnersAnnounced || sub?.listingType === 'sponsorship') ? (
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
          isSponsorship={sub?.listingType === 'sponsorship'}
        />
      )}
    </FeedCardContainer>
  );
}
