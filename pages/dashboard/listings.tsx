import React, { useState } from 'react';
import { Center, Td, Text, Th, Thead, useQuery } from '@chakra-ui/react';
import Image from 'next/image';
import { useStore } from 'zustand';
import { SponsorStore } from '../../store/sponsor';
import axios from 'axios';
import { useQuery as tanQuery } from '@tanstack/react-query';

//utils
import { findSponsorListing } from '../../utils/functions';

import {
  Box,
  Flex,
  Spinner,
  Link,
  Table,
  Button,
  useClipboard,
  Tbody,
  Tr,
  Input,
} from '@chakra-ui/react';

import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Tooltip,
  useToast,
} from '@chakra-ui/react';

import { AddIcon, CopyIcon } from '@chakra-ui/icons';
import { BsThreeDotsVertical } from 'react-icons/bs';

//Layouts
import DashboardLayout from '../../layouts/dashboardLayout';

//components
import DashboardHeader from '../../components/dashboardHead';
import { type } from 'os';

const Backend_Url = process.env.NEXT_PUBLIC_BACKEND_URL;

function Listing() {
  let { currentSponsor } = SponsorStore();

  const listingData = tanQuery({
    queryKey: ['listing', currentSponsor?.orgId || ''],
    queryFn: ({ queryKey }) => findSponsorListing(queryKey[1]),
  });

  let listings = listingData.data;
  console.log(listings);

  return (
    <DashboardLayout>
      {!listingData.isSuccess ? (
        <Center outline={'1px'} h={'85vh'}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        </Center>
      ) : (
        <Box w={'100%'} px={'2.1875rem'} py={'1.125rem'}>
          <DashboardHeader />
          <Box>
            <Text fontWeight={'600'} fontSize={'1.25rem'}>
              💼 Create A Listing
            </Text>
            <Text mt={'5px'} color={'#94A3B8'} fontSize={'1.125rem'}>
              Here are all the listing made by your company
            </Text>
          </Box>

          {listings.bounties.length > 0 ||
            listings.jobs > 0 ||
            listings.grants > 0 ? (
            <Box
              w="100%"
              mt={'36px'}
              bg="white"
              boxShadow="0px 4px 4px rgba(219, 220, 221, 0.25)"
            >
              {' '}
              <Table size={'lg'} variant="simple">
                <ListingHeader />
                {listings.bounties.map(
                  ({ title, amount, deadline }: listElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💰 Bounties'}
                        key={'b' + idx}
                      />
                    );
                  }
                )}
                {listings.jobs.map(
                  ({ title, amount, deadline }: listElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💼 Jobs'}
                        key={'j' + idx}
                      />
                    );
                  }
                )}
                {listings.grants.map(
                  ({ title, amount, deadline }: listElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💰 Grants'}
                        key={'g' + idx}
                      />
                    );
                  }
                )}
              </Table>
            </Box>
          ) : (
            <Text
              fontSize={'20px'}
              fontWeight={'400'}
              mt={'15px'}
              color={'#94A3B8'}
            >
              You don&apos;t have any listings at the moment. Get started by
              creating a bounty, grant, or job
              <Link color={'blue'} href="/listings/create">
                {' '}
                here
              </Link>
              .
            </Text>
          )}
        </Box>
      )}
    </DashboardLayout>
  );
}

export const ListingHeader = () => {
  return (
    <>
      <Thead>
        <Tr>
          <Th w={'25%'} py={'0.6875rem'}>
            <Text
              casing={'capitalize'}
              color="gray.300"
              fontWeight={600}
              fontSize="0.875rem"
            >
              Name
            </Text>
          </Th>
          <Th
            w={'10rem'}
            color="gray.300"
            fontWeight={600}
            fontSize="0.875rem"
            textAlign={'center'}
          >
            <Text casing={'capitalize'}>Type</Text>
          </Th>
          <Th
            color="gray.300"
            textAlign={'center'}
            fontWeight={600}
            fontSize="0.875rem"
          >
            <Text casing={'capitalize'}>Prize</Text>
          </Th>
          <Th color="gray.300" fontWeight={600} fontSize="0.875rem">
            <Text textAlign={'center'} casing={'capitalize'}>
              Deadline
            </Text>
          </Th>
          <Th
            w={'9.375rem'}
            color="gray.300"
            fontWeight={600}
            fontSize="0.875rem"
          >
            <Text textAlign={'center'} casing={'capitalize'}>
              Winner
            </Text>
          </Th>
          <Th w={'1rem'}></Th>
        </Tr>
      </Thead>
    </>
  );
};

