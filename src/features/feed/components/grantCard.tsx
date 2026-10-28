import { Lock } from 'lucide-react';
import { useState } from 'react';

import { Tooltip } from '@/components/ui/tooltip';
import { getURL } from '@/utils/validUrl';

import { type FeedDataProps } from '../types';
import { FeedCardContainer } from './FeedCardContainer';
import { FeedCardLink } from './FeedCardLink';
import { FeedCardListingInfo } from './FeedCardListingInfo';
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

  const listingLink = `${getURL()}earn/grants/${grant?.listingSlug}`;

  const content = {
    actionText: 'won a grant',
    createdAt: grant?.createdAt,
  };

  const actionLinks = (
    <>
      {!grant?.isPrivate ? (
        <FeedCardListingInfo
          sponsorSlug={grant?.sponsorSlug}
          sponsorLogo={grant?.sponsorLogo}
          listingLink={listingLink}
          listingTitle={grant?.listingTitle}
          isViewLinkHovered={isViewGrantHovered}
        />
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
