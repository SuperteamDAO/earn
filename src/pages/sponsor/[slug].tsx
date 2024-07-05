import { Box, Center, Flex, Image, Text } from '@chakra-ui/react';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import { type Listing, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties: Listing[];
  sponsorInfo: {
    title: string;
    description: string;
    bgImage: string;
  };
}

const SponsorListingsPage = ({ slug }: { slug: string }) => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    sponsorInfo: {
      title: '',
      description: '',
      bgImage: '',
    },
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.post(`/api/listings/sponsor`, {
        sponsor: slug,
      });
      setListings(listingsData.data);
      setIsListingsLoading(false);
    } catch {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    getListings();
  }, [slug]);

  const { title, description, bgImage } = listings.sponsorInfo;

  const logo = listings.bounties[0]?.sponsor?.logo;

  return (
    <Home type="niche">
      <Meta
        title={`${title} Opportunities | Superteam Earn`}
        description={description}
      />
      {!isListingsLoading && (
        <Flex
          direction={{ md: 'row', base: 'column' }}
          w={{ md: 'brand.120', base: '100%' }}
          h={{ md: 'auto', base: 'fit-content' }}
          mx={'auto'}
          mb={8}
          p={6}
          bg={`url(${bgImage})`}
          bgSize={'cover'}
          rounded={10}
        >
          <Center w={14} h={14} mr={3} bg={'black'} rounded={'md'}>
            <Image h={8} borderRadius={'5px'} alt="Category icon" src={logo} />
          </Center>
          <Box w={{ md: '80%', base: '100%' }}>
            <Text
              mt={{ base: 4, md: '0' }}
              fontFamily={'var(--font-serif)'}
              fontWeight={'700'}
            >
              {title}
            </Text>
            <Text maxW="600px" color={'brand.slate.500'} fontSize={'small'}>
              {description}
            </Text>
          </Box>
        </Flex>
      )}

      <Box w={'100%'}>
        <ListingTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Opportunities"
          take={20}
        />
      </Box>
    </Home>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  if (
    !params ||
    !params.slug ||
    !['solana-gaming', 'pyth', 'dreader'].includes(
      (params.slug as string).toLowerCase(),
    )
  ) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug: (params.slug as string).toLowerCase() },
  };
};

export default SponsorListingsPage;
