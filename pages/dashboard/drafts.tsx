import React from 'react'
import { Center, Td, Text, Th, Thead } from '@chakra-ui/react';
import Image from 'next/image';
import { useQuery as tanQuery } from '@tanstack/react-query';

import { SponsorStore } from '../../store/sponsor';

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


//utils
import { findSponsorDrafts } from '../../utils/functions';

import { AddIcon, CopyIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { BsThreeDotsVertical } from 'react-icons/bs';


//Layouts
import DashboardLayout from '../../layouts/dashboardLayout'

//components
import DashboardHeader from '../../components/dashboardHead';

function Drafts() {

    let { currentSponsor } = SponsorStore()

    const SponsorData = tanQuery({ queryKey: ['listing', currentSponsor?.orgId || ''], queryFn: ({ queryKey }) => findSponsorDrafts(queryKey[1]) })

    let drafts = SponsorData.data;

    console.log(drafts)

    return (
        <DashboardLayout>
            <Box w={"100%"} px={"2.1875rem"} py={"1.125rem"} >
                <DashboardHeader />
                <Box>
                    <Text fontWeight={"600"} fontSize={"1.25rem"}>💼 Drafts</Text>
                    <Text mt={"5px"} color={"#94A3B8"} fontSize={"1.125rem"}>Here are all the drafts made by your company</Text>
                </Box>
                <Box
                    w="100%"
                    mt={"36px"}
                    bg="white"
                    boxShadow="0px 4px 4px rgba(219, 220, 221, 0.25)"
                >
                    <Table size={'lg'} variant="simple">
                        <DraftHeader />
                        <DraftBody />
                        <DraftBody />
                        <DraftBody />
                    </Table>
                </Box>
            </Box>
        </DashboardLayout>)
}

const DraftBody = () => {
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
                        <Box w={"1rem"} height="1rem" mb={"0.1563rem"}>
                            <Image width={"100%"} height={"100%"} src={'/assets/icons/time.svg'} alt="" />
                        </Box>
                        <Text color={"#94A3B8"} fontSize={"0.75rem"} fontWeight={"600"}>30th Jun</Text>
                    </Center>
                </Td>
                <Td py={"0"}>
                    <Center columnGap={"1.5625rem"}>
                        <EditIcon color={"gray.400"} />
                        <Button
                            variant="outline"
                            leftIcon={<DeleteIcon />}
                            fontSize="0.875rem"
                            fontWeight={500}
                            padding="1rem 2rem"
                            w="9.0625rem"
                            color="gray.400"
                            h="2.25rem"

                        >
                            Delete Draft
                        </Button>

                    </Center>
                </Td>

            </Tr>
        </Tbody>
    )
}

const DraftHeader = () => {
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
                        <Text textAlign={'center'} casing={"capitalize"}></Text>
                    </Th>
                    <Th w={"1rem"}></Th>
                </Tr>
            </Thead>
        </>
    );
};





export default Drafts