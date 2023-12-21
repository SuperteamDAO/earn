import { InfoOutlineIcon } from '@chakra-ui/icons';
import { Box, Flex, Image, Spinner, Text, Tooltip } from '@chakra-ui/react';
import type { Wallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { isAndroid } from '@/utils/isAndroid';
import { isIOS } from '@/utils/isIOS';

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

type ConnectWalletProps = {
  wallets: Wallet[];
  onConnectWallet: (wallet: Wallet) => Promise<void>;
};

export default function ConnectWallet({
  wallets,
  onConnectWallet,
}: ConnectWalletProps) {
  const [loadingWallet, setLoadingWallet] = useState('');
  const isAndroidDevice = isAndroid();
  const isIOSDevice = isIOS();

  const validWalletNames = ['Phantom', 'Solflare', 'Glow'];
  const filteredWallets = isIOSDevice
    ? wallets.filter((wallet) =>
        validWalletNames.includes(wallet?.adapter?.name ?? '')
      )
    : wallets;

  const connect = (wallet: Wallet) => {
    setLoadingWallet(wallet?.adapter?.name);
    onConnectWallet(wallet);
  };

  const handleClick = () => {
    const button = document.querySelector(
      '.wallet-adapter-button.wallet-adapter-button-trigger'
    );
    if (button instanceof HTMLElement) {
      button.click();
    }
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
        {isAndroidDevice ? 'First Things First' : 'Connect your Primary Wallet'}
        {!isAndroidDevice ? (
          <Tooltip
            color="brand.slate.700"
            bg="brand.slate.200"
            label="Connect your primary wallet where you can receive the prize money. Don't use burner wallets."
            placement="bottom"
          >
            <InfoOutlineIcon ml={1} w={4} h={4} />
          </Tooltip>
        ) : null}
      </Flex>
      {isAndroidDevice ? (
        <Flex
          justify={'center'}
          w="100%"
          mb={1}
          my={9}
          px={3}
          py={1}
          color={'white'}
          bg={'brand.purple'}
          border="1px solid"
          borderColor="brand.slate.100"
          borderRadius="md"
          onClick={handleClick}
        >
          <WalletMultiButtonDynamic />
        </Flex>
      ) : (
        filteredWallets.map((wallet, index) => {
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
        })
      )}
    </Box>
  );
}
