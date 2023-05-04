/* eslint-disable no-param-reassign */
import {
  AddIcon,
  ArrowBackIcon,
  DownloadIcon,
  LinkIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalContent,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import * as anchor from '@project-serum/anchor';
import type NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useQuery as tanQuery } from '@tanstack/react-query';
import axios from 'axios';
import Avatar from 'boring-avatars';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BsDiscord, BsThreeDotsVertical, BsTwitter } from 'react-icons/bs';
import { FaWallet } from 'react-icons/fa';
import ReactSelect from 'react-select';
import { create } from 'zustand';

// components
import DashboardHeader from '../../components/dashboardHead';
import type { MultiSelectOptions } from '../../constants';
import type { Bounties, SubmissionType } from '../../interface/listings';
import type { Talent } from '../../interface/talent';
// Layouts
import DashboardLayout from '../../layouts/dashboardLayout';
import { SponsorStore } from '../../store/sponsor';
import { connection, createPayment } from '../../utils/contract/contract';
// utils
import { findSponsorListing } from '../../utils/functions';

type SubmissionPageType = {
  submissionList: SubmissionType[];
  setsubmissionList: (list: SubmissionType[]) => void;
  selectedSub: string;
  setSelectedSub: (id: string) => void;
  id: string;
  page: string;
  setPage: (page: string, id: string) => void;
};

const SelectionStore = create<SubmissionPageType>()((set) => ({
  page: 'listings',
  id: '',
  selectedSub: '',
  submissionList: [],
  setsubmissionList: (list: SubmissionType[]) => {
    set((state) => {
      state.submissionList = list;
      return { ...state };
    });
  },
  setSelectedSub: (id: string) => {
    set((state) => {
      state.selectedSub = id;
      return { ...state };
    });
  },
  setPage: (page: string, id: string) => {
    set((state) => {
      if (id) {
        state.id = id;
      }
      state.page = page;
      return { ...state };
    });
  },
}));

const walletLimit = (text: string) => {
  if (text.length > 0) {
    return `${text.slice(0, 4)}...${text.slice(-3)}`;
  }
  return 'N/A';
};

const LinkAns = ({ label, value }: { label: string; value: string }) => {
  return (
    <Box>
      <Text color={'gray.400'} fontSize={'11px'}>
        {label}
      </Text>
      <Flex
        align={'center'}
        mt={'10px'}
        px={'20px'}
        py={'15px'}
        color={'#3656C7'}
        bg={'rgba(39, 117, 202, 0.04)'}
        rounded={'xl'}
      >
        <LinkIcon mr={'10px'} />
        <Text>{value}</Text>
      </Flex>
    </Box>
  );
};
const TextAns = ({ label, value }: { label: string; value: string }) => {
  return (
    <Box>
      <Text mt={'15px'} color={'gray.400'} fontSize={'11px'}>
        {label}
      </Text>
      <Text mt={'10px'} color={'gray.500'}>
        {value}
      </Text>
    </Box>
  );
};

const QuestionAnswer = ({ sub, label }: { sub: any; label: string }) => {
  const value = sub[label];

  if (value.slice(0, 4) === 'http') {
    return <LinkAns label={label} value={sub[label]} />;
  }

  return <TextAns label={label} value={sub[label]} />;
};

