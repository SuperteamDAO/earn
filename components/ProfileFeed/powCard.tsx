import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Flex,
  LinkBox,
  LinkOverlay,
  Text,
} from '@chakra-ui/react';
import React from 'react';

import type { PoW } from '@/interface/pow';
import type { User } from '@/interface/user';
import { timeAgoShort } from '@/utils/timeAgo';

import OgImageViewer from '../misc/ogImageViewer';

export default function PowCard({ talent, pow }: { talent: User; pow: PoW }) {
  return (
    <Box my={'16'}>
      <Flex justify={'space-between'}>
        <Flex>
          <Avatar
            name={`${talent?.firstName}${talent?.lastName}`}
            size={'xs'}
            src={talent?.photo as string}
          />
          <Text color={'brand.slate.400'} fontWeight={500}>
            <Text as={'span'} ml={2} color={'brand.slate.900'} fontWeight={600}>
              {talent?.firstName} {talent?.lastName}
            </Text>{' '}
            added a proof of work
          </Text>
        </Flex>
        <Text color={'brand.slate.400'} fontSize={'sm'} fontWeight={500}>
          {timeAgoShort(pow?.createdAt || '')}
        </Text>
      </Flex>
      <Text mt={4} color={'brand.slate.500'}>
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
          h="350px"
          objectFit="cover"
          borderTopRadius={6}
        />
        <Flex align={'center'} justify={'space-between'} px={6} py={6}>
          <Flex align={'center'} gap={3}>
            <Text color={'brand.slate.500'} fontWeight={600}>
              {pow?.title}
            </Text>
          </Flex>
          <LinkBox alignItems={'center'} gap={2} display="flex">
            <LinkOverlay href={pow.link}>
              <Text as="span" color={'#6366F1'} fontWeight={600}>
                View Work
              </Text>
            </LinkOverlay>
            <ArrowForwardIcon color={'#6366F1'} />
          </LinkBox>
        </Flex>
      </Box>
    </Box>
  );
}
