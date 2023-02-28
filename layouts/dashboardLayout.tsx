import { Box, Center, VStack, Spinner } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { Navbar } from '../components/navbar/navbar';
import { DashboardSidbar } from '../components/sidebar/DashboardSidbar';
import { findSponsors } from '../utils/functions';
import { ConnectWallet } from './connectWallet';

interface Props {
  children: React.ReactNode;
}
const DashboardLayout = ({ children }: Props) => {
  const { connected, publicKey, connecting } = useWallet();
  const sponsors = useQuery({
    queryKey: ['sponsor', publicKey?.toBase58() ?? ''],
    queryFn: ({ queryKey }) => findSponsors(queryKey[1]),
  });

  if (!connected) {
    return <ConnectWallet />
  }

  return (
    <>
      <VStack w={'full'}>
        <Navbar />
        <Box w={'full'}>
          <DashboardSidbar sponsors={sponsors.data} />
          <Box marginLeft={'18rem'} mt={'2.5rem'} w={'80vw'}>
            {children}
          </Box>
        </Box>
      </VStack>
    </>
  );
};

export default DashboardLayout;
