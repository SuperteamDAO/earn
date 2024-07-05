import {
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  ViewIcon,
  ViewOffIcon,
} from '@chakra-ui/icons';
import {
  Button,
  Flex,
  IconButton,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import { FiMoreVertical } from 'react-icons/fi';

import { tokenList } from '@/constants';
import { grantAmount } from '@/features/grants';
import { useListingFormStore } from '@/features/listing-builder';
import {
  formatDeadline,
  getColorStyles,
  getListingStatus,
  getListingTypeLabel,
  isDeadlineOver,
  type ListingWithSubmissions,
} from '@/features/listings';

import { DeleteDraftModal, UnpublishModal } from './Modals';
import { SponsorPrize } from './SponsorPrize';

interface ListingTableProps {
  listings: ListingWithSubmissions[];
  setListings: (listings: ListingWithSubmissions[]) => void;
}

export const ListingTable = ({ listings, setListings }: ListingTableProps) => {
  const [selectedListing, setSelectedListing] =
    useState<ListingWithSubmissions>({});

  const router = useRouter();
  const posthog = usePostHog();
  const { data: session } = useSession();
  const { resetForm } = useListingFormStore();

  const {
    isOpen: unpublishIsOpen,
    onOpen: unpublishOnOpen,
    onClose: unpublishOnClose,
  } = useDisclosure();
  const {
    isOpen: deleteDraftIsOpen,
    onOpen: deleteDraftOnOpen,
    onClose: deleteDraftOnClose,
  } = useDisclosure();

  const handleUnpublish = async (
    unpublishedListing: ListingWithSubmissions,
  ) => {
    setSelectedListing(unpublishedListing);
    unpublishOnOpen();
  };

  const handleDeleteDraft = async (deleteListing: ListingWithSubmissions) => {
    setSelectedListing(deleteListing);
    deleteDraftOnOpen();
  };

  const ListingTh = ({ children }: { children: string }) => {
    return (
      <Th
        color="brand.slate.400"
        fontSize={14}
        fontWeight={500}
        letterSpacing={'-2%'}
        textTransform={'capitalize'}
      >
        {children}
      </Th>
    );
  };

  const [submissionCounts, setSubmissionCounts] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const fetchSubmissionCounts = async () => {
      const counts: { [key: string]: number } = {};
      for (const listing of listings) {
        let count = 0;
        if (listing?.type === 'grant') {
          const response = await axios.post(`/api/grant-application/count`, {
            grantId: listing?.id,
          });
          count = response.data;
        } else {
          const response = await axios.get(
            `/api/listings/${listing?.id}/submission-count/`,
          );
          count = response.data;
        }
        if (listing.id) {
          counts[listing.id] = count;
        }
      }
      setSubmissionCounts(counts);
    };
    fetchSubmissionCounts();
  }, [listings]);

  if (!listings.length) return;

  return (
    <>
      <UnpublishModal
        listings={listings}
        setListings={setListings}
        listingId={selectedListing.id}
        unpublishIsOpen={unpublishIsOpen}
        unpublishOnClose={unpublishOnClose}
        listingType={selectedListing.type}
      />
      <DeleteDraftModal
        listings={listings}
        setListings={setListings}
        deleteDraftIsOpen={deleteDraftIsOpen}
        deleteDraftOnClose={deleteDraftOnClose}
        listingId={selectedListing.id}
        listingType={selectedListing.type}
      />
      <TableContainer
        mb={8}
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius={8}
      >
        <Table variant="simple">
          <Thead>
            <Tr bg="brand.slate.100">
              <ListingTh>Listing Name</ListingTh>
              <ListingTh>Submissions</ListingTh>
              <ListingTh>Deadline</ListingTh>
              <ListingTh>Prize</ListingTh>
              <ListingTh>Status</ListingTh>
              <ListingTh>Actions</ListingTh>
              <Th pl={0} />
            </Tr>
          </Thead>
          <Tbody w="full">
            {listings.map((listing) => {
              const listingType = getListingTypeLabel(
                listing?.type ?? 'bounty',
              );

              const deadline = formatDeadline(
                listing?.deadline,
                listing?.applicationType,
                listing?.type,
              );

              const pastDeadline = isDeadlineOver(listing?.deadline);

              const listingStatus = getListingStatus(listing);
              const listingLabel = getListingTypeLabel(listing?.type!);

              const listingIcon = (() => {
                switch (listing.type) {
                  case 'bounty':
                    return 'bolt.svg';
                  case 'project':
                    return 'briefcase.svg';
                  case 'hackathon':
                    return 'laptop.svg';
                  case 'grant':
                    return 'bank.svg';
                  default:
                    return 'bolt.svg';
                }
              })();

              const listingSubmissionLink =
                listing.type === 'grant'
                  ? `/dashboard/grants/${listing.slug}/applications/`
                  : `/dashboard/listings/${listing.slug}/submissions/`;

              return (
                <Tr key={listing?.id}>
                  <Td
                    maxW={96}
                    color="brand.slate.700"
                    fontWeight={500}
                    whiteSpace="normal"
                    wordBreak={'break-word'}
                  >
                    <Link
                      className="ph-no-capture"
                      as={NextLink}
                      pointerEvents={!listing.isPublished ? 'none' : 'auto'}
                      href={listingSubmissionLink}
                      onClick={() => {
                        posthog.capture('submissions_sponsor');
                      }}
                      passHref
                    >
                      <Flex align={'center'}>
                        <Tooltip bg="brand.slate.400" label={listingType}>
                          <Image
                            h={5}
                            mr={2}
                            alt={`New ${listingType}`}
                            src={`/assets/icons/${listingIcon}`}
                          />
                        </Tooltip>

                        <Text
                          as="a"
                          overflow="hidden"
                          color="brand.slate.500"
                          fontSize={'15px'}
                          fontWeight={500}
                          _hover={{ textDecoration: 'underline' }}
                          whiteSpace="nowrap"
                          textOverflow="ellipsis"
                        >
                          {listing.title}
                        </Text>
                      </Flex>
                    </Link>
                  </Td>
                  <Td py={2}>
                    <Text
                      color="brand.slate.500"
                      fontSize={'sm'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      {submissionCounts[listing.id!]}
                    </Text>
                  </Td>
                  <Td align="center" py={2}>
                    <Text
                      color="brand.slate.500"
                      fontSize={'sm'}
                      fontWeight={500}
                    >
                      {deadline}
                    </Text>
                  </Td>
                  <Td py={2}>
                    <Flex align={'center'} justify={'start'} gap={1}>
                      <Image
                        w={5}
                        h={5}
                        alt={'green dollar'}
                        rounded={'full'}
                        src={
                          tokenList.filter(
                            (e) => e?.tokenSymbol === listing.token,
                          )[0]?.icon ?? '/assets/icons/green-dollar.svg'
                        }
                      />
                      {listing?.type === 'grant' && (
                        <Text
                          color={'brand.slate.700'}
                          fontSize={'sm'}
                          fontWeight={500}
                        >
                          {grantAmount({
                            minReward: listing?.minRewardAsk!,
                            maxReward: listing?.maxRewardAsk!,
                          })}
                        </Text>
                      )}
                      <SponsorPrize
                        compensationType={listing?.compensationType}
                        maxRewardAsk={listing?.maxRewardAsk}
                        minRewardAsk={listing?.minRewardAsk}
                        rewardAmount={listing?.rewardAmount}
                        textStyle={{
                          fontWeight: 500,
                          fontSize: 'sm',
                          color: 'brand.slate.700',
                        }}
                      />
                      <Text
                        color="brand.slate.400"
                        fontSize={'sm'}
                        fontWeight={500}
                      >
                        {listing.token}
                      </Text>
                    </Flex>
                  </Td>
                  <Td align="center" py={2}>
                    <Tag
                      px={3}
                      color={getColorStyles(listingStatus).color}
                      fontSize={'12px'}
                      fontWeight={500}
                      bg={getColorStyles(listingStatus).bgColor}
                      borderRadius={'full'}
                      variant="solid"
                    >
                      {listingStatus}
                    </Tag>
                  </Td>
                  <Td px={3} py={2}>
                    {listing.status === 'OPEN' && !!listing.isPublished && (
                      <Button
                        className="ph-no-capture"
                        color="#6366F1"
                        fontSize={'13px'}
                        fontWeight={500}
                        _hover={{ bg: '#E0E7FF' }}
                        leftIcon={<ViewIcon />}
                        onClick={() => {
                          posthog.capture('submissions_sponsor');
                          router.push(listingSubmissionLink);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        {listing?.type === 'grant'
                          ? 'Applications'
                          : 'Submissions'}
                      </Button>
                    )}
                    {listing.status === 'OPEN' &&
                      !listing.isPublished &&
                      !pastDeadline &&
                      listing?.type !== 'grant' && (
                        <Button
                          color={'brand.slate.500'}
                          fontSize={'13px'}
                          fontWeight={500}
                          _hover={{ bg: 'brand.slate.200' }}
                          leftIcon={<EditIcon />}
                          onClick={() => {
                            window.location.href = `/dashboard/listings/${listing.slug}/edit/`;
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Edit
                        </Button>
                      )}
                  </Td>
                  <Td px={0} py={2}>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        border="none"
                        _hover={{ bg: 'brand.slate.100' }}
                        aria-label="Options"
                        icon={<FiMoreVertical />}
                        size="sm"
                        variant="ghost"
                      />
                      <MenuList>
                        <MenuItem
                          py={2}
                          color={'brand.slate.500'}
                          fontSize={'sm'}
                          fontWeight={500}
                          icon={<ExternalLinkIcon h={4} w={4} />}
                          onClick={() =>
                            window.open(
                              listing?.type === 'grant'
                                ? `${router.basePath}/grants/${listing.slug}`
                                : `${router.basePath}/listings/${listing?.type}/${listing.slug}`,
                              '_blank',
                            )
                          }
                        >
                          View {listingLabel}
                        </MenuItem>

                        {session?.user?.role === 'GOD' ||
                          (listing.isPublished &&
                            !pastDeadline &&
                            listing.type !== 'grant' && (
                              <Link
                                as={NextLink}
                                _hover={{ textDecoration: 'none' }}
                                href={`/dashboard/listings/${listing.slug}/edit`}
                                onClick={resetForm}
                              >
                                <MenuItem
                                  py={2}
                                  color={'brand.slate.500'}
                                  fontSize={'sm'}
                                  fontWeight={500}
                                  icon={<EditIcon w={4} h={4} />}
                                >
                                  Edit {listingLabel}
                                </MenuItem>
                              </Link>
                            ))}
                        {(listing.type === 'bounty' ||
                          listing.type === 'project') && (
                          <MenuItem
                            className="ph-no-capture"
                            py={2}
                            color={'brand.slate.500'}
                            fontSize={'sm'}
                            fontWeight={500}
                            icon={<CopyIcon h={4} w={4} />}
                            onClick={() => {
                              posthog.capture('duplicate listing_sponsor');
                              window.open(
                                `${router.basePath}/dashboard/listings/${listing.slug}/duplicate`,
                                '_blank',
                              );
                            }}
                          >
                            Duplicate
                          </MenuItem>
                        )}
                        {listingStatus === 'Draft' &&
                          listing?.type !== 'grant' && (
                            <>
                              <MenuItem
                                py={2}
                                color={'brand.slate.500'}
                                fontSize={'sm'}
                                fontWeight={500}
                                icon={<AiOutlineDelete size={18} />}
                                onClick={() => handleDeleteDraft(listing)}
                              >
                                Delete Draft
                              </MenuItem>
                            </>
                          )}
                        {!(
                          listing.status === 'OPEN' && !listing.isPublished
                        ) && (
                          <>
                            <MenuItem
                              py={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              icon={<ViewOffIcon h={4} w={4} />}
                              onClick={() => handleUnpublish(listing)}
                            >
                              Unpublish
                            </MenuItem>
                          </>
                        )}
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};
