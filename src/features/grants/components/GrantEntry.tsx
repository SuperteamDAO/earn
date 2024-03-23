import { Box, Button, Center, Flex, Image, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

export const GrantEntry = ({
  color,
  icon,
  title,
  shortDescription = '',
  rewardAmount,
  token,
  slug,
  link,
  logo,
}: {
  color: string;
  icon: string;
  title: string;
  shortDescription?: string;
  rewardAmount?: number;
  token?: string;
  link?: string;
  slug: string;
  logo?: string;
}) => {
  return (
    <Box w={80}>
      {logo ? (
        <Image
          w={'320px'}
          h={'180px'}
          mb={5}
          objectFit={'cover'}
          alt=""
          src={logo}
        />
      ) : (
        <Center w={'320px'} h={'180px'} mb={5} bg={color}>
          <Image w={16} alt="" src={icon} />
        </Center>
      )}
      <Text mb={'4px'} fontSize={'md'} fontWeight={'600'}>
        {title}
      </Text>
      <Text mb={5} color={'brand.slate.500'} fontSize={'sm'}>
        {shortDescription}
      </Text>
      <Flex align={'center'} justify={'space-between'}>
        <Text color={'brand.slate.500'} fontSize={'13px'} fontWeight={'600'}>
          {token && rewardAmount
            ? `Upto ${token} ${(rewardAmount || 0).toLocaleString()}`
            : ''}
        </Text>
        {!!link && (
          <Link as={NextLink} href={`/grants/${slug}`}>
            <Button variant="outline">Apply</Button>
          </Link>
        )}
      </Flex>
    </Box>
  );
};
