import { Box, Divider, Flex, Image, Link, Text } from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import { MdOutlineChatBubbleOutline } from 'react-icons/md';

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
        <Flex align="center" gap={6}>
          <Flex align="center" gap={3}>
            {userInfo?.currentSponsor?.logo ? (
              <Image
                boxSize="52px"
                borderRadius={4}
                alt={userInfo?.currentSponsor?.name}
                src={userInfo?.currentSponsor?.logo}
              />
            ) : (
              <Avatar
                colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                name={userInfo?.currentSponsor?.name}
                size={54}
                variant="marble"
              />
            )}
            <Box>
              <Text color={'brand.slate.900'} fontSize="xl" fontWeight={600}>
                {userInfo?.currentSponsor?.name}
              </Text>
              <Text color={'brand.slate.500'} fontSize="lg" fontWeight={400}>
                Sponsor since
              </Text>
            </Box>
          </Flex>
          <Divider
            w="2px"
            h={14}
            borderColor={'brand.slate.200'}
            orientation="vertical"
          />
          <Box>
            <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
              Committed
            </Text>
            <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
              $1000
            </Text>
          </Box>
          <Box>
            <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
              Listings
            </Text>
            <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
              5
            </Text>
          </Box>
          <Box>
            <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
              Submissions
            </Text>
            <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
              400
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
        <Link href="https://t.me/pratikdholani" isExternal>
          <Flex align={'center'} justify={'space-between'}>
            <Flex align={'center'}>
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
            <MdOutlineChatBubbleOutline color="#1E293B" size={24} />
          </Flex>
        </Link>
      </Box>
    </Flex>
  );
}
