import React, { useEffect, useState } from 'react';
import { Box, Flex, VStack, Text, Button, Wrap, Center, Spinner } from '@chakra-ui/react';
import { Badge } from '@chakra-ui/react'
import { Avatar } from '@chakra-ui/react';
import { Image } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons'
import TalentBio from '../../components/TalentBio'
import { icons } from 'react-icons/lib';

import { Navbar } from '../../components/navbar/navbar';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { CommunityImage } from '../../constants/index'

const ProofWork = () => {
  return (
    <Box py={"26.94px"} w={"20.0225rem"} h={"8.3575rem"} bg={"white "} borderRadius={"0.1804rem"} boxShadow='md' >
      <Flex px={"1.6238rem"} alignItems={"center"}>
        <Image alt='' mr={"24px"} w={"2rem"} h={"2rem"} src='/assets/logo/port-placeholder.svg' />
        <Box>
          <Text fontSize={"0.8413rem"} color={"gray.400"}>Form Function</Text>
          <Text fontWeight={"600"}>Build a Landing Page </Text>
        </Box>
      </Flex>
      <Flex h={"1.95rem"} px={"1.6238rem"} w={"100%"} mt={"1.8125rem"} borderTop={"1px solid #F1F5F9"} alignItems={"center"} >
        <Text fontSize={"0.7212rem"} color={"gray.400"} mr={"0.3812rem"}>Earned</Text>
        <Text fontWeight={"600"} fontSize={"0.7212rem"}>$1,500</Text>
        <ExternalLinkIcon color={"gray.400"} ml={"auto"} />
      </Flex>
    </Box >
  )
}

const LinkPreview = ({ data }: { data: powType }) => {


  const [imgUrl, setimgUrl] = useState('/assets/bg/banner.png');

  try {
    (async () => {
      let res = await axios.post(`https://earn-backend-v2-production.up.railway.app/api/v1/submission/ogimage`, {
        url: data.link
      })
      if (res) {
        if (res?.data?.data?.ogImage?.url) {
          setimgUrl(res?.data?.data?.ogImage?.url)
        }
      }
    })()
  } catch (error) {

  }

  return (
    <Box cursor={"pointer"} w={"14.75rem"} h={"11.5rem"} bg={"white"} borderRadius={'0.1875rem'} onClick={() => {
      location.href = data?.link;
    }}>
      <Image w={"100%"} h={"8.875rem"} src={imgUrl} objectFit={"contain"} />
      <Box px={"1rem"} py={"0.5625rem"}>
        <Text color={"gray.400"}>
          {data.title}
        </Text>
      </Box>
    </Box>
  )
}

const EduNft = () => {
  return (
    <Box w={"19.8344rem"} bg={"white"} borderRadius={'0.1875rem'} pt={"1.3125rem"}>
      < Image mx={"auto"} w={"16.5263rem"} h={"6.6869rem"} src='/assets/bg/success-bg.png' />
      <Box px={"1rem"} py={"0.5625rem"} borderTop={"1px solid #F1F5F9"} mt={"24px"}>
        <Text color={"gray.400"}>
          Rockstar
        </Text>
      </Box>
    </Box >
  )
}

type ChipType = {
  icon: string;
  label: string;
  value: string;
}

