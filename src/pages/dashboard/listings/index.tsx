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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MdArrowDropDown } from 'react-icons/md';

import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  getColorStyles,
  getListingStatus,
  type ListingWithSubmissions,
} from '@/features/listings';
import {
  Banner,
  CreateListingModal,
  dashboardQuery,
  ListingTable,
  sponsorStatsQuery,
} from '@/features/sponsor-dashboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

const MemoizedListingTable = React.memo(ListingTable);

export default function SponsorListings() {
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const listingsPerPage = 15;

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const { data: allListings, isLoading: isListingsLoading } = useQuery(
    dashboardQuery(user?.currentSponsorId),
  );

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  useEffect(() => {
    if (user?.currentSponsorId) {
      setSearchText('');
      setCurrentPage(0);
      setSelectedTab('all');
      setSelectedStatus(null);
    }
  }, [user?.currentSponsorId]);

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  const filteredListings = useMemo(() => {
    const filterListingsByType = () => {
      if (!allListings) return [];
      if (selectedTab === 'all') {
        return allListings;
      }
      return allListings.filter((listing) => listing.type === selectedTab);
    };

    const filterListingsByStatus = (listings: ListingWithSubmissions[]) => {
      if (selectedStatus) {
        return listings.filter(
          (listing) => getListingStatus(listing) === selectedStatus,
        );
      }
      return listings;
    };

    const filteredByType = filterListingsByType();
    const filteredByTypeAndStatus = filterListingsByStatus(filteredByType);

    if (searchText) {
      return filteredByTypeAndStatus.filter((listing) =>
        listing.title
          ? listing.title.toLowerCase().includes(searchText.toLowerCase())
          : false,
      );
    }
    return filteredByTypeAndStatus;
  }, [allListings, selectedTab, selectedStatus, searchText]);

  const paginatedListings = useMemo(() => {
    return filteredListings?.slice(
      currentPage * listingsPerPage,
      (currentPage + 1) * listingsPerPage,
    );
  }, [filteredListings, currentPage, listingsPerPage]);

  const hasGrants = useMemo(() => {
    return allListings?.some((listing) => listing.type === 'grant');
  }, [allListings]);

  const hasHackathons = useMemo(() => {
    return allListings?.some((listing) => listing.type === 'hackathon');
  }, [allListings]);

  const ALL_FILTERS = useMemo(() => {
    const filters = [
      'Draft',
      'In Progress',
      'In Review',
      'Fndn to Pay',
      'Payment Pending',
      'Completed',
    ];
    if (hasGrants) {
      filters.unshift('Ongoing');
    }
    return filters;
  }, [hasGrants]);

  const selectedStyles = {
    borderColor: 'brand.purple',
    color: 'brand.slate.600',
  };

  const handleStatusFilterChange = useCallback((status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(0);
  }, []);

  const handleTabChange = useCallback(
    (index: number) => {
      let tabTypes = [
        'all',
        'bounty',
        'project',
        hasGrants ? 'grant' : '',
        hasHackathons ? 'hackathon' : '',
      ];
      tabTypes = tabTypes.filter(Boolean);
      const tabType = tabTypes[index] || 'all';
      setSelectedTab(tabType);
      setCurrentPage(0);
    },
    [hasGrants, hasHackathons],
  );

  return (
    <SponsorLayout>
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
        <Flex align="center" gap={2}>
          <Text color="brand.slate.500" fontSize={'sm'} letterSpacing={'-1%'}>
            Filter by status
          </Text>
          <Menu>
            <MenuButton
              as={Button}
              color="brand.slate.500"
              fontWeight={500}
              textTransform="capitalize"
              bg="transparent"
              borderWidth={'1px'}
              borderColor="brand.slate.300"
              _hover={{ backgroundColor: 'transparent' }}
              _active={{
                backgroundColor: 'transparent',
                borderWidth: '1px',
              }}
              _expanded={{ borderColor: 'brand.purple' }}
              rightIcon={<MdArrowDropDown />}
            >
              <Tag
                px={3}
                py={1}
                bg={getColorStyles(selectedStatus!).bgColor}
                rounded="full"
              >
                <TagLabel
                  w="full"
                  color={getColorStyles(selectedStatus!).color}
                  fontSize={'11px'}
                  textAlign={'center'}
                  textTransform={'capitalize'}
                  whiteSpace={'nowrap'}
                >
                  {selectedStatus || 'Everything'}
                </TagLabel>
              </Tag>
            </MenuButton>
            <MenuList borderColor="brand.slate.300">
              <MenuItem
                key="Everything"
                _focus={{ bg: 'brand.slate.100' }}
                onClick={() => handleStatusFilterChange(null)}
              >
                <Tag
                  px={3}
                  py={1}
                  bg={getColorStyles('Everything').bgColor}
                  rounded="full"
                >
                  <TagLabel
                    w="full"
                    color={getColorStyles('Everything').color}
                    fontSize={'11px'}
                    textAlign={'center'}
                    textTransform={'capitalize'}
                    whiteSpace={'nowrap'}
                  >
                    Everything
                  </TagLabel>
                </Tag>
              </MenuItem>
              {ALL_FILTERS.map((status) => (
                <MenuItem
                  key={status}
                  _focus={{ bg: 'brand.slate.100' }}
                  onClick={() => handleStatusFilterChange(status)}
                >
                  <Tag
                    px={3}
                    py={1}
                    bg={getColorStyles(status).bgColor}
                    rounded="full"
                  >
                    <TagLabel
                      w="full"
                      color={getColorStyles(status).color}
                      fontSize={'11px'}
                      textAlign={'center'}
                      textTransform={'capitalize'}
                      whiteSpace={'nowrap'}
                    >
                      {status}
                    </TagLabel>
                  </Tag>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <InputGroup w={64} ml={4}>
            <Input
              bg={'white'}
              borderColor="brand.slate.300"
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
      </Flex>

      {isListingsLoading && <LoadingSection />}
      {!isListingsLoading && (
        <>
          <Tabs onChange={handleTabChange}>
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
              {hasHackathons && (
                <Tab
                  color="brand.slate.400"
                  fontSize={'sm'}
                  fontWeight={500}
                  _selected={selectedStyles}
                >
                  Hackathons
                </Tab>
              )}
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <MemoizedListingTable listings={paginatedListings} />
              </TabPanel>
              <TabPanel px={0}>
                <MemoizedListingTable listings={paginatedListings} />
              </TabPanel>
              <TabPanel px={0}>
                <MemoizedListingTable listings={paginatedListings} />
              </TabPanel>
              {hasGrants && (
                <TabPanel px={0}>
                  <MemoizedListingTable listings={paginatedListings} />
                </TabPanel>
              )}
              {hasHackathons && (
                <TabPanel px={0}>
                  <MemoizedListingTable listings={paginatedListings} />
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
      {!isListingsLoading && !allListings?.length && (
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
            onClick={onOpenCreateListing}
            variant="solid"
          >
            Create New Listing
          </Button>
        </>
      )}
      {!isListingsLoading &&
        !!allListings?.length &&
        !paginatedListings.length && (
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
              Zero Results
            </Text>
            <Text
              mx="auto"
              color={'brand.slate.400'}
              fontWeight={500}
              textAlign={'center'}
            >
              No results matching the current filter
            </Text>
          </>
        )}
    </SponsorLayout>
  );
}
