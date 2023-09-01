import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  Image,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import { AddProject } from '@/components/Form/AddProject';
import PowCard from '@/components/ProfileFeed/powCard';
import SubmissionCard from '@/components/ProfileFeed/submissionCard';
import ErrorSection from '@/components/shared/EmptySection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { PoW } from '@/interface/pow';
import type { SubmissionWithUser } from '@/interface/submission';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface TalentProps {
  slug: string;
}

function TalentProfile({ slug }: TalentProps) {
  const [talent, setTalent] = useState<User>();
  const [isloading, setIsloading] = useState<boolean>(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'projects'>(
    'activity'
  );
  const { userInfo } = userStore();

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsloading(true);
        const res = await axios.post(`/api/user/getAllInfo`, {
          username: slug,
        });

        if (res) {
          setTalent(res?.data);
          setError(false);
          setIsloading(false);
          console.log(res?.data);
        }
      } catch (err) {
        console.log(err);
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

  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/t/${talent?.username}/edit`);
  };

  const combinedAndSortedFeed = useMemo(() => {
    const submissions = talent?.Submission ?? [];
    const pows = talent?.PoW ?? [];
    const typedSubmissions = submissions.map((s) => ({
      ...s,
      type: 'submission',
    }));
    const typedPows = pows.map((p) => ({ ...p, type: 'pow' }));

    return [...typedSubmissions, ...typedPows].sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();

      return dateB - dateA;
    });
  }, [talent]);

  const filteredFeed = useMemo(() => {
    if (activeTab === 'activity') {
      return combinedAndSortedFeed;
    }

    return combinedAndSortedFeed.filter((item) => item.type === 'pow');
  }, [activeTab, combinedAndSortedFeed]);

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
          <Box bg="white">
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
              w={'700px'}
              mx="auto"
              p={7}
              bg="white"
              borderRadius={'20px'}
            >
              <Flex justify={'space-between'}>
                <Box>
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
                </Box>
                <Flex direction={'column'} gap={3} w="160px">
                  {userInfo?.id === talent?.id ? (
                    <Button
                      color={'#6366F1'}
                      fontSize={'sm'}
                      fontWeight={500}
                      bg={'#EDE9FE'}
                      onClick={handleEditProfileClick}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      color={'#6366F1'}
                      fontSize={'sm'}
                      fontWeight={500}
                      bg={'#EDE9FE'}
                    >
                      Reach Out
                    </Button>
                  )}
                  <Button
                    color={'brand.slate.500'}
                    fontSize={'sm'}
                    fontWeight={500}
                    bg="white"
                    borderColor={'brand.slate.400'}
                    variant={'outline'}
                  >
                    Share
                  </Button>
                </Flex>
              </Flex>
              <Divider my={4} />
              <Flex gap={100}>
                <Box w="50%">
                  <Text mb={4} color={'brand.slate.900'} fontWeight={500}>
                    Details
                  </Text>
                  {talent?.workPrefernce !== 'Not looking for Work' && (
                    <Text mt={3} color={'brand.slate.400'}>
                      Interested in{' '}
                      <Text as={'span'} color={'brand.slate.500'}>
                        {talent?.workPrefernce}
                      </Text>
                    </Text>
                  )}
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
                        <Box key={index} mt={4}>
                          <Text
                            color={'brand.slate.400'}
                            fontSize="xs"
                            fontWeight={500}
                          >
                            {skillItem.skills.toUpperCase()}
                          </Text>
                          <Flex wrap={'wrap'} gap={4} mt={2}>
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
                <Flex gap={6} w="50%">
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
              <Box mt={'16'}>
                <Flex align={'center'} justify={'space-between'}>
                  <Flex align="center" gap={3}>
                    <Text color={'brand.slate.900'} fontWeight={500}>
                      Proof of Work
                    </Text>
                    <Button
                      color={'brand.slate.400'}
                      fontSize="sm"
                      fontWeight={600}
                      onClick={onOpen}
                      size="xs"
                      variant={'ghost'}
                    >
                      +ADD
                    </Button>
                  </Flex>
                  <Flex gap={4}>
                    <Text
                      color={
                        activeTab === 'activity'
                          ? 'brand.slate.900'
                          : 'brand.slate.400'
                      }
                      fontWeight={500}
                      cursor="pointer"
                      onClick={() => setActiveTab('activity')}
                    >
                      Activity Feed
                    </Text>
                    <Text
                      color={
                        activeTab === 'projects'
                          ? 'brand.slate.900'
                          : 'brand.slate.400'
                      }
                      fontWeight={500}
                      cursor="pointer"
                      onClick={() => setActiveTab('projects')}
                    >
                      Personal Projects
                    </Text>
                  </Flex>
                </Flex>
              </Box>
              <Divider my={4} />
              <Box>
                {filteredFeed.map((item, index) => {
                  if (item.type === 'submission') {
                    return (
                      <SubmissionCard
                        key={index}
                        sub={item as SubmissionWithUser}
                        talent={talent}
                      />
                    );
                  }
                  if (item.type === 'pow') {
                    return (
                      <PowCard key={index} pow={item as PoW} talent={talent} />
                    );
                  }
                  return null;
                })}
              </Box>
            </Box>
          </Box>
        )}
        <AddProject
          {...{
            isOpen,
            onClose,
            upload: true,
          }}
        />
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
