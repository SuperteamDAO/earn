import {
  Box,
  Divider,
  Flex,
  Skeleton,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { userStatsQuery } from '@/features/home';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface StatProps {
  value: number | string;
  label: string;
}

const Stat = ({ value, label }: StatProps) => {
  return (
    <Box>
      <Text fontWeight={600}>{value}</Text>
      <Text
        color="#c4c2ef"
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight={500}
      >
        {label}
      </Text>
    </Box>
  );
};

export const UserStatsBanner = () => {
  const { user } = useUser();
  const { data: session, status } = useSession();
  const { data: stats, isLoading } = useQuery(userStatsQuery);
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  if (!user) return <></>;

  if ((!session && status === 'loading') || isLoading) {
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
      align={{ base: 'unset', md: 'center' }}
      justify="space-between"
      wrap="wrap"
      direction={{ base: 'column', md: 'row' }}
      gap={4}
      px={{ base: 6, md: 8 }}
      py={6}
      color="white"
      bgGradient="linear(to-r, #4C52E2, #4338CA)"
      rounded="md"
    >
      <Flex align="center" gap={4}>
        <EarnAvatar id={user.id} avatar={user.photo} size="52px" />
        <VStack align="start" gap={0}>
          <Text
            maxW="25rem"
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight={600}
            textOverflow={'ellipsis'}
            noOfLines={1}
          >
            Welcome back, {user.firstName}
          </Text>
          <Text color="#c4c2ef" fontSize={'sm'}>
            We’re so glad to have you on Earn
          </Text>
        </VStack>
      </Flex>
      <Divider display={{ md: 'none' }} borderColor={'#7671da'} />
      {stats && (stats.wins ?? 0) > 0 && (
        <Flex
          justify={{ base: 'space-between', md: 'unset' }}
          gap={{ base: 4, sm: 8 }}
          mx={0.5}
          mt={{ base: -1.5, md: 0 }}
        >
          <Stat
            value={'$' + formatNumberWithSuffix(stats.totalWinnings ?? 0, 1)}
            label="Total Earned"
          />
          <Stat value={stats.participations} label="Participated" />
          <Stat value={stats.wins} label="Won" />
        </Flex>
      )}
    </Flex>
  );
};
