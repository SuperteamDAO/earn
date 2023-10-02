import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Flex,
  LinkBox,
  LinkOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import React from 'react';

import type { PoW } from '@/interface/pow';
import type { User } from '@/interface/user';
import { timeAgoShort } from '@/utils/timeAgo';

import OgImageViewer from '../misc/ogImageViewer';

export default function PowCard({ talent, pow }: { talent: User; pow: PoW }) {
  const breakpoint = useBreakpointValue({ base: 'base', md: 'md' });

  return (
    <Box my={'16'}>
      <Flex align="center" justify={'space-between'}>
        <Flex align="center">
          <Avatar
            name={`${talent?.firstName}${talent?.lastName}`}
            size={'xs'}
            src={talent?.photo as string}
          />
          <Text
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'md' }}
            fontWeight={500}
          >
            <Text as={'span'} ml={2} color={'brand.slate.900'} fontWeight={600}>
              {talent?.firstName} {talent?.lastName}
            </Text>{' '}
            added a personal project
          </Text>
        </Flex>
        <Text
          color={'brand.slate.400'}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
        >
          {timeAgoShort(pow?.createdAt || '')} {breakpoint === 'md' && ' ago'}
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
            <LinkOverlay href={pow.link}>
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