const SubView = ({ subData }: { id?: string; subData: any }) => {
  const subList = subData.data;

  const { selectedSub, setSelectedSub, setsubmissionList } = SelectionStore();

  useEffect(() => {
    setSelectedSub(subData.data[0].id);
    setsubmissionList(subList);
  }, []);

  const currentSubmission = subList.find((ele: any) => {
    return ele.id === selectedSub;
  });

  if (!currentSubmission) {
    return <></>;
  }

  const submissionQuestion = currentSubmission.questions
    ? JSON.parse(JSON.parse(currentSubmission.questions))
    : {};

  console.log(submissionQuestion);

  return (
    <>
      <Flex columnGap={'5px'} mt={'20px '}>
        <Text>{subList.length}</Text>
        <Text color={'gray.400'}>Submissions</Text>
        <Flex
          align={'center'}
          columnGap={'8px'}
          ml={'110px'}
          color={'#A3B0B8'}
          fontWeight={'700'}
        >
          <DownloadIcon /> <Text>EXPORT AS CSV</Text>
        </Flex>
        <Text ml={'20px'}>
          {subList.map((ele: any) => ele.id).indexOf(selectedSub) + 1} OF{' '}
          {subList.length}
        </Text>
      </Flex>
      <Flex columnGap={'20px'} mt={'26px'}>
        <Table overflow={'hidden'} w={'360px'} bg={'#FFFFFF'}>
          <Thead>
            <Tr>
              <Th w={'250px'} color={'gray.400'}>
                Name
              </Th>
            </Tr>
          </Thead>
          <Tbody
            flexDir={'column'}
            display={'flex'}
            overflow={'hidden'}
            overflowY={'auto'}
            maxH={'480px'}
          >
            {subList.map((ele: any, idx: number) => {
              return (
                <Tr
                  key={`sub${idx}`}
                  display={'flex'}
                  bg={selectedSub === ele.id ? 'rgba(101, 98, 255, 0.06)' : ''}
                  cursor={'pointer'}
                  onClick={() => {
                    setSelectedSub(ele.id);
                  }}
                >
                  <Flex columnGap={'17px'} px={'20px'} py={'12px'}>
                    <Avatar></Avatar>
                    <Box>
                      <Text>
                        {ele.Talent.firstname
                          ? `${ele.Talent.firstname} ${ele.Talent.lastname}`
                          : 'Not Available'}
                      </Text>
                      <Text color={'gray.400'} fontSize={'12px'}>
                        {ele.Talent.email}
                      </Text>
                    </Box>
                  </Flex>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        <Box w={'740px'} h={'519px'} px={'33px'} py={'15px'} bg={'white'}>
          <Flex>
            <Flex columnGap={'17px'} mr={'auto'}>
              <Avatar></Avatar>
              <Box>
                <Text fontSize={'14px'}>
                  {currentSubmission?.Talent.firstname
                    ? `${currentSubmission.Talent.firstname} ${currentSubmission.Talent.lastname}`
                    : 'Not Available'}
                </Text>
                <Text color={'gray.400'} fontSize={'12px'}>
                  {currentSubmission.Talent.email}
                </Text>
              </Box>
            </Flex>
            <Button
              color={'gray.600'}
              fontSize={'12px'}
              fontWeight={'500'}
              bg={'transparent'}
              leftIcon={<BsTwitter color="#94A3B8" fontSize={'20px'} />}
            >
              {currentSubmission.Talent.twitter || 'N/A'}
            </Button>
            <Button
              color={'gray.600'}
              fontSize={'12px'}
              fontWeight={'500'}
              bg={'transparent'}
              leftIcon={<BsDiscord color="#94A3B8" fontSize={'20px'} />}
            >
              {currentSubmission.Talent.discord || 'N/A'}
            </Button>
            <Button
              color={'gray.600'}
              fontSize={'12px'}
              fontWeight={'500'}
              bg={'transparent'}
              leftIcon={<FaWallet color="#94A3B8" fontSize={'20px'} />}
            >
              {walletLimit(currentSubmission.Talent.publickey)}
            </Button>
          </Flex>
          <Flex
            direction={'column'}
            rowGap={'1rem'}
            overflow={'hidden'}
            overflowY={'auto'}
            w={'100%'}
            h={'85%'}
            mt={'10px'}
            p={'8px'}
          >
            {Object.keys(submissionQuestion).map((qn, idx) => {
              return (
                <QuestionAnswer
                  key={`i${idx}`}
                  sub={submissionQuestion}
                  label={qn}
                />
              );
            })}
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

export const ListingHeader = () => {
  return (
    <>
      <Thead>
        <Tr>
          <Th w={'25%'} py={'0.6875rem'}>
            <Text
              color="gray.300"
              fontSize="0.875rem"
              fontWeight={600}
              casing={'capitalize'}
            >
              Name
            </Text>
          </Th>
          <Th
            w={'10rem'}
            color="gray.300"
            fontSize="0.875rem"
            fontWeight={600}
            textAlign={'center'}
          >
            <Text casing={'capitalize'}>Type</Text>
          </Th>
          <Th
            color="gray.300"
            fontSize="0.875rem"
            fontWeight={600}
            textAlign={'center'}
          >
            <Text casing={'capitalize'}>Prize</Text>
          </Th>
          <Th color="gray.300" fontSize="0.875rem" fontWeight={600}>
            <Text textAlign={'center'} casing={'capitalize'}>
              Deadline
            </Text>
          </Th>
          <Th
            w={'9.375rem'}
            color="gray.300"
            fontSize="0.875rem"
            fontWeight={600}
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

type ListElm = {
  title: string;
  type?: string;
  amount: string;
  deadline: string;
  id: string;
};

const timeStamFormat = (time: string): string => {
  const t = time.split('T');
  return `${t[0]} ${t[1]}`;
};

type AppProps = {
  selectWinnerOpen: boolean;
  setSelectWinnerOpen: (state: boolean) => void;
  bounty?: Bounties;
  submission?: SubmissionType[];
};
type WinnerTempState = {
  id: string;
  Talent: Talent;
  place: number;
};
const SelectWinnerModal = ({
  selectWinnerOpen,
  setSelectWinnerOpen,
  bounty,
}: AppProps) => {
  const { submissionList } = SelectionStore();
  const Anchorwallet = useAnchorWallet();
  const [selectedOption, setSelectedOption] = useState<MultiSelectOptions[]>(
    []
  );

  const [winner, setWinner] = useState<WinnerTempState[]>([]);
  const option: MultiSelectOptions[] = [];
  submissionList.forEach((e) => {
    option?.push({ label: e.Talent?.firstname as string, value: e.id });
  });
  const handleSelect = async () => {
    const transaction = new anchor.web3.Transaction();

    const ix: anchor.web3.TransactionInstruction[] = [];

    // const prize = JSON.parse(bounty?.prizeList as string);

    console.log(typeof bounty?.prizeList);

    // return;

    winner.forEach(async (e) => {
      let amount = 0;

      if (e.place === 1) {
        amount = parseInt(bounty?.prizeList.first as string, 10);
      } else if (e.place === 2) {
        amount = parseInt(bounty?.prizeList.second as string, 10);
      } else if (e.place === 3) {
        amount = parseInt(bounty?.prizeList.third as string, 10);
      } else if (e.place === 4) {
        amount = parseInt(bounty?.prizeList.forth as string, 10);
      } else if (e.place === 5) {
        amount = parseInt(bounty?.prizeList.fifth as string, 10);
      }
      ix.push(
        await createPayment(
          Anchorwallet as NodeWallet,
          new anchor.web3.PublicKey(e.Talent?.publickey as string),
          amount,
          new anchor.web3.PublicKey(bounty?.token as string),
          2
        )
      );
    });
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = Anchorwallet?.publicKey;

    transaction.add(...ix);
    const signed = await Anchorwallet?.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(
      signed?.serialize() as any
    );

    console.log(txid, '--ix');

    if (winner.length > 0) {
      console.log(ix);
    }
  };

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
          <Flex pb={'1.1875rem'} px={'1.6875rem'}>
            <Box w={'2.75rem'} h={'2.75rem'} mt={'0.1rem'} mr={'0.8125rem'}>
              <Image
                width="100%"
                alt=""
                height="100%"
                src={'/assets/logo/port-placeholder.svg'}
              ></Image>
            </Box>
            <Text color={'#94A3B8'} fontSize={'0.8125rem'}>
              {bounty?.title}
            </Text>
          </Flex>
          <Box borderBottom={'1px'} borderBottomColor={'#E2E8EF'}></Box>
          <Flex pt="0" px={'1.6875rem'}>
            <Box w={'fit-content'} minW={'12rem'}>
              <Text color={'#94A3B8'} fontSize={'0.8125rem'}>
                FUNDING
              </Text>
              <Flex>
                <Text fontSize={'1rem'} fontWeight="500">
                  {bounty?.amount}
                </Text>
              </Flex>
            </Box>
            <Box w={'fit-content'} minW={'12rem'}>
              <Text color={'#94A3B8'} fontSize={'0.8125rem'}>
                DUE ON
              </Text>
              <Flex>
                <Text fontSize={'1rem'} fontWeight="500">
                  {bounty?.deadline}
                </Text>
              </Flex>
            </Box>
            <Box w={'fit-content'} minW={'12rem'}>
              <Text color={'#94A3B8'} fontSize={'0.8125rem'}>
                DONE BY
              </Text>
              <Flex>
                <Text fontSize={'1rem'} fontWeight="500">
                  ...
                </Text>
              </Flex>
            </Box>
          </Flex>

          <Flex direction={'column'} pt="1rem" px={'1.6875rem'}>
            {selectedOption?.map((_e, index) => {
              return (
                <Box key={''} w={'full'}>
                  <Text fontWeight={'600'}>Winner {index + 1}</Text>
                  <Box mt={'21px'} mb={'1.3125rem'}>
                    <ReactSelect
                      onChange={(err) => {
                        console.log(err);

                        const sub = submissionList.find(
                          (s) => (s.id as string) === err?.value
                        );
                        setWinner([
                          ...winner,
                          {
                            id: err?.value as string,
                            Talent: sub?.Talent as Talent,
                            place: index + 1,
                          },
                        ]);
                      }}
                      isMulti={false}
                      options={option}
                    />
                  </Box>
                </Box>
              );
            })}
          </Flex>
          <Flex direction="column" px={'1.6875rem'}>
            <Button
              w={'min-content'}
              color={'#94A3B8'}
              fontSize={'0.6875rem'}
              leftIcon={<AddIcon />}
              onClick={() => {
                setSelectedOption([
                  ...selectedOption,
                  { label: 'Winner 2', value: '2' },
                ]);
              }}
              variant="link"
            >
              ADD WINNER
            </Button>
            <Button
              mt={'1.4375rem'}
              color={'white'}
              fontSize={'0.9375rem'}
              bg={'#6562FF'}
              onClick={handleSelect}
            >
              Award Winner
            </Button>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};

const ListingBody = (props: ListElm) => {
  const [selectWinnerOpen, setSelectWinnerOpen] = useState<boolean>(false);

  const { setPage } = SelectionStore();

  return (
    <Tbody
      h={'70px'}
      onClick={() => {
        setPage('submission', props.id);
      }}
    >
      <SelectWinnerModal
        selectWinnerOpen={selectWinnerOpen}
        setSelectWinnerOpen={setSelectWinnerOpen}
      />
      <Tr>
        <Td py={'0'} color={'#334254'} fontSize={'1rem'} fontWeight={'600'}>
          {props.title}
        </Td>
        <Td py={'0'}>
          <Center
            px={'0.75rem'}
            py={'0.3125rem'}
            color={'#94A3B8'}
            fontSize={'12px'}
            bg={'#F7FAFC'}
          >
            {props.type}
          </Center>
        </Td>
        <Td py={'0'}>
          <Center fontSize={'0.75rem'} fontWeight={'600'}>
            <Text mr={'0.1875rem'} color={'#334254'}>
              {`${props.amount}`}
            </Text>
            <Text color={'#94A3B8'}>USD</Text>
          </Center>
        </Td>
        <Td py={'0'}>
          <Center alignItems={'center'} columnGap="0.9688rem">
            <Box w={'1rem'} h="1rem" mb={'0.26rem'}>
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
              w="9.0625rem"
              h="2.25rem"
              p="1rem 2rem"
              color="gray.400"
              fontSize="0.875rem"
              fontWeight={500}
              leftIcon={<AddIcon />}
              onClick={() => {
                setSelectWinnerOpen(true);
              }}
              variant="outline"
            >
              Select Winner
            </Button>
          </Center>
        </Td>
        <Td py={'0'}>
          <Flex align={'center'} justify={'center'}>
            <Menu>
              <MenuButton
                as={IconButton}
                h="4rem"
                aria-label="Options"
                icon={
                  <BsThreeDotsVertical color="#DADADA" fontSize={'1.5rem'} />
                }
                variant="unstyled"
              />
              <MenuList py={'0'} color="gray.600" fontWeight={600} bg={'white'}>
                <MenuItem
                  as={Button}
                  justifyContent={'start'}
                  px={'1.125rem'}
                  bg={'white'}
                >
                  <Flex align={'center'} justify={'start'} gap={'0.3125rem'}>
                    <Image
                      height={'15%'}
                      width={'15%'}
                      src={'/assets/icons/delete.svg'}
                      alt={'delete icon'}
                    />
                    <Text color="gray.500" fontSize="0.875rem" fontWeight={500}>
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

const ListingsPage = ({ listingData }: { listingData: any }) => {
  const listings = listingData.data;
  console.log(listings);

  return (
    <>
      {!listingData.isSuccess ? (
        <Center h={'85vh'} outline={'1px'}>
          <Spinner
            color="blue.500"
            emptyColor="gray.200"
            size="xl"
            speed="0.65s"
            thickness="4px"
          />
        </Center>
      ) : (
        <Box w={'100%'} px={'2.1875rem'} py={'1.125rem'}>
          <DashboardHeader />
          <Box>
            <Text fontSize={'1.25rem'} fontWeight={'600'}>
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
              shadow="0px 4px 4px rgba(219, 220, 221, 0.25)"
            >
              {' '}
              <Table size={'lg'} variant="simple">
                <ListingHeader />
                {listings.bounties.map(
                  ({ title, amount, deadline, id }: ListElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💰 Bounties'}
                        key={`b${idx}`}
                        id={id}
                      />
                    );
                  }
                )}
                {listings.jobs.map(
                  ({ title, amount, deadline, id }: ListElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💼 Jobs'}
                        key={`j${idx}`}
                        id={id}
                      />
                    );
                  }
                )}
                {listings.grants.map(
                  ({ title, amount, deadline, id }: ListElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💰 Grants'}
                        key={`g${idx}`}
                        id={id}
                      />
                    );
                  }
                )}
              </Table>
            </Box>
          ) : (
            <Text
              mt={'15px'}
              color={'#94A3B8'}
              fontSize={'20px'}
              fontWeight={'400'}
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
    </>
  );
};

const SubmissionsPage = ({
  id,
  listingData,
}: {
  id: string;
  listingData: any;
}) => {
  const [selectWinnerOpen, setSelectWinnerOpen] = useState<boolean>(false);

  const subData = tanQuery({
    queryKey: ['submissions', id],
    queryFn: async (query) => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/submission/find/bounty/${query.queryKey[1]}`
      );
      return res.data.data;
    },
  });

  const listing = listingData.data.bounties.find((ele: any) => ele.id === id);

  console.log({ listing });

  const { page, setPage } = SelectionStore();
  console.log('file: listings.tsx:812 ~ page:', page);

  if (!subData.isSuccess) {
    return <p>loading</p>;
  }

  return (
    <Box px={'34px'} py={'54px'}>
      <SelectWinnerModal
        bounty={listing as Bounties}
        submission={(subData.data.data as SubmissionType[]) ?? []}
        selectWinnerOpen={selectWinnerOpen}
        setSelectWinnerOpen={setSelectWinnerOpen}
      />
      <Flex justify={'space-between'}>
        <Box cursor={'pointer'}>
          <Flex
            align={'center'}
            color={'gray.400'}
            onClick={() => {
              setPage('listings', '');
            }}
          >
            <ArrowBackIcon fontSize={'24px'} mr={'6px'} />
            <Text fontSize={'16px'}>Dashboard / Bounties / {id}</Text>
          </Flex>
          <Text mt={'10px'} fontSize={'19px'} fontWeight={'500'}>
            {listing.title}
          </Text>
        </Box>
        <Button
          w="9.0625rem"
          h="2.25rem"
          p="1rem 2rem"
          color="gray.400"
          fontSize="0.875rem"
          fontWeight={500}
          leftIcon={<AddIcon />}
          onClick={() => {
            setSelectWinnerOpen(true);
          }}
          variant="outline"
        >
          Select Winner
        </Button>
      </Flex>
      <Flex
        align={'center'}
        mt={'17px'}
        px={'27px'}
        py={'24px'}
        bg={'white'}
        rounded={'md'}
      >
        <Flex columnGap={'5px'} mr={'15px'}>
          <Text color={'black'} fontWeight={'500'}>
            {listing.amount}
          </Text>
          <Text color={'#CBD5E1'} fontWeight={'500'}>
            USD
          </Text>
        </Flex>
        <Flex align={'center'} columnGap={'16px'}>
          <TimeIcon fontSize={'18px'} color={'#CBD5E1'} />
          <Text color={'gray.400'}>
            {`${listing.deadline.split('T')[0]} ${
              listing.deadline.split('T')[1]
            }`}
          </Text>
        </Flex>
        <Center
          columnGap={'5px'}
          ml={'26px'}
          px={'0.75rem'}
          py={'0.3125rem'}
          color={'#94A3B8'}
          fontSize={'12px'}
          bg={'#F7FAFC'}
        >
          <Image
            alt=""
            width={'18px'}
            height={'18px'}
            src={'/assets/home/emojis/grants.png'}
          />
          Bounty
        </Center>
      </Flex>
      {<SubView id={id} subData={subData} />}
    </Box>
  );
};

function Listing() {
  const { page, id } = SelectionStore();

  const { currentSponsor } = SponsorStore();

  const listingData = tanQuery({
    queryKey: ['listing', currentSponsor?.id || ''],
    queryFn: ({ queryKey }) => findSponsorListing(queryKey[1] || ''),
  });

  return (
    <DashboardLayout>
      {page === 'listings' && <ListingsPage listingData={listingData} />}
      {page === 'submission' && (
        <SubmissionsPage listingData={listingData} id={id} />
      )}
    </DashboardLayout>
  );
}

export default Listing;

// unused components

// const SubTable = () => {
//   return (
//     <>
//       <Flex columnGap={'5px'} mt={'20px '}>
//         <Text>45</Text>
//         <Text color={'gray.400'}>Submissions</Text>
//       </Flex>

//       <Table mt={'28px'}>
//         <Thead bg={'rgba(241, 245, 249, 0.77)'}>
//           <Tr>
//             <Th w={'250px'} color={'gray.400'}>
//               Name
//             </Th>
//             <Th w={'200px'} color={'gray.400'}>
//               Link
//             </Th>
//             <Th w={'200px'} color={'gray.400'}>
//               Tweet
//             </Th>
//             <Th color={'gray.400'}>Wallet</Th>
//             <Th color={'gray.400'}>Twitter</Th>
//             <Th color={'gray.400'}>Discord</Th>
//           </Tr>
//         </Thead>
//         <Tbody bg={'white'}>
//           <SubTableEntry />
//           <SubTableEntry />
//           <SubTableEntry />
//           <SubTableEntry />
//           <SubTableEntry />
//           <SubTableEntry />
//         </Tbody>
//       </Table>
//     </>
//   );
// };

// const SubTableEntry = () => {
//   return (
//     <Tr>
//       <Td>
//         <Flex columnGap={'17px'}>
//           <Avatar></Avatar>
//           <Box>
//             <Text>Yash Bhardwaj</Text>
//             <Text color={'gray.400'} fontSize={'12px'}>
//               yb@yashbhardwaj.com
//             </Text>
//           </Box>
//         </Flex>
//       </Td>
//       <Td>
//         <Flex align={'center'} columnGap={'4px'} color={'#3173C2'}>
//           <LinkIcon />
//           <Text>superteam.subs....</Text>
//         </Flex>
//       </Td>
//       <Td>
//         <Flex align={'center'} columnGap={'4px'} color={'#3173C2'}>
//           <LinkIcon />
//           <Text>twitter.com/ybhrd..</Text>
//         </Flex>
//       </Td>
//       <Td>
//         <Flex align={'center'} columnGap={'4px'}>
//           <Text color={'black'}>9sJf...393</Text>
//           <CopyIcon color={'gray.400'} />
//         </Flex>
//       </Td>
//       <Td>@ybhrdwj</Td>
//       <Td>yash#2540</Td>
//     </Tr>
//   );
// };
