import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import TalentBio from '../../components/TalentBio';
import { CommunityImage } from '../../constants/index';

export const ProofWork = () => {
  return (
    <Box
      w={'20.0225rem'}
      h={'8.3575rem'}
      py={'26.94px'}
      bg={'white '}
      borderRadius={'0.1804rem'}
      shadow="md"
    >
      <Flex align={'center'} px={'1.6238rem'}>
        <Image
          w={'2rem'}
          h={'2rem'}
          mr={'24px'}
          alt=""
          src="/assets/logo/port-placeholder.svg"
        />
        <Box>
          <Text color={'gray.400'} fontSize={'0.8413rem'}>
            Form Function
          </Text>
          <Text fontWeight={'600'}>Build a Landing Page </Text>
        </Box>
      </Flex>
      <Flex
        align={'center'}
        w={'100%'}
        h={'1.95rem'}
        mt={'1.8125rem'}
        px={'1.6238rem'}
        borderTop={'1px solid #F1F5F9'}
      >
        <Text mr={'0.3812rem'} color={'gray.400'} fontSize={'0.7212rem'}>
          Earned
        </Text>
        <Text fontSize={'0.7212rem'} fontWeight={'600'}>
          $1,500
        </Text>
        <ExternalLinkIcon color={'gray.400'} ml={'auto'} />
      </Flex>
    </Box>
  );
};

const LinkPreview = ({ data }: { data: PowType }) => {
  const [imgUrl, setimgUrl] = useState('/assets/bg/banner.png');

  try {
    (async () => {
      const res = await axios.post(
        `https://earn-backend-v2-production.up.railway.app/api/v1/submission/ogimage`,
        {
          url: data.link,
        }
      );
      if (res) {
        if (res?.data?.data?.ogImage?.url) {
          setimgUrl(res?.data?.data?.ogImage?.url);
        }
      }
    })();
  } catch (error) {
    console.log('file: [slug].tsx:84 ~ LinkPreview ~ error:', error);
  }

  return (
    <Box
      w={'14.75rem'}
      h={'11.5rem'}
      bg={'white'}
      borderRadius={'0.1875rem'}
      cursor={'pointer'}
      onClick={() => {
        window.location.href = data?.link;
      }}
    >
      <Image
        w={'100%'}
        h={'8.875rem'}
        objectFit={'contain'}
        alt=""
        src={imgUrl}
      />
      <Box px={'1rem'} py={'0.5625rem'}>
        <Text color={'gray.400'}>{data.title}</Text>
      </Box>
    </Box>
  );
};

export const EduNft = () => {
  return (
    <Box
      w={'19.8344rem'}
      pt={'1.3125rem'}
      bg={'white'}
      borderRadius={'0.1875rem'}
    >
      <Image
        w={'16.5263rem'}
        h={'6.6869rem'}
        mx={'auto'}
        alt="Image"
        src="/assets/bg/success-bg.png"
      />
      <Box
        mt={'24px'}
        px={'1rem'}
        py={'0.5625rem'}
        borderTop={'1px solid #F1F5F9'}
      >
        <Text color={'gray.400'}>Rockstar</Text>
      </Box>
    </Box>
  );
};

type ChipType = {
  icon: string;
  label: string;
  value: string;
};

