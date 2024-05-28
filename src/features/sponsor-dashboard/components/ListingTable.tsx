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
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import { FiMoreVertical } from 'react-icons/fi';

import { tokenList } from '@/constants';
import { useListingFormStore } from '@/features/listing-builder';
import {
  formatDeadline,
  getBountyStatus,
  getColorStyles,
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
  const [listing, setListing] = useState<ListingWithSubmissions>({});

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
    setListing(unpublishedListing);
    unpublishOnOpen();
  };

  const handleViewSubmissions = (slug: string | undefined) => {
    router.push(`/dashboard/listings/${slug}/submissions/`);
  };

  const handleDeleteDraft = async (deleteListing: ListingWithSubmissions) => {
    setListing(deleteListing);
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

  return (
    <>
      <UnpublishModal
        listings={listings}
        setListings={setListings}
        listingId={listing.id!}
        unpublishIsOpen={unpublishIsOpen}
        unpublishOnClose={unpublishOnClose}
      />
      <DeleteDraftModal
        listings={listings}
        setListings={setListings}
        deleteDraftIsOpen={deleteDraftIsOpen}
        deleteDraftOnClose={deleteDraftOnClose}
        listingId={listing.id!}
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
            {listings.map((selectedListing) => {
              const listingType = getListingTypeLabel(
                selectedListing?.type ?? 'listing',
              );

              const deadline = formatDeadline(
                selectedListing?.deadline,
                selectedListing?.applicationType,
              );

              const pastDeadline = isDeadlineOver(selectedListing?.deadline);

              const listingStatus = getBountyStatus(selectedListing);

              const listingIcon = (() => {
                switch (selectedListing.type) {
                  case 'listing':
                    return 'bolt.svg';
                  case 'project':
                    return 'briefcase.svg';
                  case 'hackathon':
                    return 'laptop.svg';
                  default:
                    return 'bolt.svg';
                }
              })();

              return (
                <Tr key={selectedListing?.id}>
                  <Td
                    maxW={96}
                    color="brand.slate.700"
                    fontWeight={500}
                    whiteSpace="normal"
                    wordBreak={'break-word'}
                  >
                    <NextLink
                      className="ph-no-capture"
                      onClick={() => {
                        posthog.capture('submissions_sponsor');
                      }}
                      href={`/dashboard/listings/${selectedListing.slug}/submissions/`}
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
                          {selectedListing.title}
                        </Text>
                      </Flex>
                    </NextLink>
                  </Td>
                  <Td py={2}>
                    <Text
                      color="brand.slate.500"
                      fontSize={'sm'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      {selectedListing?._count?.Submission || 0}
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
                            (e) => e?.tokenSymbol === selectedListing.token,
                          )[0]?.icon ?? '/assets/icons/green-dollar.svg'
                        }
                      />
                      <SponsorPrize
                        compensationType={selectedListing?.compensationType}
                        maxRewardAsk={selectedListing?.maxRewardAsk}
                        minRewardAsk={selectedListing?.minRewardAsk}
                        rewardAmount={selectedListing?.rewardAmount}
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
                        {selectedListing.token}
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
                    {selectedListing.status === 'OPEN' &&
                      selectedListing.isPublished && (
                        <Button
                          className="ph-no-capture"
                          color="#6366F1"
                          fontSize={'13px'}
                          fontWeight={500}
                          _hover={{ bg: '#E0E7FF' }}
                          leftIcon={<ViewIcon />}
                          onClick={() => {
                            posthog.capture('submissions_sponsor');
                            handleViewSubmissions(selectedListing.slug);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Submissions
                        </Button>
                      )}
                    {selectedListing.status === 'OPEN' &&
                      !selectedListing.isPublished &&
                      !pastDeadline && (
                        <Button
                          color={'brand.slate.500'}
                          fontSize={'13px'}
                          fontWeight={500}
                          _hover={{ bg: 'brand.slate.200' }}
                          leftIcon={<EditIcon />}
                          onClick={() => {
                            window.location.href = `/dashboard/listings/${selectedListing.slug}/edit/`;
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
                              `${router.basePath}/listings/${selectedListing?.type}/${selectedListing.slug}`,
                              '_blank',
                            )
                          }
                        >
                          View{' '}
                          {selectedListing?.type === 'hackathon'
                            ? 'Track'
                            : listingType}
                        </MenuItem>
                        {session?.user?.role === 'GOD' ||
                        (selectedListing.isPublished && !pastDeadline) ? (
                          <Link
                            as={NextLink}
                            _hover={{ textDecoration: 'none' }}
                            href={`/dashboard/listings/${selectedListing.slug}/edit`}
                            onClick={resetForm}
                          >
                            <MenuItem
                              py={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              icon={<EditIcon w={4} h={4} />}
                            >
                              Edit{' '}
                              {selectedListing?.type === 'hackathon'
                                ? 'Track'
                                : listingType}
                            </MenuItem>
                          </Link>
                        ) : (
                          <></>
                        )}
                        {(selectedListing.type === 'listing' ||
                          selectedListing.type === 'project') && (
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
                                `${router.basePath}/dashboard/listings/${selectedListing.slug}/duplicate`,
                                '_blank',
                              );
                            }}
                          >
                            Duplicate
                          </MenuItem>
                        )}
                        {listingStatus === 'Draft' && (
                          <>
                            <MenuItem
                              py={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              icon={<AiOutlineDelete size={18} />}
                              onClick={() => handleDeleteDraft(selectedListing)}
                            >
                              Delete Draft
                            </MenuItem>
                          </>
                        )}
                        {!(
                          selectedListing.status === 'OPEN' &&
                          !selectedListing.isPublished
                        ) && (
                          <>
                            <MenuItem
                              py={2}
                              color={'brand.slate.500'}
                              fontSize={'sm'}
                              fontWeight={500}
                              icon={<ViewOffIcon h={4} w={4} />}
                              onClick={() => handleUnpublish(selectedListing)}
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
