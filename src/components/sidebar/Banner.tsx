import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import Avatar from 'boring-avatars';

import { userStore } from '@/store/user';

function Banner() {
  const { userInfo } = userStore();

  if (!userInfo?.currentSponsorId) return null;
  return (
    <Box
      mb={6}
      px={8}
      py={6}
      color="white"
      borderRadius="md"
      bgColor="brand.charcoal.700"
    >
      <Flex align="start" bg="transparent">
        {userInfo?.currentSponsor?.logo ? (
          <Image
            boxSize="52px"
            mt={2}
            borderRadius="full"
            alt={userInfo?.currentSponsor?.name}
            src={userInfo?.currentSponsor?.logo}
          />
        ) : (
          <Avatar
            colors={['#92A1C6', '#F0AB3D', '#C271B4']}
            name={userInfo?.currentSponsor?.name}
            size={32}
            variant="marble"
          />
        )}
        <Box display={{ base: 'none', md: 'block' }} ml={6}>
          <Text fontSize="2xl" fontWeight={700}>
            {userInfo?.currentSponsor?.name}
          </Text>
          <Text fontSize="md" fontWeight={400}>
            {userInfo?.currentSponsor?.bio || ''}
          </Text>
          <Link
            color="brand.slate.300"
            fontSize="sm"
            fontWeight={400}
            href={userInfo?.currentSponsor?.url}
            isExternal
          >
            {userInfo?.currentSponsor?.url}
          </Link>
        </Box>
      </Flex>
    </Box>
  );
}

export default Banner;
