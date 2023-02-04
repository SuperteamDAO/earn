/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Box, Text, Grid, Flex, Image } from '@chakra-ui/react';
import {
  useWallet,
  Wallet as SolanaWallet,
} from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

export const ConnectWallet = () => {
  const { wallets, select } = useWallet();
  const onConnectWallet = async (wallet: SolanaWallet) => {
    try {
      await wallet.adapter.connect();

      select(wallet.adapter.name);
    } catch (e) {
      toast.error('Wallet not found');
    }
  };
  return (
    <>
      <Grid
        mt={'0'}
        w="100%"
        h="100vh"
        placeContent="center"
        bgImage={`url('/assets/bg/banner.png')`}
        bgRepeat="no-repeat"
        bgPos="center"
        bgSize="cover"
        fontFamily="Inter"
      >
        {/* {!noNav && <Navbar showMenu={noMenu} />} */}
        <Flex
          padding="2.5rem 2.2rem"
          flexFlow="column"
          align="center"
          justify="center"
          w="34rem"
          bg="white"
          border="1px solid #E2E8EF"
          boxShadow="0px 2px 4px rgba(56, 77, 110, 0.06)"
          borderRadius="1.6rem"
          gap="2rem"
        >
          <Box h="2.4rem" w="21.3rem" alignSelf="start">
            <img
              src="/assets/logo/logo.png"
              width="100%"
              height="100%"
              alt="Logo"
            />
          </Box>

          <Text
            fontSize="1.5rem"
            fontWeight={500}
            color="gray.400"
            paddingBottom="1rem"
            borderBottom="1px solid #E2E8EF"
          >
            Connect your wallet to continue to your dashboard
          </Text>
          <Flex
            flexFlow="column"
            align="start"
            justify="center"
            w="100%"
            gap="1rem"
          >
            {wallets.map((wallet: SolanaWallet, index) => {
              return (
                <Flex
                  key={index}
                  h="4.6rem"
                  align="center"
                  w="100%"
                  bg="gray.50"
                  borderRadius="3.5rem"
                  cursor="pointer"
                  transition="200ms"
                  _hover={{
                    bg: 'gray.100',
                  }}
                  padding="0 1.5rem"
                  onClick={onConnectWallet.bind(null, wallet)}
                >
                  <Flex gap="1rem" align="center">
                    <Box w="2.5rem" h="2.5rem">
                      <Image
                        width="100%"
                        height="100%"
                        src={wallet.adapter.icon}
                        alt={`${wallet.adapter.name} Icon`}
                      />
                    </Box>
                    <Text
                      fontSize="1.4rem"
                      ml={2}
                      fontWeight={600}
                      color="gray.500"
                    >
                      {wallet.adapter.name}
                    </Text>
                  </Flex>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      </Grid>
    </>
  );
};
