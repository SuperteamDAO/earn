import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  LinkBox,
  type LinkBoxProps,
  LinkOverlay,
  Text,
} from '@chakra-ui/react';
import React, { type ReactNode } from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { type User } from '@/interface/user';
import { timeAgoShort } from '@/utils/timeAgo';

interface FeedCardHeaderProps {
  name: string;
  username?: string;
  action: string;
  description?: string;
  photo: string | undefined;
  createdAt: string;
  type: 'activity' | 'profile';
}

interface FeedCardContainerProps {
  user: User | undefined;
  content: {
    actionText: string;
    createdAt: string;
    description?: string;
  };
  actionLinks: ReactNode;
  children: ReactNode;
  likesAndComments?: ReactNode;
  type: 'activity' | 'profile';
}

const FeedCardHeader = ({
  name,
  username,
  action,
  description,
  createdAt,
  type,
}: FeedCardHeaderProps) => {
  if (type === 'profile') {
    return (
      <Box mt={-0.5} mb={-1}>
        <Flex align="center" justify={'space-between'}>
          <Flex align="center">
            <Text
              color={'brand.slate.400'}
              fontSize={{ base: 'xs', md: 'md' }}
              fontWeight={500}
            >
              <Text as={'span'} color={'brand.slate.800'} fontWeight={600}>
                {name}
              </Text>{' '}
              {action}
            </Text>
          </Flex>
          <Text
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={500}
          >
            {timeAgoShort(createdAt)}
          </Text>
        </Flex>
        <Text color={'brand.slate.500'} fontSize={{ base: 'sm', md: 'md' }}>
          {description}
        </Text>
      </Box>
    );
  }
  return (
    <Flex>
      <Flex direction={'column'} mt={-0.5}>
        <Text
          color={'brand.slate.800'}
          fontSize={{ base: 'xs', md: 'md' }}
          fontWeight={600}
        >
          {name}
        </Text>
        <Text
          mt={-1}
          color={'brand.slate.400'}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
        >
          @{username} • {timeAgoShort(createdAt)}
        </Text>
        <Text
          mt={2}
          color={'brand.slate.600'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={500}
        >
          {action}
        </Text>
      </Flex>
    </Flex>
  );
};

export const FeedCardLink = ({
  href,
  style,
  children,
}: {
  href: string;
  style?: LinkBoxProps;
  children: ReactNode;
}) => {
  return (
    <LinkBox
      alignItems={'center'}
      gap={2}
      display="flex"
      whiteSpace={'nowrap'}
      {...style}
    >
      <LinkOverlay href={href}>
        <Text
          as="span"
          color={'#6366F1'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {children}
        </Text>
      </LinkOverlay>
      <ArrowForwardIcon color={'#6366F1'} />
    </LinkBox>
  );
};

export const FeedCardContainer = ({
  user,
  content,
  actionLinks,
  children,
  likesAndComments,
  type,
}: FeedCardContainerProps) => {
  return (
    <Box
      mx="0"
      mt={'-1px'}
      px={type === 'activity' ? 5 : 0}
      py={8}
      borderColor={'brand.slate.200'}
      borderBottomWidth={type === 'activity' ? '1px' : '0px'}
    >
      <Flex gap={3}>
        <EarnAvatar
          name={`${user?.firstName} ${user?.lastName}`}
          avatar={user?.photo}
          size="44px"
        />
        <Flex direction={'column'} w={'full'}>
          <FeedCardHeader
            name={`${user?.firstName} ${user?.lastName}`}
            photo={user?.photo}
            username={user?.username}
            action={content.actionText}
            createdAt={content.createdAt}
            description={content.description}
            type={type}
          />
          <Box
            mt={4}
            borderWidth={'1px'}
            borderColor={'brand.slate.200'}
            borderRadius={'6'}
            shadow={'0px 4px 4px 0px rgba(0, 0, 0, 0.01);'}
          >
            {children}
            <Flex
              align={'center'}
              justify={'space-between'}
              px={{ base: '3', md: '6' }}
              py={{ base: '4', md: '6' }}
            >
              {actionLinks}
            </Flex>
          </Box>
          {likesAndComments}
        </Flex>
      </Flex>
    </Box>
  );
};
