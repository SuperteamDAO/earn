import { Box, Center, Flex, Image, Text, VStack } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import LoginWrapper from '@/components/Header/LoginWrapper';
import { tokenList } from '@/constants';
import type { User } from '@/interface/user';
import { getURL } from '@/utils/validUrl';

interface SideBarProps {
  total: number;
  listings: number;
  earners?: User[];
  userInfo?: User;
}

const Step = ({
  number,
  isComplete,
}: {
  number: number;
  isComplete: boolean;
}) => {
  if (isComplete) {
    return (
      <Center
        zIndex={'200'}
        w={'2.375rem'}
        h={'2.375rem'}
        bg={'#6366F1'}
        rounded={'full'}
      >
        <Image
          w={'1.25rem'}
          h={'1.25rem'}
          alt=""
          src="/assets/icons/white-tick.svg"
        />
      </Center>
    );
  }

  return (
    <Center
      zIndex={'200'}
      w={'2.375rem'}
      h={'2.375rem'}
      color={'#94A3B8'}
      bg={'#FFFFFF'}
      border={'0.0625rem solid #94A3B8'}
      rounded={'full'}
    >
      {number}
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
        <VStack pos={'relative'} justifyContent={'space-between'} h={'100%'}>
          <Box ml={'0.8125rem'}>
            {!userInfo?.id ? (
              <Text
                as="button"
                color={'black'}
                fontSize={'md'}
                fontWeight={500}
                _hover={{
                  color: 'brand.purple',
                }}
                onClick={() => setTriggerLogin(true)}
              >
                Create your account
              </Text>
            ) : (
              <Text color={'brand.purple'} fontSize={'md'} fontWeight={500}>
                Create your account
              </Text>
            )}
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
              and get seen by hiring managers
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
                    router.push('/bounties');
                  } else {
                    setTriggerLogin(true);
                  }
                }}
              >
                Win a bounty
              </Text>
            ) : (
              <Text color={'brand.purple'} fontSize={'md'} fontWeight={500}>
                Win a bounty
              </Text>
            )}
            <Text color={'gray.500'} fontSize={'md'} fontWeight={500}>
              and get your Proof-of-Work NFT
            </Text>
          </Box>
        </VStack>
      </Flex>
    </Box>
  );
};

const TotalStats = ({
  bountyCount,
  TVL,
}: {
  bountyCount: number;
  TVL: number;
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
          <Text color={'black'} fontSize={'sm'} fontWeight={'600'}>
            ${TVL.toLocaleString()}{' '}
            <span
              style={{
                color: '#64748B',
              }}
            ></span>
          </Text>
          <Text color={'gray.500'} fontSize={'xs'} fontWeight={'400'}>
            Total Value Listed
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
          <Text color={'black'} fontSize={'sm'} fontWeight={'600'}>
            {bountyCount}
          </Text>
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
  slug: string;
  token?: string;
}
const Earner = ({ amount, name, avatar, bounty, slug, token }: EarnerProps) => {
  const tokenObj = tokenList.find((t) => t.tokenSymbol === token);
  const tokenIcon = tokenObj
    ? tokenObj.icon
    : '/assets/landingsponsor/icons/usdc.svg';
  return (
    <NextLink href={`${getURL()}listings/bounties/${slug}`}>
      <Flex align={'center'} w={'100%'} my={4}>
        {avatar ? (
          <Image
            boxSize="32px"
            mr={'1.0625rem'}
            alt=""
            rounded={'full'}
            src={avatar}
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
            {/* {name} */}
          </Text>
          <Text color={'gray.400'} fontSize={'xs'} fontWeight={500}>
            won {bounty?.slice(0, 15)}...
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
  const [isPaused, setIsPaused] = useState(false);
  let timeoutId: number | undefined;

  useEffect(() => {
    const marquee = marqueeRef.current;
    let lastScrollTop = 0;

    const animate = () => {
      if (marquee && !isPaused) {
        if (marquee.scrollTop === lastScrollTop && marquee.scrollTop !== 0) {
          marquee.scrollTop = 1;
        }
        lastScrollTop = marquee.scrollTop;
        marquee.scrollTop += 1;
      }
      timeoutId = window.setTimeout(animate, 20);
    };

    const handleMouseToggle = () => {
      setIsPaused(!isPaused);
    };

    if (marquee) {
      marquee.addEventListener('mouseenter', handleMouseToggle);
      marquee.addEventListener('mouseleave', handleMouseToggle);
    }

    animate();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (marquee) {
        marquee.removeEventListener('mouseenter', handleMouseToggle);
        marquee.removeEventListener('mouseleave', handleMouseToggle);
      }
    };
  }, [isPaused]);

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
          css={{
            animation: `marquee 1s linear infinite`,
          }}
        >
          {(earners ? [...earners, ...earners] : []).map(
            (t: any, index: number) => (
              <Earner
                amount={t.reward ?? 0}
                token={t.rewardToken}
                name={`${t.firstName} ${t.lastName}`}
                avatar={t.photo}
                key={`${t.id}-${index}`}
                bounty={t.title ?? ''}
                slug={t.slug}
              />
            )
          )}
        </Box>
      </VStack>
    </Box>
  );
};

const SideBar = ({ userInfo, listings, total, earners }: SideBarProps) => {
  return (
    <Flex direction={'column'} rowGap={'2.5rem'} w={'22.125rem'} pl={6}>
      <GettingStarted userInfo={userInfo} />
      <TotalStats bountyCount={listings} TVL={total} />
      <RecentEarners earners={earners} />
    </Flex>
  );
};

export default SideBar;
