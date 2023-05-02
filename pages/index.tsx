import { Box, Container, Flex } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import Banner from '@/components/home/Banner';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

function Home() {
  const { userInfo } = userStore();
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listings = await axios.post('/api/listings/');
      console.log('file: index.tsx:17 ~ getListings ~ listings:', listings);
      setIsListingsLoading(false);
    } catch (e) {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  return (
    <Default
      meta={
        <Meta
          title="Superteam Earn"
          description="Every Solana opportunity in one place!"
        />
      }
    >
      <Container maxW={'7xl'} mx="auto" py={12} bg="white">
        <Flex>
          <Flex
            flexGrow={3}
            pr={8}
            borderRight="1px solid"
            borderRightColor="blackAlpha.200"
          >
            {!userInfo?.id && <Banner />}
          </Flex>
          <Flex flexGrow={1} w={{ base: 'auto', md: 80 }} pl={8}>
            <Box p={4}>Hello2!</Box>
          </Flex>
        </Flex>
      </Container>
    </Default>
  );
}

export default Home;
