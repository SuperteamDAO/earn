import React, { useEffect, useState } from 'react';
import { Center, Td, Text, Th, Thead, useQuery } from '@chakra-ui/react';
import Image from 'next/image';
import { useStore } from 'zustand';
import { SponsorStore } from '../../store/sponsor';
import axios from 'axios';
import { useQuery as tanQuery } from '@tanstack/react-query';
import Select from 'react-select'

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

import { AddIcon, CopyIcon, ArrowBackIcon, TimeIcon, LinkIcon, DownloadIcon } from '@chakra-ui/icons';
import { BsThreeDotsVertical, BsTwitter, BsDiscord, BsWallet } from 'react-icons/bs';
import { FaWallet } from 'react-icons/fa'

//Layouts
import DashboardLayout from '../../layouts/dashboardLayout';

//components
import DashboardHeader from '../../components/dashboardHead';
import Avatar from 'boring-avatars';

import { create } from 'zustand'
import { type } from 'os';


const Backend_Url = process.env.NEXT_PUBLIC_BACKEND_URL;

type SubmissionPageType = {
  submissionList: string[],
  setsubmissionList: (list: string[]) => void, selected_sub: string, setselected_sub: (id: string) => void, id: string, page: string, setPage: (page: string, id: string) => void
}

let SelectionStore = create<SubmissionPageType>()((set) => ({
  page: 'listings',
  id: '',
  selected_sub: '',
  submissionList: [],
  setsubmissionList: (list: string[]) => {
    set((state) => {
      state.submissionList = list;
      return { ...state }
    })
  },
  setselected_sub: (id: string) => {
    set((state) => {
      state.selected_sub = id;
      return { ...state }
    })
  },
  setPage: (page: string, id: string) => {
    set((state) => {
      if (id) {
        state.id = id;
      }
      state.page = page;
      return { ...state }
    })
  }
}))


function Listing() {

  let { page, id } = SelectionStore()

  let { currentSponsor } = SponsorStore();

  const listingData = tanQuery({
    queryKey: ['listing', currentSponsor?.orgId || ''],
    queryFn: ({ queryKey }) => findSponsorListing(queryKey[1]),
  });


  return (
    <DashboardLayout>
      {(page == 'listings') && <ListingsPage listingData={listingData} />}
      {(page == 'submission') && <SubmissionsPage listingData={listingData} id={id} />}
    </DashboardLayout>
  );
}

