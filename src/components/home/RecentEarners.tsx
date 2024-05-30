import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Center, Flex, Image, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';

import { tokenList } from '@/constants';
import { type User } from '@/interface/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURL } from '@/utils/validUrl';

import { EarnAvatar } from '../shared/EarnAvatar';

interface EarnerProps {
  name: string;
  avatar?: string;
  amount: number;
  bounty?: string;
  token?: string;
  username: string;
  id: string;
}
const Earner = ({
  amount,
  name,
  avatar,
  bounty,
  token,
  username,
  id,
}: EarnerProps) => {
  const tokenObj = tokenList.find((t) => t.tokenSymbol === token);
  const tokenIcon = tokenObj
    ? tokenObj.icon
    : '/assets/landingsponsor/icons/usdc.svg';
  return (
    <NextLink href={`${getURL()}t/${username}`}>
      <Flex align={'center'} w={'100%'} my={4}>
        <Center mr={'0.75rem'}>
          <EarnAvatar id={id} avatar={avatar} />
        </Center>

        <Box w="13.8rem">
          <Text
            overflow="hidden"
            color={'black'}
            fontSize={'sm'}
            fontWeight={500}
            whiteSpace={'nowrap'}
            textOverflow={'ellipsis'}
          >
            {name}
          </Text>
          <Text
            overflow={'hidden'}
            color={'gray.400'}
            fontSize={'xs'}
            fontWeight={500}
            whiteSpace={'nowrap'}
            textOverflow={'ellipsis'}
          >
            {bounty}
          </Text>
        </Box>
        <Flex align={'center'} columnGap={1} ml={'auto'}>
          <Image
            w={5}
            h={5}
            alt={`${token} icon`}
            rounded={'full'}
            src={tokenIcon}
          />
          <Text color={'gray.600'} fontSize={'sm'} fontWeight={500}>
            {formatNumberWithSuffix(amount)}
          </Text>
          <Text color={'gray.400'} fontSize={'sm'} fontWeight={500}>
            {token}
          </Text>
        </Flex>
      </Flex>
    </NextLink>
  );
};

export const RecentEarners = ({ earners }: { earners?: User[] }) => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const posthog = usePostHog();

  const multipliedEarners = earners ? [...earners, ...earners, ...earners] : [];

  const animate = () => {
    const marquee = marqueeRef.current;
    if (marquee && !isPaused) {
      if (marquee.scrollHeight - marquee.scrollTop <= marquee.clientHeight) {
        marquee.scrollTop -= marquee.scrollHeight / 3;
      } else {
        marquee.scrollTop += 1;
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <Box>
      <Flex align={'center'} justify={'space-between'} mb={4}>
        <Text color={'gray.400'} fontSize={'sm'} fontWeight={500}>
          RECENT EARNERS
        </Text>
        <Text
          className="ph-no-capture"
          as={NextLink}
          color="brand.purple"
          fontSize="xs"
          fontWeight={600}
          href="/leaderboard"
          onClick={() => {
            posthog.capture('view leaderboard_homepage');
          }}
        >
          Leaderboard
          <ArrowForwardIcon ml={1} />
        </Text>
      </Flex>
      <VStack>
        <Box
          ref={marqueeRef}
          overflow="hidden"
          h="300px"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {multipliedEarners.map((t: any, index: number) => (
            <Earner
              amount={t.reward ?? 0}
              token={t.rewardToken}
              name={`${t.firstName} ${t.lastName}`}
              username={t.username}
              avatar={t.photo}
              key={`${t.id}-${index}`}
              bounty={t.title ?? ''}
              id={t.id}
            />
          ))}
        </Box>
      </VStack>
    </Box>
  );
};
