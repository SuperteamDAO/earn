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
              Welcome to Solar {st.displayValue}
              {`'s`} earnings page — use these opportunities to earn in global
              standards and gain membership in the most exclusive Solana
              community of {st.displayValue}!
            </Text>
          </>
        )}
      </VStack>
    </VStack>
  );
}