const SubmissionsPage = ({ id, listingData }: { id: string, listingData: any }) => {

  const [selectWinnerOpen, setSelectWinnerOpen] = useState<boolean>(false);

  let subData = tanQuery({
    queryKey: ['submissions', id], queryFn: async (query) => {
      let res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/submission/find/bounty/${query.queryKey[1]}`);
      return res.data.data
    }
  })

  let listing = listingData.data.bounties.find((ele: any) => ele.id == id);

  console.log({ listing })


  let { page, setPage } = SelectionStore()

  if (!subData.isSuccess) {
    return <p>loading</p>
  }



  return (
    <Box px={"34px"} py={"54px"} >
      <SelectWinnerModal
        selectWinnerOpen={selectWinnerOpen}
        setSelectWinnerOpen={setSelectWinnerOpen}
      />
      <Flex justifyContent={"space-between"}>
        <Box cursor={"pointer"}>
          <Flex color={"gray.400"} alignItems={"center"} onClick={() => {
            setPage('listings', '');
          }}>
            <ArrowBackIcon fontSize={"24px"} mr={"6px"} />
            <Text fontSize={"16px"} >
              Dashboard / Bounties / {id}
            </Text>
          </Flex>
          <Text fontSize={"19px"} fontWeight={"500"} mt={"10px"}>
            {listing.title}
          </Text>
        </Box>
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
            setSelectWinnerOpen(true)
          }}
        >
          Select Winner
        </Button>
      </Flex>
      <Flex alignItems={"center"} bg={"white"} px={"27px"} py={"24px"} rounded={"md"} mt={"17px"}>
        <Flex columnGap={"5px"} mr={"15px"}>
          <Text fontWeight={"500"} color={"black"} >
            {listing.amount}
          </Text>
          <Text fontWeight={"500"} color={"#CBD5E1"}>
            USD
          </Text>
        </Flex>
        <Flex alignItems={"center"} columnGap={"16px"}>
          <TimeIcon fontSize={"18px"} color={"#CBD5E1"} />
          <Text color={"gray.400"}>
            {listing.deadline.split('T')[0] + ' ' + listing.deadline.split('T')[1]}
          </Text>
        </Flex>
        <Center
          fontSize={'12px'}
          bg={'#F7FAFC'}
          py={'0.3125rem'}
          px={'0.75rem'}
          color={'#94A3B8'}
          columnGap={"5px"}
          ml={"26px"}
        >
          <Image alt='' width={"18px"} height={"18px"} src={"/assets/home/emojis/grants.png"} />
          Bounty
        </Center>
      </Flex>
      {
        <SubView id={id} subData={subData} />
      }
    </Box >
  )
}


const SubView = ({ id, subData }: { id: string, subData: any }) => {

  let subList = subData.data;

  let { selected_sub, setselected_sub, setsubmissionList } = SelectionStore();

  useEffect(() => {
    setselected_sub(subData.data[0].id)
    setsubmissionList(subList);
  }, [])

  let current_submission = subList.find((ele: any) => {
    return ele.id == selected_sub
  })

  if (!current_submission) {
    return <></>
  }

  let submission_question = (current_submission.questions) ? JSON.parse(JSON.parse(current_submission.questions)) : {}

  console.log(submission_question)

  return (
    <>
      <Flex columnGap={"5px"} mt={"20px "}>
        <Text>{subList.length}</Text>
        <Text color={"gray.400"}>Submissions</Text>
        <Flex ml={"110px"} columnGap={"8px"} alignItems={"center"} fontWeight={"700"} color={"#A3B0B8"}> <DownloadIcon /> <Text>EXPORT AS CSV</Text></Flex>
        <Text ml={"20px"}>{subList.map((ele: any) => ele.id).indexOf(selected_sub) + 1} OF {subList.length}</Text>
      </Flex>
      <Flex mt={"26px"} columnGap={"20px"}>
        <Table bg={"#FFFFFF"} w={"360px"} overflow={"hidden"} >
          <Thead>
            <Tr >
              <Th color={"gray.400"} w={"250px"}>
                Name
              </Th>
            </Tr>
          </Thead>
          <Tbody display={"flex"} flexDirection={"column"} overflow={"hidden"} maxH={"480px"} overflowY={"auto"}>
            {
              subList.map((ele: any, idx: number) => {
                return (
                  <Tr cursor={"pointer"} onClick={() => {
                    setselected_sub(ele.id)
                  }} key={"sub" + idx} display={"flex"} bg={(selected_sub == ele.id) ? 'rgba(101, 98, 255, 0.06)' : ''}>
                    <Flex columnGap={"17px"} px={"20px"} py={"12px"}  >
                      <Avatar></Avatar>
                      <Box >
                        <Text>{ele.Talent.firstname ? ele.Talent.firstname + ' ' + ele.Talent.lastname : "Not Available"}</Text>
                        <Text fontSize={"12px"} color={"gray.400"}>{ele.Talent.email}</Text>
                      </Box>
                    </Flex>
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
        <Box w={"740px"} h={"519px"} bg={"white"} py={"15px"} px={"33px"}>
          <Flex>
            <Flex columnGap={"17px"} mr={"auto"}>
              <Avatar ></Avatar>
              <Box>
                <Text fontSize={"14px"}>{current_submission?.Talent.firstname ? current_submission.Talent.firstname + ' ' + current_submission.Talent.lastname : "Not Available"}</Text>
                <Text fontSize={"12px"} color={"gray.400"}>{current_submission.Talent.email}</Text>
              </Box>
            </Flex>
            <Button fontSize={"12px"} fontWeight={"500"} color={"gray.600"} bg={"transparent"} leftIcon={<BsTwitter color='#94A3B8' fontSize={"20px"} />}>
              {current_submission.Talent.twitter || "N/A"}
            </Button>
            <Button fontSize={"12px"} fontWeight={"500"} color={"gray.600"} bg={"transparent"} leftIcon={<BsDiscord color='#94A3B8' fontSize={"20px"} />}>
              {current_submission.Talent.discord || "N/A"}
            </Button>
            <Button fontSize={"12px"} fontWeight={"500"} color={"gray.600"} bg={"transparent"} leftIcon={<FaWallet color='#94A3B8' fontSize={"20px"} />}>
              {walletLimit(current_submission.Talent.publickey)}
            </Button>
          </Flex>
          <Flex overflow={"hidden"} overflowY={"auto"} rowGap={"1rem"} flexDirection={"column"} w={"100%"} marginTop={"10px"} p={"8px"} h={"85%"} >
            {
              Object.keys(submission_question).map((qn, idx) => {
                return <QuestionAnswer key={"i" + idx} sub={submission_question} label={qn} />
              })
            }
          </Flex>
        </Box>
      </Flex>
    </>
  )
}

let LinkAns = ({ label, value }: { label: string, value: string }) => {
  return <Box >
    <Text fontSize={"11px"} color={"gray.400"}>{label}</Text>
    <Flex rounded={"xl"} px={"20px"} py={"15px"} mt={"10px"} color={"#3656C7"} bg={"rgba(39, 117, 202, 0.04)"} alignItems={"center"}>
      <LinkIcon mr={"10px"} />
      <Text>
        {value}
      </Text>
    </Flex>
  </Box>
}
let TextAns = ({ label, value }: { label: string, value: string }) => {
  return (
    <Box>
      <Text marginTop={"15px"} fontSize={"11px"} color={"gray.400"}>{label}</Text>
      <Text color={"gray.500"} mt={"10px"}>
        {value}
      </Text>
    </Box>
  )
}

const QuestionAnswer = ({ sub, label }: { sub: any, label: string }) => {
  let value = sub[label];

  if (value.slice(0, 4) == 'http') {
    return <LinkAns label={label} value={sub[label]} />
  }

  return <TextAns label={label} value={sub[label]} />

}


const ListingsPage = ({ listingData }: { listingData: any }) => {


  let listings = listingData.data;
  console.log(listings);

  return (
    <>
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
                  ({ title, amount, deadline, id }: listElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💰 Bounties'}
                        key={'b' + idx}
                        id={id}
                      />
                    );
                  }
                )}
                {listings.jobs.map(
                  ({ title, amount, deadline, id }: listElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💼 Jobs'}
                        key={'j' + idx}
                        id={id}
                      />
                    );
                  }
                )}
                {listings.grants.map(
                  ({ title, amount, deadline, id }: listElm, idx: number) => {
                    return (
                      <ListingBody
                        title={title}
                        amount={amount}
                        deadline={deadline}
                        type={'💰 Grants'}
                        key={'g' + idx}
                        id={id}
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
    </>
  )
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
  id: string;
};

const ListingBody = (props: listElm) => {
  const [selectWinnerOpen, setSelectWinnerOpen] = useState<boolean>(false);

  let setPage = SelectionStore().setPage;

  return (
    <Tbody h={'70px'} onClick={() => {
      setPage('submission', props.id)
    }}>
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
              {`${props.amount}`}
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

type optionType = { value: string, label: string }

//wallet name email

const SelectWinnerModal = ({
  selectWinnerOpen,
  setSelectWinnerOpen,
}: AppProps) => {

  let { submissionList } = SelectionStore();

  let wallets: optionType[] = submissionList.map((ele: any) => {
    return { value: ele.Talent.publickey, label: ele.Talent.publickey }
  })

  let name: optionType[] = submissionList.map((ele: any) => {
    return { value: ele.Talent.firstname + ' ' + ele.Talent.lastname, label: ele.Talent.firstname + ' ' + ele.Talent.lastname }
  })

  let email: optionType[] = submissionList.map((ele: any) => {
    return { value: ele.Talent.email, label: ele.Talent.email }
  })


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
                <Select defaultValue={{}} name='wallets' options={wallets} />

              </Box>
              <Box mb={'1.3125rem'} mt={'21px'}>
                <Text color={'#94A3B8'} fontWeight={'600'}>
                  What&apos;s the freelancer&apos;s name?
                </Text>
                <Select defaultValue={{}} name='name' options={name} />

              </Box>
              <Box mb={'1.3125rem'} mt={'21px'}>
                <Text color={'#94A3B8'} fontWeight={'600'}>
                  What&apos;s their email?
                </Text>
                <Select onChange={(e) => {
                  console.log(e)
                }} defaultValue={{}} name='email' options={email} />

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



// unused components


const SubTable = () => {
  return (
    <>
      <Flex columnGap={"5px"} mt={"20px "}>
        <Text>45</Text>
        <Text color={"gray.400"}>Submissions</Text>
      </Flex>

      <Table mt={"28px"}>
        <Thead bg={"rgba(241, 245, 249, 0.77)"}>
          <Tr >
            <Th color={"gray.400"} w={"250px"}>
              Name
            </Th>
            <Th color={"gray.400"} w={"200px"}>
              Link
            </Th>
            <Th color={"gray.400"} w={"200px"}>
              Tweet
            </Th>
            <Th color={"gray.400"}>
              Wallet
            </Th>
            <Th color={"gray.400"}>
              Twitter
            </Th>
            <Th color={"gray.400"}>
              Discord
            </Th>
          </Tr>
        </Thead>
        <Tbody bg={"white"} >
          <SubTableEntry />
          <SubTableEntry />
          <SubTableEntry />
          <SubTableEntry />
          <SubTableEntry />
          <SubTableEntry />
        </Tbody>
      </Table>
    </>
  )
}

const SubTableEntry = () => {


  return (
    <Tr >
      <Td>
        <Flex columnGap={"17px"}>
          <Avatar></Avatar>
          <Box>
            <Text>Yash Bhardwaj</Text>
            <Text fontSize={"12px"} color={"gray.400"}>yb@yashbhardwaj.com</Text>
          </Box>
        </Flex>
      </Td>
      <Td>
        <Flex columnGap={"4px"} color={"#3173C2"} alignItems={"center"}>
          < LinkIcon />
          <Text>superteam.subs....</Text>
        </Flex>
      </Td>
      <Td>
        <Flex columnGap={"4px"} color={"#3173C2"} alignItems={"center"}>
          < LinkIcon />
          <Text>twitter.com/ybhrd..</Text>
        </Flex>
      </Td>
      <Td>
        <Flex columnGap={"4px"} alignItems={"center"}>
          <Text color={"black"}>9sJf...393</Text>
          < CopyIcon color={"gray.400"} />
        </Flex>
      </Td>
      <Td>
        @ybhrdwj
      </Td>
      <Td>
        yash#2540
      </Td>
    </Tr>
  )
}


const walletLimit = (text: string) => {
  if (text.length > 0) {
    return text.slice(0, 4) + '...' + text.slice(-3);
  }
  return 'N/A';
};
