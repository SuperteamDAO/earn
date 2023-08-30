import { Avatar, Box, Divider, Flex, Image, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import ErrorSection from '@/components/shared/EmptySection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { PoW } from '@/interface/pow';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface TalentProps {
  slug: string;
}

function TalentProfile({ slug }: TalentProps) {
  const [talent, setTalent] = useState<User>();
  const [isloading, setIsloading] = useState<boolean>(false);
  const [error, setError] = useState(false);
  const [pow, setPow] = useState<PoW[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsloading(true);

        const res = await axios.post(`/api/user/getAllInfo`, {
          username: slug,
        });

        if (res) {
          setTalent(res?.data);
          setPow(res?.data?.PoW);
          setError(false);
          console.log(pow);
          setIsloading(false);
          console.log(res?.data);
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

  const socialLinks = [
    {
      icon: '/assets/talent/twitter.png',
      link: talent?.twitter,
    },

    {
      icon: '/assets/talent/link.png',
      link: talent?.linkedin,
    },

    {
      icon: '/assets/talent/github.png',
      link: talent?.github,
    },

    {
      icon: '/assets/talent/site.png',
      link: talent?.website,
    },
  ];

  const winnerCount =
    talent?.Submission?.filter((sub) => sub.isWinner).length ?? 0;

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
          <ErrorSection message="Sorry! The profile you are looking for is not available." />
        )}
        {!isloading && !error && !!talent?.id && (
          <>
            <Box
              w="100%"
              h={'30vh'}
              bgImage={'/assets/bg/profile-cover.png'}
              bgSize={'cover'}
              bgRepeat={'no-repeat'}
              objectFit={'cover'}
            ></Box>
            <Box
              pos={'relative'}
              top={-40}
              w={'800px'}
              h={'100vh'}
              mx="auto"
              p={7}
              bg="white"
              borderRadius={'20px'}
            >
              <Avatar
                w={'80px'}
                h={'80px'}
                name={`${talent?.firstName}${talent?.lastName}`}
                src={talent?.photo as string}
              />
              <Text
                mt={6}
                color={'brand.slate.900'}
                fontSize={'xl'}
                fontWeight={'600'}
              >
                {talent?.firstName} {talent?.lastName}
              </Text>
              <Text color={'brand.slate.500'} fontWeight={'600'}>
                @{talent?.username}
              </Text>
              <Divider my={4} />
              <Flex gap={100}>
                <Box w="50%">
                  <Text mb={4} color={'brand.slate.900'} fontWeight={500}>
                    Details
                  </Text>

                  <Text mt={3} color={'brand.slate.400'}>
                    Interested in{' '}
                    <Text as={'span'} color={'brand.slate.500'}>
                      {talent?.workPrefernce}
                    </Text>
                  </Text>
                  <Text mt={3} color={'brand.slate.400'}>
                    Works at{' '}
                    <Text as={'span'} color={'brand.slate.500'}>
                      {talent?.currentEmployer}
                    </Text>
                  </Text>
                  <Text mt={3} color={'brand.slate.400'}>
                    Based in{' '}
                    <Text as={'span'} color={'brand.slate.500'}>
                      {talent?.location}
                    </Text>
                  </Text>
                </Box>
                <Box w="50%">
                  <Text color={'brand.slate.900'} fontWeight={500}>
                    Skills
                  </Text>
                  {Array.isArray(talent.skills) ? (
                    talent.skills.map((skillItem: any, index: number) => {
                      return skillItem ? (
                        <Box key={index} mt={5}>
                          <Text
                            color={'brand.slate.400'}
                            fontSize="xs"
                            fontWeight={500}
                          >
                            {skillItem.skills.toUpperCase()}
                          </Text>
                          <Flex gap={4} mt={2}>
                            {skillItem.subskills.map(
                              (subskill: string, subIndex: number) => (
                                <Box
                                  key={subIndex}
                                  px={'12px'}
                                  py={'4px'}
                                  color={'#64739C'}
                                  fontSize={'sm'}
                                  fontWeight={500}
                                  borderRadius={'4px'}
                                  bgColor={'#EFF1F5'}
                                >
                                  {subskill}
                                </Box>
                              )
                            )}
                          </Flex>
                        </Box>
                      ) : null;
                    })
                  ) : (
                    <Text>No skills available</Text>
                  )}
                </Box>
              </Flex>
              <Divider my={4} />
              <Flex gap={100}>
                <Flex gap={6} w="50%">
                  {socialLinks.map((ele, eleIndex) => {
                    return (
                      <Box
                        key={eleIndex}
                        onClick={() => {
                          if (ele.link) {
                            window.location.href = ele.link;
                          }
                        }}
                      >
                        <Image
                          w={6}
                          h={6}
                          opacity={!ele.link ? '0.3' : ''}
                          cursor={ele.link! && 'pointer'}
                          objectFit="contain"
                          alt=""
                          filter={!ele.link ? 'grayscale(100%)' : ''}
                          src={ele.icon}
                        />
                      </Box>
                    );
                  })}
                </Flex>
                <Flex gap={8} w="50%">
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>${talent?.totalEarnedInUSD}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      Total Earned
                    </Text>
                  </Flex>
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>{talent?.Submission?.length}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      Participated
                    </Text>
                  </Flex>
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>{winnerCount}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      Won
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Box>
          </>
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
