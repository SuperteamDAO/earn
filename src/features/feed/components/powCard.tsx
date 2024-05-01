import { Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import type { PoW } from '@/interface/pow';
import type { User } from '@/interface/user';

import { FeedCardContainer, FeedCardLink } from './FeedCardContainer';

type PowWithUser = PoW & {
  user?: User;
};

interface PowCardProps {
  talent?: User;
  pow: PowWithUser;
  type: 'profile' | 'activity';
}

export function PowCard({ talent, pow, type }: PowCardProps) {
  const user = type === 'profile' ? talent : pow?.user;
  const content = {
    actionText: 'added a personal project',
    createdAt: pow?.createdAt || '',
    description: pow?.description,
  };

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
      <FeedCardLink href={pow?.link}>View Project</FeedCardLink>
    </>
  );

  return (
    <FeedCardContainer
      type={type}
      user={user}
      content={content}
      actionLinks={actionLinks}
    >
      <OgImageViewer
        externalUrl={pow?.link ?? ''}
        w="full"
        h={{ base: '200px', md: '350px' }}
        objectFit="cover"
        borderTopRadius={6}
      />
    </FeedCardContainer>
  );
}
