import React from 'react'
import { Avatar, AvatarGroup, Box, Button, Flex, Text, Image, VStack, Center, Checkbox, Wrap, WrapItem } from '@chakra-ui/react';

function Grants() {
    return (
        <Flex justifyContent={"center"} position={"relative"} minH={"100vg"} w={"100%"} flexDirection={"column"} pb={"100px"} bg={"#F5F5F5"}>
            <Image w={"100%"} top={"0"} left={"0"} right={"0"} position={"absolute"} alt='' src='/assets/home/bg_grad.svg' />
            <Flex flexDirection={"column"} alignItems={"center"} mt={"107px"} mb={"80px"}>
                <Text fontFamily={"Domine"} fontSize={"36px"} fontWeight={"700"}>Need funds to build out your idea?</Text>
                <Text mt={"10px"} textAlign={"center"} fontSize={"24px"} fontWeight={"400"} w={"633.05px"}>Discover the complete list of Solana grants available to support your project.</Text>
                <Button mt={"33px"} px={"106px"} color={"white"} bg={"#6366F1"}>Get A Grant</Button>
                <Text mt={"14px"} fontSize={"14px"} color={"#64748B"}>Equity-Free • No Bullshit • Fast AF</Text>
            </Flex>
            <Center >
                <Wrap spacingX={"27px"} spacingY={"33px"} w={"1145px"}>
                    <WrapItem>
                        <GrantEntry color='#FFD8D2' icon='/assets/home/placeholder/ph4.png' />
                    </WrapItem>
                    <WrapItem>
                        <GrantEntry color='#D2FFF7' icon='/assets/home/placeholder/ph5.png' />
                    </WrapItem>
                    <WrapItem>
                        <GrantEntry color='#D2DFFF' icon='/assets/home/placeholder/ph6.png' />
                    </WrapItem>
                    <WrapItem>
                        <GrantEntry color='#F1FFD2' icon='/assets/home/placeholder/ph7.png' />
                    </WrapItem>
                    <WrapItem>
                        <GrantEntry color='#D2FFDC' icon='/assets/home/placeholder/ph4.png' />
                    </WrapItem>
                    <WrapItem>
                        <GrantEntry color='#D2F4FF' icon='/assets/home/placeholder/ph4.png' />
                    </WrapItem>
                </Wrap>
            </Center>

        </Flex >
    )
}

const GrantEntry = ({ color, icon }: { color: string, icon: string }) => {
    return (
        <Box w={"363px"}>
            <Center w={"363px"} h={"181px"} bg={color} mb={"19px"}>
                <Image alt='' src={icon} />
            </Center>
            <Text fontSize={"16px"} fontWeight={"600"} mb={"4px"}>Solana India Grants</Text>
            <Text fontSize={"14px"} color={"#64748B"} mb={"10px"}>Anim do enim excepteur. Laboris dolor ut laboris. Qui voluptate exercitation ad consectetur ipsum reprehenderit aute. </Text>
            <Flex alignItems={"center"} justifyContent={"space-between"}>
                <Text fontWeight={"600"} fontSize={"13px"} color={"#64748B"}>
                    Upto $10K
                </Text>
                <Button py={"8px"} px={"24px"} color={"#94A3B8"} bg={"transparent"} border={"1px solid #94A3B8"}>Apply</Button>
            </Flex>
        </Box >
    )
}

export default Grants