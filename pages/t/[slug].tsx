import { ExternalLinkIcon, LockIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { User } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import ErrorSection from '@/components/shared/EmptySection';
import LoadingSection from '@/components/shared/LoadingSection';
import TalentBio from '@/components/TalentBio';
import type { Skills } from '@/interface/skills';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { skillMap } from '@/utils/constants';

interface TalentProps {
  slug: string;
}

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

const LinkPreview = ({
  data,
}: {
  data: {
    title: string;
    link: string;
    description: string;
  };
}) => {
  return (
    <>
      <Link href={data?.link} isExternal>
        <Box
          w={'14.75rem'}
          h={'11.5rem'}
          bg={'white'}
          borderRadius={'0.1875rem'}
          cursor={'pointer'}
        >
          <Image
            w={'100%'}
            h={'8.875rem'}
            objectFit={'contain'}
            alt=""
            src={
              data.link.includes('github')
                ? '/assets/otherpow/github.svg'
                : '/assets/otherpow/link.svg'
            }
          />
          <Box px={'1rem'} py={'0.5625rem'}>
            <Text color={'gray.600'}>{data.title}</Text>
          </Box>
        </Box>
      </Link>
    </>
  );
};

export const EduNft = ({ nfts }: { nfts: NFT[] }) => {
  return (
    <>
      {nfts && nfts.length > 0 && (
        <Grid w={'90%'}>
          <Box mt="32px" borderBottom={''}>
            <Text fontSize={'xl'} fontWeight={500}>
              Education NFTs
            </Text>
          </Box>
          <Box my={6}>
            <Grid
              gap={6}
              templateColumns={{
                sm: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              }}
            >
              {nfts.map((item, key) => (
                <GridItem key={key} mb="20px" colSpan={1}>
                  <Flex
                    justify="space-between"
                    direction="column"
                    h="100%"
                    py={10}
                    bg="gray.100"
                  >
                    <Flex
                      align="center"
                      justify="center"
                      overflow="hidden"
                      w="60%"
                      h="100%"
                      mx={'auto'}
                    >
                      <img src={item.imageUrl} alt={item.collectionName} />
                    </Flex>
                  </Flex>
                  <Text mt="4px" color="gray.500" fontSize="14px">
                    {item.collectionName} - {item.description}
                  </Text>
                </GridItem>
              ))}
            </Grid>
          </Box>
        </Grid>
      )}
    </>
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

// const Interest = ({ label, icon }: { label: string; icon: string }) => {
//   return (
//     <Flex
//       align={'center'}
//       gap={3}
//       px={2}
//       py={1}
//       border={'1px solid'}
//       borderColor={'gray.200'}
//       borderRadius={'1rem'}
//     >
//       <Box>
//         <Image w={5} h={5} alt="emoji" src={icon} />
//       </Box>
//       <Text>{label}</Text>
//     </Flex>
//   );
// };

// const colors = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];

// const CommunityChip = ({ label }: { label: string }) => {
//   return (
//     <Flex
//       w={'fit-content'}
//       mt={'0.8125rem'}
//       px={'0.375rem'}
//       py={'5.1px'}
//       border={'0.6px solid #E2E8EF'}
//       borderRadius={'0.3563rem'}
//     >
//       <Box
//         overflow={'hidden'}
//         w={'1.5625rem'}
//         h={'1.5625rem'}
//         mr={'0.6312rem'}
//         borderRadius={'full'}
//       >
//         <Image w={'100%'} h={'100%'} alt="" src={CommunityImage[label]} />
//       </Box>
//       <Box>
//         <Text fontSize={'0.625rem'}>{label}</Text>
//         <Text color={'gray.400'} fontSize={'0.5rem'}>
//           Member
//         </Text>
//       </Box>
//     </Flex>
//   );
// };

const SkillsAndInterests = ({
  location,
  skills,
  interests,
}: {
  location: string;
  skills: Skills;
  interests: string[];
}) => {
  return (
    <>
      <Box w={'80%'} h={'max-content'} p={4} bg={'white'} borderRadius={10}>
        <Chip
          label="Location"
          value={location}
          icon="/assets/talent/site.png"
        />
        <Box mt={'1rem'}>
          <Text color={'gray.400'} fontWeight={'500'}>
            Skills
          </Text>
          <Flex wrap={'wrap'} gap={'0.4375rem'} mt={'0.8125rem'}>
            {skills.map((ele, idx: number) => {
              return (
                <>
                  <Badge
                    key={idx}
                    px={2}
                    py={1}
                    color={
                      skillMap.find((item) => item.mainskill === ele.skills)
                        ?.color
                    }
                    bg={`${
                      skillMap.find((item) => item.mainskill === ele.skills)
                        ?.color
                    }1A`}
                    rounded={4}
                  >
                    {ele.skills}
                  </Badge>
                </>
              );
            })}
          </Flex>
        </Box>
        {interests.length > 0 && (
          <Box mt={'1rem'}>
            <Text color={'gray.400'} fontWeight={'500'}>
              Interests
            </Text>
            <Flex wrap={'wrap'} gap={2} mt={4}>
              {interests.map((ele: string) => {
                return <>{ele}</>;
              })}
            </Flex>
          </Box>
        )}
      </Box>
    </>
  );
};

const Nft = ({
  wallet,
  totalEarned,
}: {
  wallet: string;
  totalEarned: number;
}) => {
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
          filter={totalEarned !== 0 ? 'none' : 'blur(7px)'}
          src={
            totalEarned !== 0
              ? `https://searn-nft-dev.s3.ap-south-1.amazonaws.com/${wallet}.png`
              : '/assets/nft.png'
          }
        />
        <Button
          pos={'absolute'}
          display={totalEarned !== 0 ? 'none' : 'block'}
          leftIcon={<LockIcon />}
        >
          {totalEarned === 0 ? 'Locked' : 'Claim NFT'}
        </Button>
      </Box>
    </Box>
  );
};
type NFT = {
  collectionName: string;
  collectionAddress: string;
  description: string;
  name: string;
  imageUrl: string;
  creators: any[];
};
function TalentProfile({ slug }: TalentProps) {
  const [talent, setTalent] = useState<User>();
  const [isloading, setIsloading] = useState<boolean>(false);
  const [error, setError] = useState(false);
  const [nfts, setNFTs] = useState<NFT[]>();
  const getNFTs = async (wallet: string) => {
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method: 'qn_fetchNFTs',
      params: {
        wallet,
        omitFields: ['provenance', 'traits'],
        page: 1,
        perPage: 40,
      },
    };

    const url = process.env.NEXT_PUBLIC_NFT_API as string;

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    return result.json();
  };

  const fetchNFTs = async (address: string) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const nfts: any = await getNFTs(address);
    const resultNfts = nfts.result.assets.filter((item: NFT) => {
      return (
        item.collectionAddress ===
        'C9G3cZMXjoydy1KrSbEfLw5NNyuK3Lmc33WEgTCtKWuV'
      );
    });

    setNFTs(resultNfts);
  };
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsloading(true);

        const res = await axios.post(`/api/user`, {
          username: slug,
        });

        if (res) {
          setTalent(res?.data);
          setError(false);
          setIsloading(false);
          // console.log(JSON.parse(JSON.parse(res?.data?.pow)[0]));

          fetchNFTs(res?.data?.publicKey as string);
        }
        // eslint-disable-next-line @typescript-eslint/no-shadow
      } catch (error) {
        console.log(error);
        setError(true);
        setIsloading(false);
      }
    };
    fetch();
  }, []);

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
        {isloading && <LoadingSection />}
        {!isloading && !!error && <ErrorSection />}
        {!isloading && !error && !talent?.id && (
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isloading && !error && !!talent?.id && (
          <Flex direction={['column', 'column', 'column', 'row']} w={'100%'}>
            <VStack
              rowGap={4}
              maxW={['full', 'full', 'full', 'full']}
              minH={'100vh'}
              py={8}
              bgImage={'/assets/bg/talent-bg.png'}
              bgSize={'cover '}
              bgRepeat={'no-repeat'}
            >
              <TalentBio user={talent as User} successPage={false} />
              <SkillsAndInterests
                location={talent?.location as string}
                skills={talent?.skills as Skills}
                interests={
                  talent?.interests?.startsWith('[')
                    ? JSON.parse(talent?.interests!)
                    : []
                }
              />
              <Nft
                totalEarned={talent?.totalEarnedInUSD ?? 0}
                wallet={talent?.publicKey as string}
              />
            </VStack>
            <Box
              alignItems={'start'}
              justifyContent={'start'}
              flexDir={'column'}
              gap={5}
              display={'flex'}
              w={'full'}
              px={'23px'}
              py={'35px'}
              bg={'#F7FAFC'}
            >
              {talent?.pow?.length! > 0 && talent.pow?.startsWith('[') && (
                <>
                  <Box
                    w="full"
                    h="max"
                    pb={3}
                    borderBottom={'1px solid'}
                    borderBottomColor={'gray.200'}
                  >
                    <Text fontSize="md" fontWeight={'500'}>
                      Other Proof Work
                    </Text>
                  </Box>
                  <Flex align="start" wrap={'wrap'} gap={10}>
                    {JSON.parse(talent?.pow!).map(
                      (ele: string, idx: number) => {
                        const { title, link, description } = JSON.parse(ele);
                        return (
                          <LinkPreview
                            key={`${idx}lk`}
                            data={{
                              description,
                              link,
                              title,
                            }}
                          />
                        );
                      }
                    )}
                  </Flex>
                </>
              )}
              <EduNft nfts={nfts ?? []} />
            </Box>

            <Box
              alignItems={'start'}
              justifyContent={'center'}
              display={talent?.pow?.length !== 0 ? 'none' : 'flex'}
              w={'100%'}
              pt={'10rem'}
            >
              <Image
                w={32}
                alt={'talent empty'}
                src="/assets/bg/talent-empty.svg"
              />
            </Box>
          </Flex>
        )}
      </Default>
    </>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
export default TalentProfile;
