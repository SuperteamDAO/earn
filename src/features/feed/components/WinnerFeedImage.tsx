import { Flex, Image, Text } from '@chakra-ui/react';

import { tokenList } from '@/constants';
import { type Rewards } from '@/features/listings';
import { getRankLabels } from '@/utils/rank';

export const WinnerFeedImage = ({
  token,
  winnerPosition,
  rewards,
  grantApplicationAmount,
}: {
  token: string | undefined;
  winnerPosition: keyof Rewards | undefined;
  rewards: Rewards | undefined;
  grantApplicationAmount?: number;
}) => {
  return (
    <Flex
      justify={'center'}
      direction={'column'}
      w="full"
      h={{ base: '200px', md: '350px' }}
      bg={'#7E51FF'}
      borderTopRadius={6}
    >
      <Image
        w={{ base: '36px', md: '80px' }}
        h={{ base: '36px', md: '80px' }}
        mx={'auto'}
        alt="winner"
        src={'/assets/icons/celebration.png'}
      />
      <Flex
        align="center"
        justify={'center'}
        gap={{ base: '1', md: '4' }}
        w="100%"
        mt={4}
      >
        <Image
          w={{ base: '8', md: '16' }}
          h={{ base: '8', md: '16' }}
          alt={`${token} icon`}
          src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
        />
        <Text
          color="white"
          fontSize={{ base: '2xl', md: '5xl' }}
          fontWeight={600}
        >
          {!!grantApplicationAmount ? (
            grantApplicationAmount
          ) : (
            <>
              {winnerPosition ? `${rewards?.[Number(winnerPosition)]}` : 'N/A'}
            </>
          )}{' '}
          {token}
        </Text>
      </Flex>
      <Text
        w="fit-content"
        mx="auto"
        my={4}
        px={4}
        py={2}
        color="white"
        fontSize={{ base: 'xs', md: 'lg' }}
        fontWeight={500}
        bg={'rgba(85, 54, 171, 0.54)'}
        borderRadius={'full'}
      >
        {!!grantApplicationAmount ? (
          'GRANT'
        ) : (
          <>{getRankLabels(Number(winnerPosition))?.toUpperCase()} PRIZE</>
        )}
      </Text>
    </Flex>
  );
};
