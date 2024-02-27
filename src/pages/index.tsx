import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { type Grant, GrantsCard } from '@/features/grants';
import { type Bounty, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { userStore } from '@/store/user';

const HomePage: NextPage = () => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [bounties, setBounties] = useState<{ bounties: Bounty[] }>({
    bounties: [],
  });
  const [grants, setGrants] = useState<{ grants: Grant[] }>({
    grants: [],
  });

  const date = dayjs().subtract(1, 'month').toISOString();

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const bountyData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 100,
          deadline: date,
        },
      });

      setBounties(bountyData.data);
      setIsListingsLoading(false);

      const grantsData = await axios.get('/api/listings/', {
        params: {
          category: 'grants',
        },
      });

      setGrants(grantsData.data);
    } catch (e) {
      console.log(e);

      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  const { userInfo } = userStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const updateFeatureModalShown = async () => {
      if (
        userInfo?.featureModalShown === false &&
        userInfo?.isTalentFilled === true
      ) {
        setIsModalOpen(true);
        await axios.post('/api/user/update/', {
          featureModalShown: true,
        });
      }
    };

    updateFeatureModalShown();
  }, [userInfo]);

  return (
    <Home type="home">
      <FeatureModal isOpen={isModalOpen} onClose={handleClose} />
      <Box w={'100%'}>
        <ListingTabs
          bounties={bounties.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Freelance Gigs"
          viewAllLink="/all"
          take={20}
          showViewAll
          checkLanguage
        />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
          showViewAll
        >
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !grants?.grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            grants?.grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </Box>
    </Home>
  );
};

export default HomePage;
