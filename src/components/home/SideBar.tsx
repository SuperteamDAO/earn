import { ChevronRightIcon } from '@chakra-ui/icons';
import { Box, Center, Flex, Image, Link, Text, VStack } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';

import { tokenList } from '@/constants';
import { AuthWrapper } from '@/features/auth';
import type { User } from '@/interface/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURL } from '@/utils/validUrl';

import { TotalStats } from './TotalStats';

interface SideBarProps {
  total: number;
  listings: number;
  earners?: User[];
  userInfo?: User;
  isTotalLoading: boolean;
}

const Step = ({
  number,
  isComplete,
}: {
  number: number;
  isComplete: boolean;
}) => {
  return (
    <Center
      zIndex={'200'}
      w={'2.375rem'}
      h={'2.375rem'}
      color={isComplete ? '#FFFFFF' : '#94A3B8'}
      bg={isComplete ? '#6366F1' : '#FFFFFF'}
      border={
        isComplete ? '0 transparent #6366F100' : '0.0625rem solid #94A3B8'
      }
      rounded={'full'}
    >
      {isComplete ? (
        <Image
          w={'1.25rem'}
          h={'1.25rem'}
          alt="New New"
          src="/assets/icons/white-tick.svg"
        />
      ) : (
        number
      )}
    </Center>
  );
};

interface GettingStartedProps {
  userInfo?: User;
}

const GettingStarted = ({ userInfo }: GettingStartedProps) => {
  const router = useRouter();
  return (
    <Box>
      <Text mb={'1.5rem'} color={'gray.400'} fontSize={'sm'} fontWeight={500}>
        GETTING STARTED
      </Text>
      <Flex h={'12.5rem'}>
        <VStack pos={'relative'} justifyContent={'space-between'} h={'100%'}>
          <Step number={1} isComplete={!!userInfo?.id} />

          <Step
            number={2}
            isComplete={!!userInfo?.id && !!userInfo?.isTalentFilled}
          />
          <Step
            number={3}
            isComplete={!!userInfo?.id && !!userInfo.totalEarnedInUSD}
          />
          <Flex pos={'absolute'} w={'0.0625rem'} h={'90%'} bg={'#CBD5E1'} />
        </VStack>
        <VStack
          pos={'relative'}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
          h={'100%'}
        >
          <Box ml={'0.8125rem'}>
            <AuthWrapper>
              <Text
                as="button"
                color={!userInfo?.id ? 'black' : 'brand.purple'}
                fontSize={'md'}
                fontWeight={500}
                _hover={{
                  color: 'brand.purple',
                }}
              >
                Create your account
              </Text>
            </AuthWrapper>
            <Text color={'gray.500'} fontSize={'md'} fontWeight={500}>
              and get personalized notifications
            </Text>
          </Box>
          <Box ml={'0.8125rem'}>
            {!userInfo?.id || !userInfo?.isTalentFilled ? (
              <AuthWrapper>
                <Text
                  as="button"
                  color={'black'}
                  fontSize={'md'}
                  fontWeight={500}
                  _hover={{
                    color: 'brand.purple',
                  }}
                  onClick={() => {
                    if (userInfo?.id) {
                      router.push(`/new/talent`);
                    }
                  }}
                >
                  Complete your profile
                </Text>
              </AuthWrapper>
            ) : (
              <Text color={'brand.purple'} fontSize={'md'} fontWeight={500}>
                Complete your profile
              </Text>
            )}
            <Text color={'gray.500'} fontSize={'md'} fontWeight={500}>
              and participate on Earn
            </Text>
          </Box>
          <Box ml={'0.8125rem'}>
            {!userInfo?.id || !userInfo.totalEarnedInUSD ? (
              <AuthWrapper>
                <Text
                  as="button"
                  color={'black'}
                  fontSize={'md'}
                  fontWeight={500}
                  _hover={{
                    color: 'brand.purple',
                  }}
                  onClick={() => {
                    if (userInfo?.id) {
                      router.push('/all');
                    }
                  }}
                >
                  Win a bounty or project
                </Text>
              </AuthWrapper>
            ) : (
              <Text color={'brand.purple'} fontSize={'md'} fontWeight={500}>
                Win a bounty or project
              </Text>
            )}
            <Text color={'gray.500'} fontSize={'md'} fontWeight={500}>
              and build proof-of-work
            </Text>
          </Box>
        </VStack>
      </Flex>
    </Box>
  );
};

interface EarnerProps {
  name: string;
  avatar?: string;
  amount: number;
  bounty?: string;
  token?: string;
  username: string;
}
const Earner = ({
  amount,
  name,
  avatar,
  bounty,
  token,
  username,
}: EarnerProps) => {
  const tokenObj = tokenList.find((t) => t.tokenSymbol === token);
  const tokenIcon = tokenObj
    ? tokenObj.icon
    : '/assets/landingsponsor/icons/usdc.svg';
  return (
    <NextLink href={`${getURL()}t/${username}`}>
      <Flex align={'center'} w={'100%'} my={4}>
        {avatar ? (
          <Image
            boxSize="32px"
            mr={'1.0625rem'}
            alt=""
            rounded={'full'}
            src={avatar.replace(
              '/upload/',
              '/upload/c_scale,w_64,h_64,f_auto/',
            )}
          />
        ) : (
          <Center mr={'1.0625rem'}>
            <Avatar
              size="32px"
              name={name}
              variant="marble"
              colors={['#da4c65', '#5e25c2', '#d433ab', '#2e53af', '#ceea94']}
            />
          </Center>
        )}

        <Box w="11rem">
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

const RecentEarners = ({ earners }: { earners?: User[] }) => {
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
      <Flex justify={'space-between'} fontSize="sm">
        <Text mb={4} color={'gray.400'} fontWeight={500}>
          RECENT EARNERS
        </Text>
        <Link
          className="ph-no-capture"
          as={NextLink}
          color="brand.purple"
          fontWeight={500}
          href="/leaderboard"
          onClick={() => {
            posthog.capture('view leaderboard_homepage');
          }}
        >
          Leaderboard <ChevronRightIcon w={'1.1rem'} h={'1.1rem'} />
        </Link>
      </Flex>
      <VStack>
        <Box
          ref={marqueeRef}
          overflowY="hidden"
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
            />
          ))}
        </Box>
      </VStack>
    </Box>
  );
};

export const HomeSideBar = ({
  userInfo,
  listings,
  total,
  earners,
  isTotalLoading,
}: SideBarProps) => {
  return (
    <Flex direction={'column'} rowGap={'2.5rem'} w={'22.125rem'} pl={6}>
      <GettingStarted userInfo={userInfo} />
      <TotalStats
        isTotalLoading={isTotalLoading}
        bountyCount={listings}
        TVE={total}
      />
      {/* <SidebarBanner /> */}
      <RecentEarners earners={earners} />
    </Flex>
  );
};
