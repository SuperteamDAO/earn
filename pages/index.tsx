/* eslint-disable no-nested-ternary */
import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Link,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import { css } from '@emotion/react';
import axios from 'axios';
import dayjs from 'dayjs';
import type { NextPage } from 'next';
import { title } from 'process';
import { useEffect, useState } from 'react';

import {
  BountiesCard,
  GrantsCard,
  JobsCard,
  ListingSection,
} from '@/components/misc/listingsCard';
import EmptySection from '@/components/shared/EmptySection';
import Loading from '@/components/shared/Loading';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import type { Job } from '@/interface/job';
import Home from '@/layouts/Home';
import { Mixpanel } from '@/utils/mixpanel';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
  jobs?: Job[];
}

interface TabProps {
  id: string;
  title: string;
  content: JSX.Element;
}

const HomePage: NextPage = () => {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [bounties, setBounties] = useState<{ bounties: Bounty[] }>({
    bounties: [],
  });
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
    jobs: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/');
      const bountyData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 100,
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

  const tabs: TabProps[] = [
    {
      id: 'tab1',
      title: 'OPEN',
      content: (
        <Flex direction={'column'} rowGap={'2.625rem'}>
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !bounties?.bounties?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No bounties available!"
                message="Subscribe to notifications to get notified about new bounties."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            bounties?.bounties
              ?.filter(
                (bounty) =>
                  bounty.status === 'OPEN' && !dayjs().isAfter(bounty.deadline)
              )
              .slice(0, 10)
              .map((bounty) => {
                return (
                  <BountiesCard
                    slug={bounty.slug}
                    rewardAmount={bounty?.rewardAmount}
                    key={bounty?.id}
                    sponsorName={bounty?.sponsor?.name}
                    deadline={bounty?.deadline}
                    title={bounty?.title}
                    logo={bounty?.sponsor?.logo}
                    token={bounty?.token}
                    type={bounty?.type}
                  />
                );
              })}
        </Flex>
      ),
    },
    {
      id: 'tab2',
      title: 'IN REVIEW',
      content: (
        <Flex direction={'column'} rowGap={'2.625rem'}>
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !bounties?.bounties?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No bounties available!"
                message="Subscribe to notifications to get notified about new bounties."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            bounties?.bounties
              ?.filter(
                (bounty) =>
                  !bounty.isWinnersAnnounced &&
                  dayjs().isAfter(bounty.deadline) &&
                  bounty.status === 'OPEN'
              )
              .slice(0, 10)
              .map((bounty) => {
                return (
                  <BountiesCard
                    slug={bounty.slug}
                    rewardAmount={bounty?.rewardAmount}
                    key={bounty?.id}
                    sponsorName={bounty?.sponsor?.name}
                    deadline={bounty?.deadline}
                    title={bounty?.title}
                    logo={bounty?.sponsor?.logo}
                    token={bounty?.token}
                    type={bounty?.type}
                  />
                );
              })}
        </Flex>
      ),
    },
    {
      id: 'tab3',
      title: 'ANNOUNCED',
      content: (
        <Flex direction={'column'} rowGap={'2.625rem'}>
          {!isListingsLoading &&
            bounties?.bounties
              ?.filter(
                (bounty) =>
                  bounty.status === 'CLOSED' ||
                  (bounty.isWinnersAnnounced && bounty.status === 'OPEN')
              )
              .slice(0, 10)
              .map((bounty) => {
                return (
                  <BountiesCard
                    slug={bounty.slug}
                    rewardAmount={bounty?.rewardAmount}
                    key={bounty?.id}
                    sponsorName={bounty?.sponsor?.name}
                    deadline={bounty?.deadline}
                    title={bounty?.title}
                    logo={bounty?.sponsor?.logo}
                    token={bounty?.token}
                    type={bounty?.type}
                  />
                );
              })}
        </Flex>
      ),
    },
  ];

  const [isLessThan1200px] = useMediaQuery('(max-width: 1200px)');
  const [isLessThan850px] = useMediaQuery('(max-width: 850px)');
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  const [activeTab, setActiveTab] = useState<string>(tabs[0]!.id);

  useEffect(() => {
    const html = document.querySelector('html');
    Mixpanel.track('home_page_load');
    try {
      if (isLessThan768px) {
        html!.style.fontSize = '100%';
      } else if (isLessThan850px) {
        html!.style.fontSize = '60%';
      } else if (isLessThan1200px) {
        html!.style.fontSize = '70%';
      } else {
        html!.style.fontSize = '100%';
      }
    } catch (error) {
      console.log(error);
    }
  }, [isLessThan1200px, isLessThan850px, isLessThan768px]);
  return (
    <Home>
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
                w={'1.4375rem'}
                h={'1.4375rem'}
                mr={'0.75rem'}
                alt="emoji"
                src={'/assets/home/emojis/moneyman.png'}
              />
              <Text
                color={'#334155'}
                fontSize={{ base: 14, md: 16 }}
                fontWeight={'600'}
              >
                Bounties
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
                  fontSize="14px"
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
                href={'/bounties'}
                onClick={() => {
                  Mixpanel.track('view_all', {
                    type: title,
                  });
                }}
              >
                <Button color="brand.slate.400" size="sm" variant="ghost">
                  View All
                </Button>
              </Link>
            </Flex>
          </HStack>

          {tabs.map((tab) => tab.id === activeTab && tab.content)}
          <Link
            href={'/bounties'}
            onClick={() => {
              Mixpanel.track('view_all', {
                type: title,
              });
            }}
          >
            <Button
              w="100%"
              mt={3}
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
        <ListingSection
          type="jobs"
          title="Jobs"
          sub="Join a high-growth team"
          emoji="/assets/home/emojis/job.png"
        >
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !listings?.jobs?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No jobs available!"
                message="Subscribe to notifications to get notified about new jobs."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            listings?.jobs?.map((job) => {
              return (
                <JobsCard
                  key={job?.id}
                  logo={job?.sponsor?.logo}
                  location={job?.location || ''}
                  orgName={job?.sponsor?.name || ''}
                  skills={job?.skills || ''}
                  title={job?.title || ''}
                  link={job?.link || ''}
                />
              );
            })}
        </ListingSection>
      </Box>
    </Home>
  );
};

export default HomePage;
