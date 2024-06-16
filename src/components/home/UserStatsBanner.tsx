import { Flex, Skeleton, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { userStore } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { EarnAvatar } from '../shared/EarnAvatar';

interface Stats {
  wins: number;
  participations: number;
}

interface StatProps {
  value: number | string;
  label: string;
}
const Stat = ({ value, label }: StatProps) => {
  return (
    <VStack align="start" gap={0}>
      <Text fontWeight={600}>{value}</Text>
      <Text
        color="brand.purple.400"
        fontSize={{ base: 'sm', md: 'unset' }}
        fontWeight={500}
      >
        {label}
      </Text>
    </VStack>
  );
};

export const UserStatsBanner = () => {
  const { userInfo } = userStore();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  const [stats, setStats] = useState<Stats | null>(null);

  async function getStats() {
    try {
      const result = await axios.get<Stats>('/api/user/getStats');
      setStats(result.data);
    } catch (err) {
      console.log('Error getting stats - ', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    getStats();
  }, []);

  if (!userInfo) return <></>;

  if ((!session && status === 'loading') || loading) {
    return (
      <Skeleton
        h={isLessThan768px ? '200' : '120'}
        maxH="300px"
        mx={'auto'}
        mb={8}
        p={{ base: '6', md: '10' }}
        rounded={'md'}
      />
    );
  }

  return (
    <Flex
      align={'center'}
      justify="space-between"
      wrap="wrap"
      gap={4}
      px={8}
      py={6}
      color="white"
      bgGradient="linear(to-r, #4C52E2, #4338CA)"
      rounded="md"
    >
      <Flex align="center" gap={4}>
        <EarnAvatar id={userInfo.id} avatar={userInfo.photo} size="52px" />
        <VStack align="start" gap={0}>
          <Text
            maxW="25rem"
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight={600}
            textOverflow={'ellipsis'}
            noOfLines={1}
          >
            Welcome back, {userInfo.firstName}
          </Text>
          <Text color="brand.purple.300" fontSize={{ base: 'xs', md: 'unset' }}>
            We’re so glad to have you on Earn
          </Text>
        </VStack>
      </Flex>
      {stats && (userInfo.totalEarnedInUSD ?? 0) > 0 && (
        <Flex gap={{ base: 4, sm: 8 }}>
          <Stat
            value={'$' + formatNumberWithSuffix(userInfo.totalEarnedInUSD ?? 0)}
            label="Total Earned"
          />
          <Stat value={stats.participations} label="Participated" />
          <Stat value={stats.wins} label="Won" />
        </Flex>
      )}
    </Flex>
  );
};
