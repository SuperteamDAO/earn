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
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { type ListingWithSubmissions } from '@/features/listings';
import { CreateListingModal, ListingTable } from '@/features/sponsor-dashboard';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';

const debounce = require('lodash.debounce');

export default function SponsorListings() {
  const { userInfo } = userStore();
  const [totalListings, setTotalListings] = useState(0);
  const [listings, setListings] = useState<ListingWithSubmissions[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const bountiesList = await axios.get('/api/bounties/listingsAndGrants', {
        params: {
          sponsorId: userInfo?.currentSponsorId,
          searchText,
          skip,
          take: length,
          showSubmissionDetails: true,
        },
      });
      setTotalListings(bountiesList.data.total);
      setListings(bountiesList.data.data);
      setIsListingsLoading(false);
    } catch (error) {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getListings();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  return (
    <Sidebar showBanner={true}>
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
      {!isListingsLoading && !listings?.length && (
        <>
          <ListingTable listings={listings} setListings={setListings} />
          <CreateListingModal
            isOpen={isOpenCreateListing}
            onClose={onCloseCreateListing}
          />
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
      {!isListingsLoading && !!listings?.length && (
        <>
          <Flex align="center" justify="end" mt={6}>
            <Text mr={4} color="brand.slate.400" fontSize="sm">
              <Text as="span" fontWeight={700}>
                {skip + 1}
              </Text>{' '}
              -{' '}
              <Text as="span" fontWeight={700}>
                {Math.min(skip + length, totalListings)}
              </Text>{' '}
              of{' '}
              <Text as="span" fontWeight={700}>
                {totalListings}
              </Text>{' '}
              Listings
            </Text>
            <Button
              mr={4}
              isDisabled={skip <= 0}
              leftIcon={<ChevronLeftIcon w={5} h={5} />}
              onClick={() =>
                skip >= length ? setSkip(skip - length) : setSkip(0)
              }
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              isDisabled={
                totalListings <= skip + length ||
                (skip > 0 && skip % length !== 0)
              }
              onClick={() => skip % length === 0 && setSkip(skip + length)}
              rightIcon={<ChevronRightIcon w={5} h={5} />}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
        </>
      )}
    </Sidebar>
  );
}
