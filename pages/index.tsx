import { Avatar, AvatarGroup, Box, Button, Flex, Text, Image, Center } from '@chakra-ui/react';
import type { NextPage } from 'next';
import { Navbar } from '../components/navbar/navbar';

import { BellIcon } from '@chakra-ui/icons'

//components
import Banner from '../components/home/Banner';
import SideBar from '../components/home/SideBar';

import { Children } from 'react';


let slate = "#1E293B"

const Home: NextPage = () => {
  return (
    <>
      <Navbar />
      <Flex w={"100%"} h={"max-content"} minH={"100vh"} bg={"white"} pt={'3.5rem'} justifyContent={"center"} >
        <Box>
          <Banner />
          <CategoryBanner />
          <Box mt={"32px"}>
            <ListingSection
              title='Active Bounties'
              sub='Bite sized tasks for freelancers'
              emoji='/assets/home/emojis/moneyman.png' >
              <Bounties />
              <Bounties />
              <Bounties />
              <Bounties />
              <Bounties />
            </ListingSection >
            <ListingSection
              title='Jobs'
              sub='Join a high-growth team'
              emoji='/assets/home/emojis/job.png' >
              <Jobs />
              <Jobs />
              <Jobs />
              <Jobs />
              <Jobs />
            </ListingSection >
            <ListingSection
              title='Grants'
              sub='Equity-free funding opportunities for builders'
              emoji='/assets/home/emojis/grants.png' >
              <Grants />
              <Grants />
              <Grants />
              <Grants />
              <Grants />
            </ListingSection >
          </Box>
        </Box>
        <SideBar />
      </Flex>
    </>
  );
};

export default Home;

type ListingSectionProps = {
  children?: React.ReactNode;
  title: string;
  sub: string;
  emoji: string;
}

const ListingSection = ({ children, title, sub, emoji }: ListingSectionProps) => {
  return (
    <Box w={"737px"} mt={"1rem"} mb={"45px"}>
      <Flex borderBottom={"1px solid #E2E8F0"} pb={"12px"} mb={"14px"}>
        <Image mr={"12px"} alt='' src={emoji} />
        <Text color={"#334155"} fontWeight={"600"}>{title}</Text>
        <Text color={"#CBD5E1"} mx={"10px"}>|</Text>
        <Text color={"#64748B"}>{sub}</Text>
      </Flex>
      <Flex direction={"column"} rowGap={"42px"}>
        {children}
      </Flex>
    </Box >
  )
}

const Bounties = () => {
  return (
    <Flex w={"738px"} h={"63px"}>
      <Image mr={"22px"} rounded={"md"} src={'/assets/home/placeholder/ph1.png'} w={"63px"} h={"63px"} alt={""} />
      <Flex direction={"column"} justifyContent={"space-between"}>
        <Text fontWeight={"600"} color={"#334155"} fontSize={"16px"}>Redesign Gum’s Homepage</Text>
        <Text fontWeight={"400"} color={"#64748B"} fontSize={"14px"}>We’re looking to design gum’s landing page from a....</Text>
        <Flex alignItems={"center"}>
          <Image mr={"3.15px"} w={"13px"} h={"13px"} alt='' src='/assets/landingsponsor/icons/usdc.svg' />
          <Text color={"#334155"} fontWeight={"600"} fontSize={"13px"}>$3,000</Text>
          <Text color={"#CBD5E1"} mx={"8px"} fontSize={"12px"}>|</Text>
          <Text color={"#64748B"} fontSize={"12px"}>Due in 3 Days</Text>
        </Flex>
      </Flex>
      <Button ml={"auto"} py={"8px"} px={"24px"} color={"#94A3B8"} bg={"transparent"} border={"1px solid #94A3B8"} >Apply</Button >
    </Flex >
  )
}

const Jobs = () => {
  return (
    <Flex w={"738px"} h={"63px"}>
      <Image mr={"22px"} rounded={"md"} src={'/assets/home/placeholder/ph2.png'} w={"63px"} h={"63px"} alt={""} />
      <Flex direction={"column"} justifyContent={"space-between"}>
        <Text fontWeight={"600"} color={"#334155"} fontSize={"16px"}>Redesign Gum’s Homepage</Text>
        <Text fontWeight={"400"} color={"#64748B"} fontSize={"14px"} >We’re looking to design gum’s landing page from a....</Text>
        <Flex alignItems={"center"}>
          <Image mr={"3.15px"} h={"14px"} w={"14px"} alt='' src='/assets/icons/dollar.svg' />
          <Text color={"#64748B"} fontSize={"12px"} mr={"11px"}>$100k-120k</Text>
          <Text color={"#64748B"} fontSize={"12px"} mr={"11px"}>0.02% Equity</Text>
          <Text color={"#64748B"} fontSize={"12px"} mr={"11px"}>Javascript</Text>
          <Text color={"#64748B"} fontSize={"12px"} mr={"11px"}>Fullstack</Text>
          <Text color={"#64748B"} fontSize={"12px"} mr={"11px"}>Front-end</Text>
        </Flex>
      </Flex>
      <Button ml={"auto"} py={"8px"} px={"24px"} color={"#94A3B8"} bg={"transparent"} border={"1px solid #94A3B8"} >Apply</Button >
    </Flex >
  )
}

const Grants = () => {
  return (
    <Flex w={"738px"} h={"63px"}>
      <Image mr={"22px"} rounded={"md"} src={'/assets/home/placeholder/ph3.png'} w={"63px"} h={"63px"} alt={""} />
      <Flex direction={"column"} justifyContent={"space-between"}>
        <Text fontWeight={"600"} color={"#334155"} fontSize={"16px"}>Redesign Gum’s Homepage</Text>
        <Text fontWeight={"400"} color={"#64748B"} fontSize={"14px"} >We’re looking to design gum’s landing page from a....</Text>
        <Flex alignItems={"center"}>
          <Image mr={"3.15px"} h={"14px"} w={"14px"} alt='' src='/assets/icons/dollar.svg' />
          <Text color={"#64748B"} fontSize={"12px"} mr={"11px"}>$100k-120k</Text>
        </Flex>
      </Flex>
      <Button ml={"auto"} py={"8px"} px={"24px"} color={"#94A3B8"} bg={"transparent"} border={"1px solid #94A3B8"} >Apply</Button >
    </Flex >
  )
}

const CategoryBanner = () => {
  return (
    <Flex p={"24px"} rounded={"lg"} backgroundSize={"contain"} w={"737px"} h={"118px"} mt={"25px"} bg={"url('/assets/home/display/bg_frontend.png')"}>
      <Center mr={"17px"} bg={"#FEA8EB"} w={"59px"} h={"59px"} rounded={"md"}>
        <Image src='/assets/home/category/frontend.png' />
      </Center>
      <Box w={"60%"}>
        <Text fontWeight={"700"} fontFamily={"Domine"}>
          Frontend Development
        </Text>
        <Text fontSize={"14px"} color={"#64748B"}>
          If you are a pixel-perfectionist who creates interfaces that users love, check out the earning opportunities below.
        </Text>
      </Box>
      <Button ml={"auto"} my={"auto"} px={"16px"} fontWeight={"300"} border={"1px solid #CBD5E1"} color={"#94A3B8"} leftIcon={<BellIcon />} bg={"white"} variant='solid'>
        Notify Me
      </Button>
    </Flex>
  )
} 