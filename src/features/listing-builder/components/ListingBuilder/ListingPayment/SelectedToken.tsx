import { HStack, Image, Text } from '@chakra-ui/react';

import { type Token } from './types';

export function SelectedToken({ token }: { token: Token | undefined }) {
  return (
    token && (
      <>
        <HStack p={2} borderColor="brand.slate.300" borderLeftWidth="1px">
          <Image
            w={'1.6rem'}
            alt={token.tokenName as string}
            rounded={'full'}
            src={token?.icon}
          />
          <Text>{token?.tokenSymbol}</Text>
        </HStack>
      </>
    )
  );
}
