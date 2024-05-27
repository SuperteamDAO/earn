import { Box, Center, Flex, Image, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { type Bounty, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties?: Bounty[];
}

export default function AllRegionListingsPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get(`/api/listings/pyth`);
      setListings(listingsData.data);
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
    <Home type="niche">
      <Meta
        title={`Pyth Network Opportunities | Superteam Earn`}
        description={``}
      />
      <Flex
        direction={{ md: 'row', base: 'column' }}
        w={{ md: 'brand.120', base: '100%' }}
        h={{ md: 'auto', base: 'fit-content' }}
        mx={'auto'}
        mb={8}
        p={6}
        bg={`url(/assets/category_assets/bg/content.png)`}
        bgSize={'cover'}
        rounded={10}
      >
        <Center w={14} h={14} mr={3} bg={'black'} rounded={'md'}>
          <Image
            h={8}
            borderRadius={'5px'}
            alt="Category icon"
            src={'/assets/company-logos/pyth.png'}
          />
        </Center>
        <Box w={{ md: '80%', base: '100%' }}>
          <Text
            mt={{ base: 4, md: '0' }}
            fontFamily={'var(--font-serif)'}
            fontWeight={'700'}
          >
            {'Pyth Network'}
          </Text>
          <Text maxW="600px" color={'brand.slate.500'} fontSize={'small'}>
            Explore the latest Research and Developer bounties for the Pyth
            Network ecosystem on Superteam Earn. Get started now!
          </Text>
        </Box>
      </Flex>
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Freelance Gigs"
          take={20}
        />
      </Box>
    </Home>
  );
}
