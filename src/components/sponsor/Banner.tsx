import { Box, Flex, Image, Text } from '@chakra-ui/react';
import Avatar from 'boring-avatars';

import { userStore } from '@/store/user';

export function Banner() {
  const { userInfo } = userStore();

  if (!userInfo?.currentSponsorId) return null;
  return (
    <Flex gap={4} w="100%">
      <Box
        w="100%"
        mb={6}
        px={8}
        py={6}
        color="white"
        bg="white"
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius="md"
      >
        <Flex align="start" bg="transparent">
          {userInfo?.currentSponsor?.logo ? (
            <Image
              boxSize="52px"
              mt={2}
              borderRadius={4}
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
            <Text color={'brand.slate.900'} fontSize="2xl" fontWeight={700}>
              {userInfo?.currentSponsor?.name}
            </Text>
            <Text color={'brand.slate.700'} fontSize="md" fontWeight={400}>
              {userInfo?.currentSponsor?.bio || ''}
            </Text>
          </Box>
        </Flex>
      </Box>
      <Box
        w="60%"
        mb={6}
        px={8}
        py={6}
        color="white"
        bg="#EEF2FF"
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius="md"
      >
        <Flex align={'center'} wrap={'nowrap'}>
          <Image
            w={'3.2rem'}
            h={14}
            mr={3}
            alt="text pratik"
            src="/assets/sponsor/pratik.png"
          />
          <Box>
            <Text color="brand.slate.900" fontWeight={600}>
              Stuck with something?
            </Text>
            <Text color="brand.slate.500" fontWeight={600}>
              Text Pratik
            </Text>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}
