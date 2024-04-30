import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Flex, LinkBox, LinkOverlay, Text } from '@chakra-ui/react';
import React from 'react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { EarnAvatar } from '@/components/shared/EarnAvatar';
import type { PoW } from '@/interface/pow';
import type { User } from '@/interface/user';
import { timeAgoShort } from '@/utils/timeAgo';

type PowWithUser = PoW & {
  user?: User;
};

interface PowCardProps {
  talent?: User;
  pow: PowWithUser;
  type: 'profile' | 'activity';
}

export function PowCard({ talent, pow, type }: PowCardProps) {
  let user;
  if (type === 'profile') {
    user = talent;
  } else {
    user = pow?.user;
  }

  return (
    <Box my={'16'}>
      <Flex align="center" justify={'space-between'}>
        <Flex align="center">
          <EarnAvatar
            name={`${user?.firstName} ${user?.lastName}`}
            avatar={user?.photo as string}
            size="24px"
          />
          <Text
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'md' }}
            fontWeight={500}
          >
            <Text as={'span'} ml={2} color={'brand.slate.900'} fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Text>{' '}
            added a personal project
          </Text>
        </Flex>
        <Text
          color={'brand.slate.400'}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
        >
          {timeAgoShort(pow?.createdAt || '')}
        </Text>
      </Flex>
      <Text
        mt={{ base: 2, md: 4 }}
        color={'brand.slate.500'}
        fontSize={{ base: 'sm', md: 'md' }}
      >
        {pow?.description}
      </Text>
      <Box
        mt={4}
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius={'6'}
        shadow={'0px 4px 4px 0px rgba(0, 0, 0, 0.01);'}
      >
        <OgImageViewer
          externalUrl={pow?.link ?? ''}
          w="full"
          h={{ base: '200px', md: '350px' }}
          objectFit="cover"
          borderTopRadius={6}
        />
        <Flex
          align={'center'}
          justify={'space-between'}
          px={{ base: '3', md: '6' }}
          py={{ base: '4', md: '6' }}
        >
          <Flex align={'center'} gap={3}>
            <Text
              color={'brand.slate.500'}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={600}
            >
              {pow?.title}
            </Text>
          </Flex>
          <LinkBox
            alignItems={'center'}
            gap={2}
            display="flex"
            whiteSpace={'nowrap'}
          >
            <LinkOverlay href={pow?.link}>
              <Text
                as="span"
                color={'#6366F1'}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={600}
              >
                View Project
              </Text>
            </LinkOverlay>
            <ArrowForwardIcon color={'#6366F1'} />
          </LinkBox>
        </Flex>
      </Box>
    </Box>
  );
}