type listElm = {
  title: string;
  type?: string;
  amount: string;
  deadline: string;
};

const ListingBody = (props: listElm) => {
  const [selectWinnerOpen, setSelectWinnerOpen] = useState<boolean>(false);

  return (
    <Tbody h={'70px'}>
      <SelectWinnerModal
        selectWinnerOpen={selectWinnerOpen}
        setSelectWinnerOpen={setSelectWinnerOpen}
      />
      <Tr>
        <Td py={'0'} fontSize={'1rem'} fontWeight={'600'} color={'#334254'}>
          {props.title}
        </Td>
        <Td py={'0'}>
          <Center
            fontSize={'12px'}
            bg={'#F7FAFC'}
            py={'0.3125rem'}
            px={'0.75rem'}
            color={'#94A3B8'}
          >
            {props.type}
          </Center>
        </Td>
        <Td py={'0'}>
          <Center fontWeight={'600'} fontSize={'0.75rem'}>
            <Text mr={'0.1875rem'} color={'#334254'}>
              {props.amount}
            </Text>
            <Text color={'#94A3B8'}>USD</Text>
          </Center>
        </Td>
        <Td py={'0'}>
          <Center alignItems={'center'} columnGap="0.9688rem">
            <Box w={'1rem'} height="1rem" mb={"0.26rem"}>
              <Image
                width={'100%'}
                height={'100%'}
                src={'/assets/icons/time.svg'}
                alt=""
              />
            </Box>
            <Text color={'#94A3B8'} fontSize={'0.75rem'} fontWeight={'600'}>
              {timeStamFormat(props.deadline)}
            </Text>
          </Center>
        </Td>
        <Td py={'0'}>
          <Center>
            <Button
              variant="outline"
              leftIcon={<AddIcon />}
              fontSize="0.875rem"
              fontWeight={500}
              padding="1rem 2rem"
              w="9.0625rem"
              color="gray.400"
              h="2.25rem"
              onClick={() => {
                setSelectWinnerOpen(true);
              }}
            >
              Select Winner
            </Button>
          </Center>
        </Td>
        <Td py={'0'}>
          <Flex justify={'center'} align={'center'}>
            <Menu>
              <MenuButton
                h="4rem"
                as={IconButton}
                aria-label="Options"
                icon={
                  <BsThreeDotsVertical color="#DADADA" fontSize={'1.5rem'} />
                }
                variant="unstyled"
              />

              <MenuList bg={'white'} fontWeight={600} color="gray.600" py={'0'}>
                <MenuItem
                  as={Button}
                  justifyContent={'start'}
                  px={'1.125rem'}
                  bg={'white'}
                >
                  <Flex justify={'start'} gap={'0.3125rem'} align={'center'}>
                    <Image
                      height={'15%'}
                      width={'15%'}
                      src={'/assets/icons/delete.svg'}
                      alt={'delete icon'}
                    />
                    <Text fontSize="0.875rem" fontWeight={500} color="gray.500">
                      Delete
                    </Text>
                  </Flex>
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Td>
      </Tr>
    </Tbody>
  );
};

const timeStamFormat = (time: string): string => {
  let t = time.split('T');
  return t[0] + ' ' + t[1]
}

type AppProps = {
  selectWinnerOpen: boolean;
  setSelectWinnerOpen: (state: boolean) => void;
};

