import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Image,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { LoginWrapper } from '@/components/LoginWrapper';
import { tokenList } from '@/constants';
import type { User } from '@/interface/user';
import { RenaissanceLogo } from '@/svg/renaissance-logo';
import { getURL } from '@/utils/validUrl';

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
  const [triggerLogin, setTriggerLogin] = useState(false);
  return (
    <Box>
      <LoginWrapper
        triggerLogin={triggerLogin}
        setTriggerLogin={setTriggerLogin}
      />
      <Text mb={'1.5rem'} color={'gray.400'} fontWeight={500}>
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
            <Text
              as="button"
              color={!userInfo?.id ? 'black' : 'brand.purple'}
              fontSize={'md'}
              fontWeight={500}
              _hover={{
                color: 'brand.purple',
              }}
              onClick={() => !userInfo?.id && setTriggerLogin(true)}
            >
              Create your account
            </Text>
            <Text color={'gray.500'} fontSize={'md'} fontWeight={500}>
              and get personalized notifications
            </Text>
          </Box>
          <Box ml={'0.8125rem'}>
            {!userInfo?.id || !userInfo?.isTalentFilled ? (
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
                  } else {
                    setTriggerLogin(true);
                  }
                }}
              >
                Complete your profile
              </Text>
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
                  } else {
                    setTriggerLogin(true);
                  }
                }}
              >
                Win a bounty or project
              </Text>
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

const TotalStats = ({
  bountyCount,
  TVE,
  isTotalLoading,
}: {
  bountyCount: number;
  TVE: number;
  isTotalLoading: boolean;
}) => {
  return (
    <Flex
      align={'center'}
      justify={'space-between'}
      h={'69'}
      px={'0.5rem'}
      bg={'#F8FAFC'}
      rounded={'md'}
    >
      <Flex>
        <Image
          h={'1.5625rem'}
          mr={'0.5rem'}
          mb={'auto'}
          alt=""
          src="/assets/icons/lite-purple-dollar.svg"
        />
        <Box>
          {isTotalLoading ? (
            <Skeleton w="54px" h="14px" />
          ) : (
            <Text color={'black'} fontSize={'sm'} fontWeight={'600'}>
              ${TVE.toLocaleString()}
            </Text>
          )}
          <Text color={'gray.500'} fontSize={'xs'} fontWeight={'400'}>
            Total Value Earned
          </Text>
        </Box>
      </Flex>
      <Box w={'0.0625rem'} h={'50%'} bg={'#CBD5E1'}></Box>
      <Flex>
        <Image
          h={'25x'}
          mr={'0.5rem'}
          mb={'auto'}
          alt="suitcase"
          src="/assets/icons/lite-purple-suitcase.svg"
        />
        <Box>
          {isTotalLoading ? (
            <Skeleton w="32px" h="14px" />
          ) : (
            <Text color={'black'} fontSize={'sm'} fontWeight={'600'}>
              {bountyCount}
            </Text>
          )}
          <Text color={'gray.500'} fontSize={'xs'} fontWeight={'400'}>
            Opportunities Listed
          </Text>
        </Box>
      </Flex>
    </Flex>
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

        <Box>
          <Text color={'black'} fontSize={'sm'} fontWeight={500}>
            {name?.length > 25 ? `${name?.slice(0, 18)}...` : name}
          </Text>
          <Text color={'gray.400'} fontSize={'xs'} fontWeight={500}>
            {bounty?.slice(0, 20)}...
          </Text>
        </Box>
        <Flex align={'center'} columnGap={1} ml={'auto'}>
          <Image w={5} h={5} alt={`${token} icon`} src={tokenIcon} />
          <Text color={'gray.600'} fontSize={'sm'} fontWeight={500}>
            ${amount.toLocaleString()}
          </Text>
          <Text color={'gray.400'} fontSize={'sm'} fontWeight={500}>
            USDC
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
    <Box w={'100%'}>
      <Text mb={4} color={'gray.400'} fontWeight={500}>
        RECENT EARNERS
      </Text>
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

const SidebarBanner = () => {
  return (
    <Flex
      direction={'column'}
      gap={1}
      w={'full'}
      h={'max-content'}
      px={6}
      py={8}
      bgImage={"url('/assets/hackathon/renaissance/sidebar-bg.png')"}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      rounded={'lg'}
    >
      <HStack>
        <RenaissanceLogo
          styles={{
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '16px',
          }}
        />
      </HStack>
      <Text
        mt={1}
        color={'brand.slate.800'}
        fontSize={'lg'}
        fontWeight={'600'}
        lineHeight={'6'}
      >
        Build a project for the latest Solana global hackathon!
      </Text>
      <Text
        mt={'0.5rem'}
        color={'brand.slate.700'}
        fontSize={'1rem'}
        lineHeight={'1.1875rem'}
      >
        Submit to any of the Renaissance side tracks on Earn and stand to win
        some $$. Deadline for submissions is April 8, 2024.
      </Text>
      <Button
        as={NextLink}
        mt={'1.5625rem'}
        py={'0.8125rem'}
        fontWeight={'500'}
        textAlign={'center'}
        bg="#000"
        borderRadius={8}
        _hover={{ bg: '#716f6e' }}
        href="/renaissance"
      >
        View Tracks
      </Button>
    </Flex>
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
      <SidebarBanner />
      <RecentEarners earners={earners} />
    </Flex>
  );
};
