import { InfoOutlineIcon } from '@chakra-ui/icons';
import { Box, Flex, Image, Spinner, Text, Tooltip } from '@chakra-ui/react';
import type { Wallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

type ConnectWalletProps = {
  wallets: Wallet[];
  onConnectWallet: (wallet: Wallet) => Promise<void>;
};

export default function ConnectWallet({
  wallets,
  onConnectWallet,
}: ConnectWalletProps) {
  const [loadingWallet, setLoadingWallet] = useState('');

  const connect = (wallet: Wallet) => {
    setLoadingWallet(wallet?.adapter?.name);
    onConnectWallet(wallet);
  };

  return (
    <Box>
      <Flex
        align="center"
        justify="center"
        mb={4}
        color="brand.slate.500"
        fontSize="md"
        textAlign="center"
      >
        Connect your Primary Wallet
        <Tooltip
          color="brand.slate.700"
          bg="brand.slate.200"
          label="Connect your primary wallet where you can receive the prize money. Don't use burner wallets."
          placement="bottom"
        >
          <InfoOutlineIcon ml={1} w={4} h={4} />
        </Tooltip>
      </Flex>
      {wallets.map((wallet, index) => {
        const isLoading = loadingWallet === wallet?.adapter?.name;
        return (
          <Box
            key={index}
            mb={1}
            px={3}
            py={1}
            color={isLoading ? 'brand.slate.300' : 'brand.slate.500'}
            bg={isLoading ? 'brand.slate.100' : 'white'}
            border="1px solid"
            borderColor="brand.slate.100"
            borderRadius="md"
            _hover={{
              bg: isLoading ? 'brand.slate.100' : 'brand.purple',
              color: isLoading ? 'brand.slate.300' : 'white',
            }}
            cursor={isLoading ? 'default' : 'pointer'}
            onClick={() => connect(wallet)}
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
              <Flex align="center" gap={2}>
                <Text ml={2} fontWeight={700}>
                  {wallet?.adapter?.name ?? ''}
                </Text>
                {isLoading && <Spinner color="brand.slate.500" size="xs" />}
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </Box>
  );
}
