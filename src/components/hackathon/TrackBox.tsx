import { Box, Flex, Image, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { tokenList } from '@/constants';
import { type TrackProps } from '@/interface/hackathon';

export const TrackBox = ({
  title,
  sponsor,
  token,
  rewardAmount,
  slug,
}: TrackProps) => {
  return (
    <Box
      as={NextLink}
      p={{ base: 3, md: 4 }}
      borderWidth={'1px'}
      borderColor="brand.slate.200"
      borderRadius={8}
      href={`/listings/hackathon/${slug}`}
    >
      <Flex align="center" gap={3}>
        <Image
          w={{ base: 12, md: 14 }}
          h={{ base: 12, md: 14 }}
          borderRadius={3}
          objectFit={'cover'}
          alt={sponsor.name}
          src={sponsor.logo}
        />
        <Flex direction={'column'}>
          <Text
            color={'brand.slate.900'}
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight={600}
          >
            {title}
          </Text>
          <Text
            color={'brand.slate.500'}
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={500}
          >
            {sponsor.name}
          </Text>
        </Flex>
      </Flex>
      <Flex align="center" justify={'end'} gap={1}>
        <Image
          w={{ base: 4, md: 6 }}
          h={{ base: 4, md: 6 }}
          alt={token}
          rounded={'full'}
          src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
        />
        <Text
          color={'brand.slate.700'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {rewardAmount?.toLocaleString()}
        </Text>
        <Text
          color={'brand.slate.400'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {token}
        </Text>
      </Flex>
    </Box>
  );
};
