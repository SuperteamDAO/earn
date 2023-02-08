import { Box, VStack } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { Navbar } from '../components/navbar/navbar';
import { DashboardSidbar } from '../components/sidebar/DashboardSidbar';
import { findSponsors } from '../utils/functions';
interface Props {
  children: React.ReactNode;
}
const DashboardLayout = ({ children }: Props) => {
  const { publicKey } = useWallet();
  const sponsors = useQuery({
    queryKey: ['sponsor', publicKey?.toBase58() ?? ''],
    queryFn: ({ queryKey }) => findSponsors(queryKey[1]),
  });
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
