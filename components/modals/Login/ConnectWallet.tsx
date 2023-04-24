import { Box, Flex, Image, Text } from '@chakra-ui/react';
import type { Wallet } from '@solana/wallet-adapter-react';

type ConnectWalletProps = {
  wallets: Wallet[];
  onConnectWallet: (wallet: Wallet) => Promise<void>;
};

export default function ConnectWallet({
  wallets,
  onConnectWallet,
}: ConnectWalletProps) {
  return (
    <Box>
      <Text mb={4} color="brand.slate.500" fontSize="lg" textAlign="center">
        Connect Wallet
      </Text>
      {wallets.map((wallet, index) => (
        <Box
          key={index}
          mb={1}
          px={3}
          py={1}
          color="brand.slate.500"
          border="1px solid"
          borderColor="brand.slate.100"
          borderRadius="md"
          _hover={{
            bg: 'brand.purple',
            color: 'white',
          }}
          cursor="pointer"
          onClick={onConnectWallet.bind(null, wallet)}
        >
          <Flex align="center" gap={4} w="100%">
            <Box
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              w="2rem"
              h="2rem"
            >
              <Image
                w="70%"
                h="70%"
                alt={`${wallet?.adapter?.name} Icon`}
                src={wallet?.adapter?.icon ?? ''}
              />
            </Box>
            <Text ml={2} fontWeight={700}>
              {wallet?.adapter?.name ?? ''}
            </Text>
          </Flex>
        </Box>
      ))}
    </Box>
  );
}
