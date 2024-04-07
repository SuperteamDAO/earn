import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import type { NextPage } from 'next';
import { type GetServerSideProps } from 'next/types';
import { parse } from 'next-useragent';
import React, { useEffect, useRef, useState } from 'react';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { InstallAppModal } from '@/components/modals/InstallAppModal';
import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { type Grant, GrantsCard } from '@/features/grants';
import { type Bounty, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { userStore } from '@/store/user';

interface UserAgentPropType {
  ua: string;
}

const HomePage: NextPage<UserAgentPropType> = ({ ua }) => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [bounties, setBounties] = useState<{ bounties: Bounty[] }>({
    bounties: [],
  });
  const [grants, setGrants] = useState<{ grants: Grant[] }>({
    grants: [],
  });
  const installPrompt = useRef<Event | null>();
  const deviceInfo = parse(ua);
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
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt.current = e;
    });
    if (!isListingsLoading) return;
    getListings();
  }, []);

  const { userInfo } = userStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isOpen, onClose, onOpen } = useDisclosure();

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

  useEffect(() => {
    const showInstallAppModal = () => {
      const isMobile = deviceInfo.isMobile;
      const modalShown = localStorage.getItem('installAppModalShown');
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = localStorage.getItem('isAppInstalled');

      if (
        (isMobile && !modalShown && !isInstalled) ||
        (isMobile && !isPWA && !modalShown && !isInstalled)
      ) {
        //TODO: add modalshown key in localstorage
        localStorage.setItem('installAppModalShown', 'true');
        onOpen();
      }
    };

    setTimeout(() => {
      showInstallAppModal();
    }, 1000);
  }, [userInfo]);

  const installApp = async () => {
    if (installPrompt.current) {
      // @ts-expect-error --> to remove prompt doesnt exist error
      const status = await installPrompt.current?.prompt();
      if (status.outcome === 'accepted') {
        localStorage.setItem('isAppInstalled', 'true');
      }
    }
    onClose();
  };

  return (
    <Home type="home">
      <FeatureModal isOpen={isModalOpen} onClose={handleClose} />
      <InstallAppModal
        isOpen={isOpen}
        onClose={onClose}
        installApp={installApp}
        deviceInfo={deviceInfo}
      />
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return {
    props: {
      ua: ctx?.req?.headers['user-agent'],
    },
  };
};

export default HomePage;