const Chip = ({ icon, label, value }: ChipType) => {
  return (
    <Flex>
      <Box
        alignItems={'center'}
        justifyContent={'center'}
        w={'2rem'}
        h={'2rem'}
        mr={'0.725rem'}
        p={'0.4rem'}
        bg={'#F6EBFF'}
        borderRadius="full"
      >
        <Image w={'100%'} h={'100%'} objectFit="contain" alt="" src={icon} />
      </Box>
      <Box>
        <Text color={'gray.400'} fontSize={'0.5813rem'} fontWeight={'400'}>
          {label}
        </Text>
        <Text fontSize={'0.775rem'} fontWeight={'400'}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

const Interest = ({ label, icon }: { label: string; icon: string }) => {
  return (
    <Flex
      align={'center'}
      gap={3}
      px={2}
      py={1}
      border={'1px solid'}
      borderColor={'gray.200'}
      borderRadius={'1rem'}
    >
      <Box>
        <Image w={5} h={5} alt="emoji" src={icon} />
      </Box>
      <Text>{label}</Text>
    </Flex>
  );
};

const colors = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];

const CommunityChip = ({ label }: { label: string }) => {
  return (
    <Flex
      w={'fit-content'}
      mt={'0.8125rem'}
      px={'0.375rem'}
      py={'5.1px'}
      border={'0.6px solid #E2E8EF'}
      borderRadius={'0.3563rem'}
    >
      <Box
        overflow={'hidden'}
        w={'1.5625rem'}
        h={'1.5625rem'}
        mr={'0.6312rem'}
        borderRadius={'full'}
      >
        <Image w={'100%'} h={'100%'} alt="" src={CommunityImage[label]} />
      </Box>
      <Box>
        <Text fontSize={'0.625rem'}>{label}</Text>
        <Text color={'gray.400'} fontSize={'0.5rem'}>
          Member
        </Text>
      </Box>
    </Flex>
  );
};

const SkillsAndInterests = ({ data }: { data: any }) => {
  const skills = JSON.parse(data.skills);
  const interests = JSON.parse(data.interests);
  const community = JSON.parse(data.community);

  return (
    <Box w={'80%'} h={'max-content'} p={4} bg={'white'} borderRadius={10}>
      <Box py={2} borderBottom={'1px solid'} borderBottomColor={'gray.200'}>
        <Chip
          label="Location"
          value={data.location}
          icon="/assets/talent/site.png"
        />
      </Box>
      <Box mt={'1rem'}>
        <Text color={'gray.400'} fontWeight={'500'}>
          Skills
        </Text>
        <Flex wrap={'wrap'} gap={'0.4375rem'} mt={'0.8125rem'}>
          {skills.map((ele: string, idx: number) => {
            return (
              <Badge
                key={ele}
                px={2}
                py={1}
                colorScheme={colors[idx]?.toLocaleLowerCase()}
                rounded={4}
              >
                {ele.replaceAll('-Dev', '')}
              </Badge>
            );
          })}
        </Flex>
      </Box>
      <Box mt={'1rem'}>
        <Text color={'gray.400'} fontWeight={'500'}>
          Interests
        </Text>
        <Flex wrap={'wrap'} gap={2} mt={4}>
          {interests.map((ele: string) => {
            return (
              <Interest
                key={ele}
                label={ele}
                icon={`/assets/interests/${ele}.png`}
              />
            );
          })}
        </Flex>
      </Box>
      {community.length > 0 && (
        <Box mt={10}>
          <Text color={'gray.400'} fontWeight={'500'}>
            Communities
          </Text>
          <Flex wrap={'wrap'} gap={'0.4375rem'}>
            {community.map((ele: string) => {
              return <CommunityChip label={ele} key={ele} />;
            })}
          </Flex>
        </Box>
      )}
    </Box>
  );
};

const Nft = ({ wallet }: { wallet: string }) => {
  const [generate, setGenrate] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (wallet) {
        try {
          await axios.post(
            `https://searn-nft-dev.s3.ap-south-1.amazonaws.com/s.png`
          );
          setGenrate(false);
        } catch (error) {
          setGenrate(true);
          console.log(error);
        }
      }
    };
    fetch();
  }, []);
  return (
    <Box
      w={'80%'}
      h={'max-content'}
      p={4}
      bg={'white'}
      borderRadius={'0.6875rem'}
    >
      <Text fontWeight={'500'}>Proof of Work NFT</Text>
      <Box
        zIndex={100}
        alignItems={'center'}
        justifyContent={'center'}
        display={'flex'}
        w={'100%'}
        h={'auto'}
        pt={4}
      >
        <Image
          w={'100%'}
          h={'100%'}
          alt="NFT"
          filter={generate ? 'none' : 'blur(7px)'}
          src={
            generate
              ? `https://searn-nft-dev.s3.ap-south-1.amazonaws.com/${wallet}.png`
              : '/assets/nft.png'
          }
        />
        <Button pos={'absolute'} display={generate ? 'none' : 'block'}>
          Claim NFT
        </Button>
      </Box>
    </Box>
  );
};

interface PowType {
  title: string;
  description: string;
  link: string;
  skills: string[];
}

function TalentProfile() {
  const router = useRouter();
  const { slug } = router.query;

  const { isSuccess, data } = useQuery({
    queryKey: [slug],
    queryFn: () => {
      if (!slug) {
        throw new Error('slug error');
      }
      return axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/talent/find?username=${slug}`
      );
    },
  });

  const [pow, setpow] = useState<PowType[]>([]);

  useEffect(() => {
    try {
      if (data?.data.data.pow.length > 2) {
        const powData = JSON.parse(data?.data.data.pow);
        setpow(powData.map((ele: string) => JSON.parse(ele)));
      }
    } catch (error) {
      console.log(error);
    }
  }, [isSuccess]);

  if (!isSuccess) {
    return (
      <Center w={'100%'} h={'100vh'} pt={'3rem'}>
        <Spinner
          color="blue.500"
          emptyColor="gray.200"
          size="xl"
          speed="0.65s"
          thickness="4px"
        />
      </Center>
    );
  }

  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
            canonical="/assets/logo/og.svg"
          />
        }
      >
        <Flex direction={['column', 'column', 'column', 'row']} w={'100%'}>
          <VStack
            rowGap={4}
            maxW={['full', 'full', '40%', '25%']}
            minH={'100vh'}
            py={8}
            bgImage={'/assets/bg/talent-bg.png'}
            bgSize={'cover '}
            bgRepeat={'no-repeat'}
          >
            <TalentBio data={data?.data.data} />
            <SkillsAndInterests data={data?.data.data} />
            <Nft wallet={data?.data?.data.publickey} />
          </VStack>
          <Box
            justifyContent={'center'}
            display={'flex'}
            w={'100%'}
            px={'23px'}
            py={'35px'}
            bg={'#F7FAFC'}
          >
            {pow.length > 0 && (
              <Box mb={'18.5px'} borderBottom={'1px solid #E2E8EF'}>
                <Text mb={'1.0625rem'} fontSize={'17.94px'} fontWeight={'500'}>
                  Other Proof Work
                </Text>
              </Box>
            )}
            <Flex wrap={'wrap'} gap={'1.1425rem'} mb={'44px'}>
              {pow.map((ele, idx) => {
                return <LinkPreview key={`${idx}lk`} data={ele} />;
              })}
            </Flex>
          </Box>
        </Flex>
      </Default>
    </>
  );
}

export default TalentProfile;