const SelectWinnerModal = ({
  selectWinnerOpen,
  setSelectWinnerOpen,
}: AppProps) => {
  return (
    <Modal
      isOpen={selectWinnerOpen}
      onClose={() => {
        setSelectWinnerOpen(false);
      }}
    >
      <ModalOverlay />
      <ModalContent maxW="33.625rem" borderRadius={'16px'}>
        <Box w={'full'} py={'1.8125rem'}>
          <Flex px={'1.6875rem'} pb={'1.1875rem'}>
            <Box
              height={'2.75rem'}
              width={'2.75rem'}
              mt={'0.1rem'}
              mr={'0.8125rem'}
            >
              <Image
                width="100%"
                alt=""
                height="100%"
                src={'/assets/logo/port-placeholder.svg'}
              ></Image>
            </Box>
            <Text fontSize={'0.8125rem'} color={'#94A3B8'}>
              PORT FINANCE
            </Text>
            <Text
              ml={'auto'}
              color={'#A05EBF'}
              borderRadius={'2.0625rem'}
              py={'0.3438rem'}
              px={'0.875rem'}
              h={'min-content'}
              fontSize={'0.75rem'}
              fontWeight={'400'}
              bg={'rgba(101, 98, 255, 0.14)'}
            >
              Bug Bounty
            </Text>
          </Flex>
          <Box borderBottom={'1px'} borderBottomColor={'#E2E8EF'}></Box>
          <Flex px={'1.6875rem'} pt="1.375rem">
            <Box w={'fit-content'} minWidth={'12rem'}>
              <Text fontSize={'0.8125rem'} color={'#94A3B8'}>
                FUNDING
              </Text>
              <Flex>
                <Text fontSize={'1rem'} fontWeight="500">
                  1 USDC
                </Text>
              </Flex>
            </Box>
            <Box w={'fit-content'} minWidth={'12rem'}>
              <Text fontSize={'0.8125rem'} color={'#94A3B8'}>
                DUE ON
              </Text>
              <Flex>
                <Text fontSize={'1rem'} fontWeight="500">
                  1 USDC
                </Text>
              </Flex>
            </Box>
            <Box w={'fit-content'} minWidth={'12rem'}>
              <Text fontSize={'0.8125rem'} color={'#94A3B8'}>
                DONE BY
              </Text>
              <Flex>
                <Text fontSize={'1rem'} fontWeight="500">
                  ...
                </Text>
              </Flex>
            </Box>
          </Flex>
          <Flex px={'1.6875rem'} pt="1.6875rem">
            <Box w={'full'}>
              <Text fontWeight={'600'}>Winner 1</Text>
              <Box mb={'1.3125rem'} mt={'21px'}>
                <Text color={'#94A3B8'} fontWeight={'600'}>
                  What&apos;s the freelancer&apos;s wallet address?
                </Text>
                <Input
                  mt={'0.5rem'}
                  placeholder="Solana Wallet Address"
                  _placeholder={{ color: '#CBD5E1', fontSize: '0.9375rem' }}
                ></Input>
              </Box>
              <Box mb={'1.3125rem'} mt={'21px'}>
                <Text color={'#94A3B8'} fontWeight={'600'}>
                  What&apos;s the freelancer&apos;s name?
                </Text>
                <Input
                  mt={'0.5rem'}
                  placeholder="Solana Wallet Address"
                  _placeholder={{ color: '#CBD5E1', fontSize: '0.9375rem' }}
                ></Input>
              </Box>
              <Box mb={'1.3125rem'} mt={'21px'}>
                <Text color={'#94A3B8'} fontWeight={'600'}>
                  What&apos;s their email?
                </Text>
                <Input
                  mt={'0.5rem'}
                  placeholder="Solana Wallet Address"
                  _placeholder={{ color: '#CBD5E1', fontSize: '0.9375rem' }}
                ></Input>
              </Box>
            </Box>
          </Flex>
          <Flex px={'1.6875rem'} flexDir="column">
            <Button
              w={'min-content'}
              leftIcon={<AddIcon />}
              color={'#94A3B8'}
              fontSize={'0.6875rem'}
              variant="link"
            >
              ADD WINNER
            </Button>
            <Button
              mt={'1.4375rem'}
              fontSize={'0.9375rem'}
              color={'white'}
              bg={'#6562FF'}
            >
              Award Winner
            </Button>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default Listing;