let Chip = ({ icon, label, value }: ChipType) => {
  return (
    <Flex>
      <Box
        w={'2rem'}
        h={'2rem'}
        bg={'#F6EBFF'}
        borderRadius="full"
        mr={'0.725rem'}
        justifyContent={'center'}
        alignItems={'center'}
        p={'0.4rem'}
      >
        <Image
          objectFit="contain"
          width={'100%'}
          height={'100%'}
          alt=""
          src={icon}
        />
      </Box>
      <Box>
        <Text fontWeight={'400'} fontSize={'0.5813rem'} color={'gray.400'}>
          {label}
        </Text>
        <Text fontWeight={'400'} fontSize={'0.775rem'}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

const Interest = ({ label, icon }: { label: string; icon: string }) => {
  return (
    <Flex alignItems={"center"} borderRadius={"1rem"} px={"0.5875rem"} py={"0.1563rem"} border={"1px solid #E2E8EF"} columnGap={"0.8844rem"}>
      <Box w={"0.7369rem"} h={"0.7369rem"}>
        <Image src={icon} alt='' width={"100%"} height={"100%"} />
      </Box>
      <Text>{label}</Text>
    </Flex>
  )
}

let colors = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];

const SkillsAndInterests = ({ data }: { data: any }) => {

  let skills = JSON.parse(data.skills);
  let interests = JSON.parse(data.interests);
  let community = JSON.parse(data.community);

  return (
    <Box
      px={'1.5625rem'}
      py={"0.625rem"}
      borderRadius={'0.6875rem'}
      bg={'white'}
      w={'20.4375rem'}
      h={'max-content'}
      pb={"1.9375rem"}
    >
      <Box py={"0.6875rem"} borderBottom={"1px solid #F1F5F9"}>
        <Chip label='Location' value={data.location} icon='/assets/talent/site.png' />
      </Box>
      <Box mt={"1rem"}>
        <Text color={"gray.400"} fontWeight={"500"}>
          Skills
        </Text>
        <Flex flexWrap={"wrap"} gap={"0.4375rem"} mt={"0.8125rem"}>
          {
            skills.map((ele: string, idx: number) => {
              return (
                <Badge key={ele} px={"0.625rem"} py={"0.2813rem"} colorScheme={colors[idx].toLocaleLowerCase()}>{ele}</Badge>
              )
            })
          }
        </Flex>
      </Box>
      <Box mt={"1rem"}>
        <Text color={"gray.400"} fontWeight={"500"}>
          Interests
        </Text>
        <Flex flexWrap={"wrap"} gap={"0.4375rem"} mt={"0.8125rem"}>
          {
            interests.map((ele: string) => {
              return (
                <Interest key={ele} label={ele} icon={`/assets/interests/${ele}.png`} />
              )
            })
          }
        </Flex>
      </Box>
      <Box mt={"1rem"}>
        <Text color={"gray.400"} fontWeight={"500"}>
          Communities
        </Text>
        <Flex flexWrap={"wrap"} gap={"0.4375rem"} >
          {
            community.map((ele: string) => {
              return (<CommunityChip label={ele} key={ele} />)
            })
          }
        </Flex>
      </Box>
    </Box>
  )
}

const CommunityChip = ({ label }: { label: string }) => {
  return (
    <Flex borderRadius={"0.3563rem"} mt={"0.8125rem"} border={"0.6px solid #E2E8EF"} w={"fit-content"} py={"5.1px"} px={"0.375rem"}>
      <Box mr={"0.6312rem"} w={"1.5625rem"} h={"1.5625rem"} borderRadius={"full"} overflow={"hidden"}>
        <Image src={CommunityImage[label]} alt='' width={"100%"} height={"100%"} />
      </Box>
      <Box>
        <Text fontSize={"0.625rem"}>
          {label}
        </Text>
        <Text color={"gray.400"} fontSize={"0.5rem"}>
          Member
        </Text>
      </Box>
    </Flex>
  )
}

const Nft = () => {
  return (
    <Box px={'1.5625rem'}
      py={"0.625rem"}
      borderRadius={'0.6875rem'}
      bg={'white'}
      w={'20.4375rem'}
      h={'max-content'}
      pb={"1.9375rem"}>
      <Text fontWeight={"500"}>
        Proof of Work NFT
      </Text>
      <Box w={"100%"} h={"auto"} pt={"1.3125rem"} >
        <Image alt='' width={"100%"} height={"100%"} src={"/assets/nft.png"} />
      </Box>

    </Box>
  )
}

interface powType {
  title: string,
  description: string,
  link: string,
  skills: string[]
}



import { useRouter } from 'next/router'
import { json } from 'stream/consumers';
import { url } from 'inspector';

function TalentProfile() {
  const router = useRouter()
  let { slug } = router.query

  let { isSuccess, data } = useQuery({
    queryKey: [slug], queryFn: () => {
      if (!slug) {
        throw new Error("slug error")
      }
      return axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/talent/find?username=${slug}`)
    }
  })

  const [pow, setpow] = useState<powType[]>([])

  useEffect(() => {
    try {
      if (data?.data.data.pow.length > 2) {
        let powData = JSON.parse(data?.data.data.pow);
        setpow(powData.map((ele: string) => JSON.parse(ele)));
      }
    } catch (error) {
      console.log(error);
    }
  }, [isSuccess])


  if (!isSuccess) {
    return <Center w={'100%'} h={"100vh"} pt={"3rem"} >
      <Spinner
        thickness='4px'
        speed='0.65s'
        emptyColor='gray.200'
        color='blue.500'
        size='xl'
      />
    </Center>
  }

  return (
    <>
      <Navbar />
      <Flex w={'100%'} h={"max-content"} pt={"3rem"} >
        <VStack
          minW={'23.875rem'}
          minH={'100vh'}
          backgroundImage={'/assets/bg/talent-bg.png'}
          py={'2.5rem'}
          rowGap={"1.125rem"}
          backgroundRepeat={"no-repeat"}
          backgroundSize={"cover "}
        >
          <TalentBio data={data?.data.data} />
          <SkillsAndInterests data={data?.data.data} />
          <Nft />
        </VStack>
        <Box w={"100%"} bg={"#F7FAFC"} px={"23px"} py={"35px"} >
          <Box borderBottom={"1px solid #E2E8EF"} mb={"18.5px"}>
            <Text fontSize={"17.94px"} fontWeight={"500"} mb={"1.0625rem"}>
              Proof of Work
            </Text>
          </Box>
          <Flex gap={"1.1425rem"} wrap={"wrap"} mb={"44px"}>
            <ProofWork />
            <ProofWork />
            <ProofWork />
            <ProofWork />
            <ProofWork />
          </Flex>
          <Box borderBottom={"1px solid #E2E8EF"} mb={"18.5px"}>
            <Text fontSize={"17.94px"} fontWeight={"500"} mb={"1.0625rem"}>
              Other Proof Work
            </Text>
          </Box>
          <Flex gap={"1.1425rem"} wrap={"wrap"} mb={"44px"}>
            {pow.map((ele, idx) => {
              return (
                <LinkPreview key={idx + 'lk'} data={ele} />
              )
            })
            }

          </Flex>
          <Box borderBottom={"1px solid #E2E8EF"} mb={"18.5px"}>
            <Text fontSize={"17.94px"} fontWeight={"500"} mb={"1.0625rem"}>
              Educational NFTs
            </Text>
          </Box>
          <Flex gap={"1.1425rem"} wrap={"wrap"} mb={"44px"} >
            <EduNft />
            <EduNft />
            <EduNft />
          </Flex>
        </Box>
      </Flex>
    </>
  );
}

export default TalentProfile;
