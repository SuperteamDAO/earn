/* eslint-disable no-nested-ternary */
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, HStack, Image, Link, Text } from '@chakra-ui/react';
import { css } from '@emotion/react';
import axios from 'axios';
import type { NextPage } from 'next';
import { title } from 'process';
import { useEffect, useState } from 'react';

import { BountyTabs } from '@/components/listings/bounty/Tabs';
import { GrantsCard, ListingSection } from '@/components/misc/listingsCard';
import EmptySection from '@/components/shared/EmptySection';
import Loading from '@/components/shared/Loading';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import Home from '@/layouts/Home';
import { Mixpanel } from '@/utils/mixpanel';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
}

const HomePage: NextPage = () => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [bounties, setBounties] = useState<{ bounties: Bounty[] }>({
    bounties: [],
  });
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/');
      const bountyData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 10,
        },
      });

      setListings(listingsData.data);
      setBounties(bountyData.data);
      setIsListingsLoading(false);
    } catch (e) {
      console.log(e);

      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  const tabs = BountyTabs({ isListingsLoading, bounties });

  const [activeTab, setActiveTab] = useState<string>(tabs[0]!.id);

  useEffect(() => {
    Mixpanel.track('home_page_load');
  }, []);
  return (
    <Home type="home">
      <Box w={'100%'}>
        <Box my={10}>
          <HStack
            align="center"
            justify="space-between"
            mb={4}
            pb={3}
            borderBottom="2px solid"
            borderBottomColor="#E2E8F0"
          >
            <Flex align={'center'}>
              <Image
                display={{ md: 'block', base: 'none' }}
                w={'1.4375rem'}
                h={'1.4375rem'}
                mr={'0.75rem'}
                alt="emoji"
                src={'/assets/home/emojis/moneyman.png'}
              />
              <Text
                pr={2}
                color={'#334155'}
                fontSize={{ base: 14, md: 16 }}
                fontWeight={'600'}
              >
                Freelance Gigs
              </Text>
              <Text
                display={['none', 'none', 'block', 'block']}
                mx={3}
                color={'brand.slate.300'}
                fontSize={'xxs'}
              >
                |
              </Text>

              {tabs.map((tab, index) => (
                <Box
                  key={index}
                  as="span"
                  pos="relative"
                  alignItems="center"
                  display="inline-flex"
                  p={2}
                  color="#475668"
                  fontSize={{ lg: '14px', base: '11px' }}
                  cursor="pointer"
                  css={
                    tab.id === activeTab
                      ? css`
                          &::after {
                            content: '';
                            position: absolute;
                            right: 0;
                            bottom: -13px;
                            left: 0;
                            height: 2px;
                            background-color: #6366f1;
                          }
                        `
                      : null
                  }
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.title}
                </Box>
              ))}
            </Flex>
            <Flex>
              <Link
                href={'/all'}
                onClick={() => {
                  Mixpanel.track('view_all', {
                    type: title,
                  });
                }}
              >
                <Button
                  color="brand.slate.400"
                  size={{ base: 'xs', md: 'sm' }}
                  variant="ghost"
                >
                  View All
                </Button>
              </Link>
            </Flex>
          </HStack>

          {tabs.map((tab) => tab.id === activeTab && tab.content)}
          <Link
            href={'/all'}
            onClick={() => {
              Mixpanel.track('view_all', {
                type: title,
              });
            }}
          >
            <Button
              w="100%"
              my={8}
              py={5}
              color="brand.slate.400"
              borderColor="brand.slate.300"
              rightIcon={<ArrowForwardIcon />}
              size="sm"
              variant="outline"
            >
              View All
            </Button>
          </Link>
        </Box>

        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
        >
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !listings?.grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            listings?.grants?.map((grant) => {
              return (
                <GrantsCard
                  sponsorName={grant?.sponsor?.name}
                  logo={grant?.sponsor?.logo}
                  key={grant?.id}
                  slug={grant.slug}
                  rewardAmount={grant?.rewardAmount}
                  title={grant?.title}
                  short_description={grant?.shortDescription}
                />
              );
            })}
        </ListingSection>
      </Box>
    </Home>
  );
};

export default HomePage;
