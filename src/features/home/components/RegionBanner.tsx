import { Box, Text, VStack } from '@chakra-ui/react';
import NextImage from 'next/image';

import { UserFlag } from '@/components/shared/UserFlag';
import { type Superteams } from '@/constants/Superteam';

export function RegionBanner({ st }: { st: (typeof Superteams)[0] }) {
  return (
    <VStack pos="relative" w="full" h="18rem">
      <NextImage
        src={st.banner}
        alt={st.name}
        width={1440}
        height={290}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      <Box
        pos="absolute"
        top={0}
        left={0}
        display="block"
        w="full"
        h="full"
        bg="rgba(64,65,108,0.8)"
      />
      <VStack pos="absolute" top="50%" px={4} transform="translateY(-50%)">
        {st.code && <UserFlag location={st.code} isCode size="44px" />}
        {st.hello && (
          <>
            <Text
              color="white"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="bold"
            >
              {st.hello}, {st.displayValue}
            </Text>

            <Text
              align="center"
              maxW="40rem"
              color="white"
              fontSize={{ base: 'sm', md: 'lg' }}
              fontWeight="medium"
            >
              歡迎來到 Solar Earn 賞金頁面！這裏有不同類型的賞金任務，Solar
              們可以根據自己的特長、興趣來認領任務;
              項目方們可以發佈賞金任務讓社區成員們參與，共建 Solar 社區和 Solana
              生態。
            </Text>
          </>
        )}
      </VStack>
    </VStack>
  );
}
