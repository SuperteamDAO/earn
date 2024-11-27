import { Flex, Text } from '@chakra-ui/react';
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
    actionText: '添加了个人项目',
    createdAt: pow?.createdAt || '',
    description: pow?.description,
  };

  const firstName = pow?.firstName;
  const lastName = pow?.lastName;
  const photo = pow?.photo;
  const username = pow?.username;

  const actionLinks = (
    <>
      <Flex>
        <Text
          color={'brand.slate.500'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {pow?.title}
        </Text>
      </Flex>
      <FeedCardLink href={pow?.link}>查看</FeedCardLink>
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
        w="full"
        h={{ base: '200px', md: '350px' }}
        objectFit="cover"
        borderTopRadius={6}
        imageUrl={pow?.ogImage}
        id={pow?.id}
      />
    </FeedCardContainer>
  );
}
