import React from 'react';

import { OgImageViewer } from '@/components/shared/ogImageViewer';

import { type FeedDataProps } from '../types';
import { FeedCardContainer } from './FeedCardContainer';
import { FeedCardLink } from './FeedCardLink';

interface PowCardProps {
  pow: {
    createdAt: string;
    description: string;
    firstName: string;
    lastName: string;
    link: string;
    photo: string;
    title: string;
    username: string;
    id: string;
    like: any;
    userId: string;
    likeCount: number;
    ogImage: string;
    commentCount?: number;
    recentCommenters?: FeedDataProps['recentCommenters'];
  };
  type: 'profile' | 'activity';
  commentCount?: number;
}

export function PowCard({ pow, type, commentCount }: PowCardProps) {
  const content = {
    actionText: 'added a personal project',
    createdAt: pow?.createdAt || '',
    description: pow?.description,
  };

  const firstName = pow?.firstName;
  const lastName = pow?.lastName;
  const photo = pow?.photo;
  const username = pow?.username;

  const actionLinks = (
    <>
      <div className="flex">
        <p className="text-sm font-semibold text-gray-500 md:text-base">
          {pow?.title}
        </p>
      </div>
      <FeedCardLink href={pow?.link}>View Project</FeedCardLink>
    </>
  );

  return (
    <FeedCardContainer
      type={type}
      content={content}
      actionLinks={actionLinks}
      firstName={firstName}
      lastName={lastName}
      photo={photo}
      username={username}
      id={pow?.id}
      like={pow?.like}
      cardType="pow"
      link={pow?.link}
      userId={pow?.userId}
      commentCount={commentCount || pow.commentCount}
      recentCommenters={pow?.recentCommenters}
    >
      <OgImageViewer
        type="pow"
        externalUrl={pow?.link ?? ''}
        className="h-[200px] w-full rounded-t-md object-cover md:h-[350px]"
        imageUrl={pow?.ogImage}
        id={pow?.id}
      />
    </FeedCardContainer>
  );
}
