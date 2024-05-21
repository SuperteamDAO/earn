import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  SearchIcon,
  ViewIcon,
  ViewOffIcon,
} from '@chakra-ui/icons';
import {
  Button,
  Divider,
  Flex,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
import { useEffect, useRef, useState } from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import { FiMoreVertical } from 'react-icons/fi';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { tokenList } from '@/constants/index';
import { useListingFormStore } from '@/features/listing-builder';
import {
  type BountyWithSubmissions,
  formatDeadline,
  getBountyStatus,
  getColorStyles,
  getListingTypeLabel,
  isDeadlineOver,
} from '@/features/listings';
import { CreateListingModal, SponsorPrize } from '@/features/sponsor-dashboard';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';

const debounce = require('lodash.debounce');

function Bounties() {
  const router = useRouter();
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
  const { userInfo } = userStore();
  const [totalBounties, setTotalBounties] = useState(0);
  const [bounties, setBounties] = useState<BountyWithSubmissions[]>([]);
  const [bounty, setBounty] = useState<BountyWithSubmissions>({});
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isBountiesLoading, setIsBountiesLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;
  const { data: session } = useSession();

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  const getBounties = async () => {
    setIsBountiesLoading(true);
    try {
      const bountiesList = await axios.get('/api/bounties/', {
        params: {
          sponsorId: userInfo?.currentSponsorId,
          searchText,
          skip,
          take: length,
          showSubmissionDetails: true,
        },
      });
      setTotalBounties(bountiesList.data.total);
      setBounties(bountiesList.data.data);
      setIsBountiesLoading(false);
    } catch (error) {
      setIsBountiesLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounties();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  const handleUnpublish = async (unpublishedBounty: BountyWithSubmissions) => {
    setBounty(unpublishedBounty);
    unpublishOnOpen();
  };

  const changeBountyStatus = async (status: boolean) => {
    setIsChangingStatus(true);
    try {
      const result = await axios.post(`/api/bounties/update/${bounty.id}/`, {
        isPublished: status,
      });

      const changedBountyIndex = bounties.findIndex(
        (b) => b.id === result.data.id,
      );
      const newBounties = bounties.map((b, index) =>
        changedBountyIndex === index
          ? { ...b, isPublished: result.data.isPublished }
          : b,
      );
      setBounties(newBounties);
      unpublishOnClose();
      setIsChangingStatus(false);
    } catch (e) {
      setIsChangingStatus(false);
    }
  };

  const handleViewSubmissions = (slug: string | undefined) => {
    router.push(`/dashboard/listings/${slug}/submissions/`);
  };

  const deleteSelectedDraft = async () => {
    try {
      await axios.post(`/api/bounties/delete/${bounty.id}`);
      const update = bounties.filter((x) => x.id !== bounty.id);
      setBounties(update);
    } catch (e) {
      console.log(e);
    } finally {
      deleteDraftOnClose();
    }
  };

  const handleDeleteDraft = async (deleteBounty: BountyWithSubmissions) => {
    setBounty(deleteBounty);
    deleteDraftOnOpen();
  };

  const { resetForm } = useListingFormStore();

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  return (
    <Sidebar showBanner={true}>
      <Modal isOpen={unpublishIsOpen} onClose={unpublishOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Unpublish Listing?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="brand.slate.500">
              This listing will be hidden from the homepage once unpublished.
              Are you sure you want to unpublish this listing?
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button mr={4} onClick={unpublishOnClose} variant="ghost">
              Close
            </Button>
            <Button
              isLoading={isChangingStatus}
              leftIcon={<ViewOffIcon />}
              loadingText="Unpublishing..."
              onClick={() => changeBountyStatus(false)}
              variant="solid"
            >
              Unpublish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={deleteDraftIsOpen} onClose={deleteDraftOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Draft?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="brand.slate.500">
              Are you sure you want to delete this draft listing?
            </Text>
            <br />
            <Text color="brand.slate.500">
              Note: If this was previously a published listing, all submissions
              or applications received for this listing will also be deleted.
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button mr={4} onClick={deleteDraftOnClose} variant="ghost">
              Close
            </Button>
            <Button
              isLoading={isChangingStatus}
              leftIcon={<AiOutlineDelete />}
              loadingText="Deleting..."
              onClick={deleteSelectedDraft}
              variant="solid"
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
      {isBountiesLoading && <LoadingSection />}
      {!isBountiesLoading && !bounties?.length && (
        <>
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
      {!isBountiesLoading && !!bounties?.length && (
        <>
          <TableContainer
            mb={8}
            borderWidth={'1px'}
            borderColor={'brand.slate.200'}
            borderRadius={8}
          >
            <Table variant="simple">
              <Thead>
                <Tr bg="brand.slate.100">
                  <Th
                    color="brand.slate.400"
                    fontSize={14}
                    fontWeight={500}
                    letterSpacing={'-2%'}
                    textTransform={'capitalize'}
                  >
                    Listing Name
                  </Th>
                  <Th
                    color="brand.slate.400"
                    fontSize={14}
                    fontWeight={500}
                    letterSpacing={'-2%'}
                    textAlign="center"
                    textTransform={'capitalize'}
                  >
                    Submissions
                  </Th>
                  <Th
                    color="brand.slate.400"
                    fontSize={14}
                    fontWeight={500}
                    letterSpacing={'-2%'}
                    textTransform={'capitalize'}
                  >
                    Deadline
                  </Th>
                  <Th
                    color="brand.slate.400"
                    fontSize={14}
                    fontWeight={500}
                    letterSpacing={'-2%'}
                    textTransform={'capitalize'}
                  >
                    Prize
                  </Th>
                  <Th
                    color="brand.slate.400"
                    fontSize={14}
                    fontWeight={500}
                    letterSpacing={'-2%'}
                    textTransform={'capitalize'}
                  >
                    Status
                  </Th>
                  <Th
                    color="brand.slate.400"
                    fontSize={14}
                    fontWeight={500}
                    letterSpacing={'-2%'}
                    textTransform={'capitalize'}
                  >
                    Actions
                  </Th>
                  <Th pl={0} />
                </Tr>
              </Thead>
              <Tbody w="full">
                {bounties.map((currentBounty) => {
                  const bountyType = getListingTypeLabel(
                    currentBounty?.type ?? 'bounty',
                  );

                  const deadline = formatDeadline(
                    currentBounty?.deadline,
                    currentBounty?.applicationType,
                  );

                  const pastDeadline = isDeadlineOver(currentBounty?.deadline);

                  const bountyStatus = getBountyStatus(currentBounty);

                  const listingIcon = (() => {
                    switch (currentBounty.type) {
                      case 'bounty':
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
                    <Tr key={currentBounty?.id}>
                      <Td
                        maxW={96}
                        color="brand.slate.700"
                        fontWeight={500}
                        whiteSpace="normal"
                        wordBreak={'break-word'}
                      >
                        <NextLink
                          href={`/dashboard/listings/${currentBounty.slug}/submissions/`}
                          passHref
                        >
                          <Flex align={'center'}>
                            <Tooltip bg="brand.slate.400" label={bountyType}>
                              <Image
                                h={5}
                                mr={2}
                                alt={`New ${bountyType}`}
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
                              {currentBounty.title}
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
                          {currentBounty?._count?.Submission || 0}
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
                                (e) => e?.tokenSymbol === currentBounty.token,
                              )[0]?.icon ?? '/assets/icons/green-dollar.svg'
                            }
                          />
                          <SponsorPrize
                            compensationType={currentBounty?.compensationType}
                            maxRewardAsk={currentBounty?.maxRewardAsk}
                            minRewardAsk={currentBounty?.minRewardAsk}
                            rewardAmount={currentBounty?.rewardAmount}
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
                            {currentBounty.token}
                          </Text>
                        </Flex>
                      </Td>
                      <Td align="center" py={2}>
                        <Tag
                          px={3}
                          color={getColorStyles(bountyStatus).color}
                          fontSize={'12px'}
                          fontWeight={500}
                          bg={getColorStyles(bountyStatus).bgColor}
                          borderRadius={'full'}
                          variant="solid"
                        >
                          {bountyStatus}
                        </Tag>
                      </Td>
                      <Td px={3} py={2}>
                        {currentBounty.status === 'OPEN' &&
                          currentBounty.isPublished && (
                            <Button
                              color="#6366F1"
                              fontSize={'13px'}
                              fontWeight={500}
                              _hover={{ bg: '#E0E7FF' }}
                              leftIcon={<ViewIcon />}
                              onClick={() =>
                                handleViewSubmissions(currentBounty.slug)
                              }
                              size="sm"
                              variant="ghost"
                            >
                              Submissions
                            </Button>
                          )}
                        {currentBounty.status === 'OPEN' &&
                          !currentBounty.isPublished &&
                          !pastDeadline && (
                            <Button
                              color={'brand.slate.500'}
                              fontSize={'13px'}
                              fontWeight={500}
                              _hover={{ bg: 'brand.slate.200' }}
                              leftIcon={<EditIcon />}
                              onClick={() => {
                                window.location.href = `/dashboard/listings/${currentBounty.slug}/edit/`;
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
                                  `${router.basePath}/listings/${currentBounty?.type}/${currentBounty.slug}`,
                                  '_blank',
                                )
                              }
                            >
                              View{' '}
                              {currentBounty?.type === 'hackathon'
                                ? 'Track'
                                : bountyType}
                            </MenuItem>
                            {session?.user?.role === 'GOD' ||
                            (currentBounty.isPublished && !pastDeadline) ? (
                              <Link
                                as={NextLink}
                                _hover={{ textDecoration: 'none' }}
                                href={`/dashboard/listings/${currentBounty.slug}/edit`}
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
                                  {currentBounty?.type === 'hackathon'
                                    ? 'Track'
                                    : bountyType}
                                </MenuItem>
                              </Link>
                            ) : (
                              <></>
                            )}

                            {(currentBounty.type === 'bounty' ||
                              currentBounty.type === 'project') && (
                              <MenuItem
                                py={2}
                                color={'brand.slate.500'}
                                fontSize={'sm'}
                                fontWeight={500}
                                icon={<CopyIcon h={4} w={4} />}
                                onClick={() =>
                                  window.open(
                                    `${router.basePath}/dashboard/listings/${currentBounty.slug}/duplicate`,
                                    '_blank',
                                  )
                                }
                              >
                                Duplicate
                              </MenuItem>
                            )}
                            {bountyStatus === 'Draft' && (
                              <>
                                <MenuItem
                                  py={2}
                                  color={'brand.slate.500'}
                                  fontSize={'sm'}
                                  fontWeight={500}
                                  icon={<AiOutlineDelete size={18} />}
                                  onClick={() =>
                                    handleDeleteDraft(currentBounty)
                                  }
                                >
                                  Delete Draft
                                </MenuItem>
                              </>
                            )}
                            {!(
                              currentBounty.status === 'OPEN' &&
                              !currentBounty.isPublished
                            ) && (
                              <>
                                <MenuItem
                                  py={2}
                                  color={'brand.slate.500'}
                                  fontSize={'sm'}
                                  fontWeight={500}
                                  icon={<ViewOffIcon h={4} w={4} />}
                                  onClick={() => handleUnpublish(currentBounty)}
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
          <Flex align="center" justify="end" mt={6}>
            <Text mr={4} color="brand.slate.400" fontSize="sm">
              <Text as="span" fontWeight={700}>
                {skip + 1}
              </Text>{' '}
              -{' '}
              <Text as="span" fontWeight={700}>
                {Math.min(skip + length, totalBounties)}
              </Text>{' '}
              of{' '}
              <Text as="span" fontWeight={700}>
                {totalBounties}
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
                totalBounties <= skip + length ||
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

export default Bounties;
