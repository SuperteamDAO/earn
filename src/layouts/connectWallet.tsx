/* eslint-disable @next/next/no-img-element */
import { Box, Flex, Grid, Image, Text } from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

import { Navbar } from '../components/navbar/navbar';

export const ConnectWallet = () => {
  const { wallets, select, connected } = useWallet();
  const onConnectWallet = async (wallet: SolanaWallet) => {
    try {
      console.log('con', wallet.readyState);

      console.log('done');
      select(wallet.adapter.name);
      // await connect();

      console.log(connected);
    } catch (e) {
      console.log(e, '--');

      toast.error('Wallet not found');
    }
  };
  return (
    <>
      <Grid
        w="100%"
        h="110vh"
        mt={'0'}
        fontFamily="Inter"
        bgImage={`url('/assets/bg/banner.png')`}
        bgSize="cover"
        bgRepeat="no-repeat"
        bgPos="center"
        placeContent="center"
      >
        <Navbar />
        <Flex
          align="center"
          justify="center"
          gap="1rem"
          w="22rem"
          mt={20}
          p="2.5rem 2.2rem"
          bg="white"
          border="1px solid #E2E8EF"
          borderRadius="1.6rem"
          shadow="0px 2px 4px rgba(56, 77, 110, 0.06)"
          flexFlow="column"
        >
          <Box alignSelf="start" w="13rem" h="2rem">
            <img
              src="/assets/logo/logo.png"
              width="100%"
              height="100%"
              alt="Logo"
            />
          </Box>

          <Text
            pb="1rem"
            color="gray.400"
            fontSize="1rem"
            fontWeight={500}
            borderBottom="1px solid #E2E8EF"
          >
            Connect your wallet to continue to your dashboard
          </Text>
          <Flex
            align="start"
            justify="center"
            gap="1rem"
            w="100%"
            flexFlow="column"
          >
            {/* <WalletMultiButton /> */}
            {wallets.map((wallet: SolanaWallet, index) => {
              return (
                <>
                  <Flex
                    key={index}
                    align="center"
                    w="100%"
                    h="2.5rem"
                    p="0 1.5rem"
                    bg="gray.50"
                    borderRadius="1rem"
                    _hover={{
                      bg: 'gray.100',
                    }}
                    cursor="pointer"
                    onClick={onConnectWallet.bind(null, wallet)}
                  >
                    <Flex align="center" gap="1rem">
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
                          alt={`${wallet.adapter.name} Icon`}
                          src={wallet.adapter.icon ?? ''}
                        />
                      </Box>
                      <Text
                        ml={2}
                        color="gray.500"
                        fontSize="1.1rem"
                        fontWeight={600}
                      >
                        {wallet.adapter.name ?? ''}
                      </Text>
                    </Flex>
                  </Flex>
                </>
              );
            })}
          </Flex>
        </Flex>
      </Grid>
    </>
  );
};
