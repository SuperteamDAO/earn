import { Box, Flex, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { timeAgoShort } from '@/utils/timeAgo';

interface FeedCardHeaderProps {
  name: string;
  username?: string;
  action: string;
  description?: string;
  photo: string | undefined;
  createdAt: string;
  type: 'activity' | 'profile';
}

export const FeedCardHeader = ({
  name,
  username,
  action,
  description,
  createdAt,
  type,
}: FeedCardHeaderProps) => {
  const router = useRouter();
  if (type === 'profile') {
    return (
      <Box mt={-0.5} mb={-1}>
        <Flex align="center" justify={'space-between'}>
          <Flex align="center">
            <Text
              color={'brand.slate.400'}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={500}
            >
              <Text as={'span'} color={'brand.slate.800'} fontWeight={600}>
                {name}
              </Text>{' '}
              {action}
            </Text>
          </Flex>
          <Text
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={500}
          >
            {timeAgoShort(createdAt)}
          </Text>
        </Flex>
        <Text color={'brand.slate.500'} fontSize={{ base: 'sm', md: 'md' }}>
          {description}
        </Text>
      </Box>
    );
  }
  return (
    <Flex>
      <Flex direction={'column'} mt={-0.5}>
        <Text
          color={'brand.slate.800'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
          _hover={{ textDecoration: 'underline' }}
          cursor={'pointer'}
          onClick={() => router.push(`/t/${username}`)}
        >
          {name}
        </Text>
        <Flex gap={1}>
          <Text
            mt={-1}
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={500}
            _hover={{ textDecoration: 'underline' }}
            cursor={'pointer'}
          >
            @{username}
          </Text>
          <Text
            mt={-1}
            color={'brand.slate.400'}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={500}
          >
            • {timeAgoShort(createdAt)}
          </Text>
        </Flex>
        <Text
          mt={{ base: 1, md: 2 }}
          color={'brand.slate.600'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={500}
        >
          {action}
        </Text>
      </Flex>
    </Flex>
  );
};
