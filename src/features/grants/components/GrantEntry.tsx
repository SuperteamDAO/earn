import { Box, Button, Flex, Image, Link, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

import { tokenList } from '@/constants';

import { grantAmount } from '../utils';

export const GrantEntry = ({
  title,
  minReward,
  maxReward,
  token,
  slug,
  logo,
}: {
  title: string;
  rewardAmount?: number;
  token?: string;
  slug: string;
  logo?: string;
  minReward?: number;
  maxReward?: number;
}) => {
  const tokenIcon = tokenList.find((ele) => ele.tokenSymbol === token)?.icon;

  const GrantAmount = () => {
    return (
      <Flex align={'center'} mt={-2}>
        <Image w={4} h={4} mr={1} alt={token} rounded="full" src={tokenIcon} />
        <Flex align="baseline" gap={1}>
          <Text
            color="brand.slate.600"
            fontSize="sm"
            fontWeight="600"
            whiteSpace="nowrap"
          >
            {grantAmount({
              maxReward: maxReward!,
              minReward: minReward!,
            })}
          </Text>
          <Text color="gray.600" fontSize="sm" fontWeight={500}>
            {token}
          </Text>
        </Flex>
      </Flex>
    );
  };

  return (
    <Box
      as={NextLink}
      overflow="hidden"
      w={{ base: '100%', sm: 80 }}
      borderWidth="1px"
      borderRadius="lg"
      shadow="md"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
      transition="all 0.3s"
      href={`/grants/${slug}`}
    >
      <Box pos="relative">
        <Image
          w={'100%'}
          h={{ base: '240px', sm: '180px' }}
          objectFit="cover"
          alt={title}
          src={logo || '/api/placeholder/400/240'}
        />
      </Box>
      <VStack align="stretch" px={4} pt={1.5} pb={4} spacing={2}>
        <Text
          overflow="hidden"
          maxW="full"
          color="brand.slate.700"
          fontSize="lg"
          fontWeight={600}
          textOverflow="ellipsis"
          noOfLines={1}
          title={title}
        >
          {title}
        </Text>
        <GrantAmount />
        <Link as={NextLink} href={`/grants/${slug}`}>
          <Button
            w={'full'}
            color="brand.slate.400"
            fontSize={'sm'}
            fontWeight={500}
            borderColor={'brand.slate.300'}
            size={'sm'}
            variant="outline"
          >
            Apply Now
          </Button>
        </Link>
      </VStack>
    </Box>
  );
};
