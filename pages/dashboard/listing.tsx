import React from 'react'
import { Center, Td, Text, Th, Thead } from '@chakra-ui/react';
import Image from 'next/image';

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
import DashboardLayout from '../../layouts/dashboardLayout'

function Listing() {
    return (
        <DashboardLayout>
            <Box w={"100%"} px={"2.1875rem"} py={"1.125rem"} >
                <Flex mb={"3.125rem"} columnGap={"1rem"}>
                    <Flex px={"28px"} py={"34px"} bg={"#334254"} h={"192px"} w={"full"} borderRadius={"5px"}>
                        <Box height={"30px"} mt={"0.1rem"}>
                            <Image width="100%"
                                alt='' height="100%" src={"/assets/logo/port-placeholder.svg"}></Image>
                        </Box>
                        <Box ml={"24px"}>
                            <Text fontSize={"1.125rem"} fontWeight={"600"} color={"white "}>Port Finanace</Text>
                            <Text color={"#94A3B8"}>Here are all the listing made by your company</Text>
                            <Button mt={"1.3125rem"} bg={"#6562FF"} h={"1.6731rem"} px={"0.5669rem"} leftIcon={<AddIcon color={"white"} w={2} h={2} />}>
                                <Text color={"white"} ml={"1.875rem"} mr={"2.8125rem"} fontSize={"0.5375rem"} >Create New Listing</Text>
                            </Button>
                        </Box>
                    </Flex>
                    <Box bg={"#A3F52C"} w={"16.5625rem"} borderRadius={"7px"} px={"16px"} >
                        <Box w={"80px"} h={"65px"}>
                            <Image objectFit={'contain'} width="100%"
                                alt='' height="100%" src={"/assets/randompeople/threepeople.png"}>
                            </Image>
                        </Box>
                        <Box>
                            <Text fontWeight={"700"}>Find Talent</Text>
                            <Text lineHeight={"1.0625rem"} color={"rgba(65, 92, 24, 0.69)"} fontSize={"14px"} >Learn more about being a sponsor and accessing the best talent in Solana</Text>
                        </Box>
                        <Button bg={"white"} mt={"13px"} h={"2rem"} w={"100%"} fontSize={" 13px"} color={"grey"}>
                            Explore Directory
                        </Button>
                    </Box>

                </Flex>
                <Box>
                    <Text fontWeight={"600"} fontSize={"1.25rem"}>💼 Your Listings</Text>
                    <Text mt={"5px"} color={"#94A3B8"} fontSize={"1.125rem"}>Here are all the listing made by your company</Text>
                </Box>
                <Box
                    w="100%"
                    mt={"36px"}
                    bg="white"
                    boxShadow="0px 4px 4px rgba(219, 220, 221, 0.25)"
                >
                    <Table size={'lg'} variant="simple">
                        <ListingHeader />
                        <ListingBody />
                        <ListingBody />
                        <ListingBody />
                        <ListingBody />
                        <ListingBody />
                        <ListingBody />
                    </Table>
                </Box>
            </Box>
        </DashboardLayout >
    )
}

export const ListingHeader = () => {
    return (
        <>
            <Thead >
                <Tr>
                    <Th w={'25%'} py={"0.6875rem"}>
                        <Text casing={"capitalize"} color="gray.300" fontWeight={600} fontSize="0.875rem">
                            Name
                        </Text>
                    </Th>
                    <Th w={"10rem"}
                        color="gray.300"
                        fontWeight={600}
                        fontSize="0.875rem"
                        textAlign={'center'}

                    >
                        <Text casing={"capitalize"}>Type</Text>
                    </Th>
                    <Th
                        color="gray.300"
                        textAlign={'center'}
                        fontWeight={600}
                        fontSize="0.875rem"
                    >
                        <Text casing={"capitalize"}>Prize</Text>
                    </Th>
                    <Th color="gray.300" fontWeight={600} fontSize="0.875rem">
                        <Text textAlign={'center'} casing={"capitalize"}>Deadline</Text>
                    </Th>
                    <Th w={"9.375rem"} color="gray.300" fontWeight={600} fontSize="0.875rem">
                        <Text textAlign={'center'} casing={"capitalize"}>Winner</Text>
                    </Th>
                    <Th w={"1rem"}></Th>
                </Tr>
            </Thead>
        </>
    );
};

const ListingBody = () => {
    return (
        <Tbody h={"70px"}>
            <Tr>
                <Td py={"0"} fontSize={"1rem"} fontWeight={"600"} color={"#334254"} >
                    Landing Page Redesign
                </Td>
                <Td py={"0"}>
                    <Center fontSize={"12px"} bg={"#F7FAFC"} py={"0.3125rem"} px={"0.75rem"} color={"#94A3B8"}>
                        💰
                        Bounties
                    </Center>
                </Td >
                <Td py={"0"}>
                    <Center fontWeight={"600"} fontSize={"0.75rem"}>
                        <Text mr={"0.395rem"} color={"#94A3B8"}>$</Text>
                        <Text mr={"0.1875rem"} color={"#334254"}>
                            10,000
                        </Text>
                        <Text color={"#94A3B8"}>USD</Text>
                    </Center>
                </Td>
                <Td py={"0"}>
                    <Center alignItems={"center"} columnGap="0.9688rem">
                        <Box w={"1rem"} height="1rem">
                            <Image width={"100%"} height={"100%"} src={'/assets/icons/time.svg'} alt="" />
                        </Box>
                        <Text color={"#94A3B8"} fontSize={"0.75rem"} fontWeight={"600"}>30th Jun</Text>
                    </Center>
                </Td>
                <Td py={"0"}>
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

                        >
                            Select Winner
                        </Button>

                    </Center>
                </Td>
                <Td py={"0"}>
                    <Flex justify={'center'} align={'center'}>
                        <Menu>
                            <MenuButton
                                h="4rem"
                                as={IconButton}
                                aria-label="Options"
                                icon={<BsThreeDotsVertical color='#DADADA' fontSize={'1.5rem'} />}
                                variant="unstyled"

                            />

                            <MenuList
                                bg={'white'}
                                fontWeight={600}
                                color="gray.600"
                                py={"0"}
                            >
                                <MenuItem
                                    as={Button}
                                    justifyContent={'start'}
                                    px={"1.125rem"}
                                    bg={'white'}
                                >
                                    <Flex justify={'start'} gap={"0.3125rem"} align={'center'}>
                                        <Image height={"15%"} width={"15%"} src={'/assets/icons/delete.svg'} alt={'delete icon'} />
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
    )
}

export default Listing