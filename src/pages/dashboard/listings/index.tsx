import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Button,
  Divider,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { type ListingWithSubmissions } from '@/features/listings';
import {
  Banner,
  CreateListingModal,
  ListingTable,
  type SponsorStats,
} from '@/features/sponsor-dashboard';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';

const debounce = require('lodash.debounce');

export default function SponsorListings() {
  const { userInfo } = userStore();
  const [allListings, setAllListings] = useState<ListingWithSubmissions[]>([]);
  const [filteredListings, setFilteredListings] = useState<
    ListingWithSubmissions[]
  >([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState('all');
  const listingsPerPage = 15;

  const [sponsorStats, setSponsorStats] = useState<SponsorStats>({});
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const allListings = await axios.get('/api/bounties/', {
        params: {
          searchText,
        },
      });
      setAllListings(allListings.data);
      setFilteredListings(allListings.data);
      setIsListingsLoading(false);
    } catch (error) {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getListings();
    }
  }, [userInfo?.currentSponsorId, searchText]);

  useEffect(() => {
    const getSponsorStats = async () => {
      const sponsorData = await axios.get('/api/sponsors/stats');
      setSponsorStats(sponsorData.data);
      setIsStatsLoading(false);
    };
    getSponsorStats();
  }, [userInfo?.currentSponsorId]);

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  const paginatedListings = filteredListings.slice(
    currentPage * listingsPerPage,
    (currentPage + 1) * listingsPerPage,
  );

  useEffect(() => {
    const filterListingsByType = () => {
      if (selectedTab === 'all') {
        return allListings;
      }
      return allListings.filter((listing) => listing.type === selectedTab);
    };

    if (searchText) {
      const filtered = filterListingsByType().filter((listing) =>
        listing.title
          ? listing.title.toLowerCase().includes(searchText.toLowerCase())
          : false,
      );
      setFilteredListings(filtered);
    } else {
      setFilteredListings(filterListingsByType());
    }
    setCurrentPage(0);
  }, [searchText, allListings, selectedTab]);

  const hasGrants = allListings.some((listing) => listing.type === 'grant');

  const selectedStyles = {
    borderColor: 'brand.purple',
    color: 'brand.slate.600',
  };

  return (
    <Sidebar>
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <Flex justify="space-between" w="100%" mb={4}>
        <Flex align="center" gap={3}>
          <Text color="brand.slate.800" fontSize="lg" fontWeight={600}>
            My Listings
          </Text>
          <Divider
            h="60%"
            borderColor="brand.slate.200"
            orientation="vertical"
          />
          <Text color="brand.slate.500">
            The one place to manage your listings
          </Text>
        </Flex>
        <InputGroup w={64}>
          <Input
            bg={'white'}
            borderColor="brand.slate.200"
            _placeholder={{
              color: 'brand.slate.400',
              fontWeight: 500,
              fontSize: 'md',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search listing..."
            type="text"
          />
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="brand.slate.400" />
          </InputLeftElement>
        </InputGroup>
      </Flex>

      {isListingsLoading && <LoadingSection />}
      {!isListingsLoading && (
        <>
          <Tabs
            onChange={(index) => {
              const tabTypes = [
                'all',
                'bounty',
                'project',
                hasGrants ? 'grant' : '',
              ];
              const tabType = tabTypes[index] || 'all';
              setSelectedTab(tabType);
            }}
          >
            <TabList>
              <Tab
                color="brand.slate.400"
                fontSize={'sm'}
                fontWeight={500}
                _selected={selectedStyles}
              >
                All
              </Tab>
              <Tab
                color="brand.slate.400"
                fontSize={'sm'}
                fontWeight={500}
                _selected={selectedStyles}
              >
                Bounties
              </Tab>
              <Tab
                color="brand.slate.400"
                fontSize={'sm'}
                fontWeight={500}
                _selected={selectedStyles}
              >
                Projects
              </Tab>
              {hasGrants && (
                <Tab
                  color="brand.slate.400"
                  fontSize={'sm'}
                  fontWeight={500}
                  _selected={selectedStyles}
                >
                  Grants
                </Tab>
              )}
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <ListingTable
                  listings={paginatedListings}
                  setListings={setAllListings}
                />
              </TabPanel>
              <TabPanel px={0}>
                <ListingTable
                  listings={paginatedListings}
                  setListings={setAllListings}
                />
              </TabPanel>
              <TabPanel px={0}>
                <ListingTable
                  listings={paginatedListings}
                  setListings={setAllListings}
                />
              </TabPanel>
              {hasGrants && (
                <TabPanel px={0}>
                  <ListingTable
                    listings={paginatedListings}
                    setListings={setAllListings}
                  />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
          <CreateListingModal
            isOpen={isOpenCreateListing}
            onClose={onCloseCreateListing}
          />
          {!!paginatedListings?.length && (
            <Flex align="center" justify="end" mt={6}>
              <Text mr={4} color="brand.slate.400" fontSize="sm">
                <Text as="span" fontWeight={700}>
                  {currentPage * listingsPerPage + 1}
                </Text>{' '}
                -{' '}
                <Text as="span" fontWeight={700}>
                  {Math.min(
                    (currentPage + 1) * listingsPerPage,
                    filteredListings.length,
                  )}
                </Text>{' '}
                of{' '}
                <Text as="span" fontWeight={700}>
                  {filteredListings.length}
                </Text>{' '}
                Listings
              </Text>
              <Button
                mr={4}
                isDisabled={currentPage <= 0}
                leftIcon={<ChevronLeftIcon w={5} h={5} />}
                onClick={() => setCurrentPage(currentPage - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                isDisabled={
                  (currentPage + 1) * listingsPerPage >= filteredListings.length
                }
                onClick={() => setCurrentPage(currentPage + 1)}
                rightIcon={<ChevronRightIcon w={5} h={5} />}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </Flex>
          )}
        </>
      )}
      {!isListingsLoading && !paginatedListings.length && (
        <>
          <Image
            w={32}
            mx="auto"
            mt={32}
            alt={'talent empty'}
            src="/assets/bg/talent-empty.svg"
          />
          <Text
            mx="auto"
            mt={5}
            color={'brand.slate.600'}
            fontSize={'lg'}
            fontWeight={600}
            textAlign={'center'}
          >
            Create your first listing
          </Text>
          <Text
            mx="auto"
            color={'brand.slate.400'}
            fontWeight={500}
            textAlign={'center'}
          >
            and start getting contributions
          </Text>
          <Button
            display="block"
            w={'200px'}
            mx="auto"
            mt={6}
            mb={48}
            fontSize="md"
            leftIcon={<AddIcon w={3} h={3} />}
            onClick={() => onOpenCreateListing()}
            variant="solid"
          >
            Create New Listing
          </Button>
        </>
      )}
    </Sidebar>
  );
}
