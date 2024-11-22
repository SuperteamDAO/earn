import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  EmailIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  IconButton,
  Image,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { EmptySection } from '@/components/shared/EmptySection';
import { ShareIcon } from '@/components/shared/shareIcon';
import { type FeedDataProps, FeedLoop, useGetFeed } from '@/features/feed';
import {
  AddProject,
  EarnAvatar,
  GitHub,
  Linkedin,
  ShareProfile,
  Twitter,
  Website,
} from '@/features/talent';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

type UserWithFeed = User & {
  feed: FeedDataProps[];
};
interface TalentProps {
  talent: UserWithFeed;
  stats: {
    wins: number;
    participations: number;
    totalWinnings: number;
  };
}

function TalentProfile({ talent, stats }: TalentProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'projects'>(
    'activity',
  );
  const [randomIndex, setRandomIndex] = useState<number>(0);
  const [showSubskills, setShowSubskills] = useState<Record<number, boolean>>(
    {},
  );

  const { ref, inView } = useInView();
  const {
    data: feed,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetFeed({
    filter: 'new',
    timePeriod: '',
    isWinner: false,
    take: 15,
    userId: talent.id,
    takeOnlyType: activeTab === 'activity' ? undefined : 'pow',
  });

  useEffect(() => {
    refetch();
  }, [activeTab]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleToggleSubskills = (index: number) => {
    setShowSubskills({
      ...showSubskills,
      [index]: !showSubskills[index],
    });
  };
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (user?.id && talent?.id && user.id !== talent?.id)
      posthog.capture('clicked profile_talent');
  }, [talent]);

  const {
    isOpen: isOpenPow,
    onOpen: onOpenPow,
    onClose: onClosePow,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgImages = ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp'];

  useEffect(() => {
    setRandomIndex(Math.floor(Math.random() * bgImages.length));
  }, []);

  const socialLinks = [
    { Icon: Twitter, link: talent?.twitter },
    { Icon: Linkedin, link: talent?.linkedin },
    { Icon: GitHub, link: talent?.github },
    { Icon: Website, link: talent?.website },
  ];

  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/t/${talent?.username}/edit`);
  };

  const addNewPow = () => {
    router.replace(router.asPath);
  };

  const isMD = useBreakpointValue({ base: false, md: true });

  const getWorkPreferenceText = (workPrefernce?: string): string | null => {
    if (!workPrefernce || workPrefernce === 'Not looking for Work') {
      return null;
    }
    const fullTimePatterns = [
      'Passively looking for fulltime positions',
      'Actively looking for fulltime positions',
      'Fulltime',
    ];
    const freelancePatterns = [
      'Passively looking for freelance work',
      'Actively looking for freelance work',
      'Freelance',
    ];
    const internshipPatterns = [
      'Actively looking for internships',
      'Internship',
    ];

    if (fullTimePatterns.includes(workPrefernce)) {
      return 'Fulltime Roles';
    }
    if (freelancePatterns.includes(workPrefernce)) {
      return 'Freelance Opportunities';
    }
    if (internshipPatterns.includes(workPrefernce)) {
      return 'Internship Opportunities';
    }

    return workPrefernce;
  };

  const workPreferenceText = getWorkPreferenceText(talent?.workPrefernce);

  const renderButton = (
    icon: JSX.Element,
    text: string,
    onClickHandler: () => void,
    outline: boolean = false,
  ) => {
    if (isMD) {
      return (
        <Button
          className="ph-no-capture"
          color={outline ? 'brand.slate.500' : '#6366F1'}
          fontSize="sm"
          fontWeight={500}
          bg={outline ? 'white' : '#EDE9FE'}
          borderColor={outline ? 'brand.slate.400' : '#EDE9FE'}
          leftIcon={icon}
          onClick={onClickHandler}
          variant={outline ? 'outline' : 'solid'}
        >
          {text}
        </Button>
      );
    }

    return (
      <IconButton
        color={outline ? 'brand.slate.500' : '#6366F1'}
        fontSize="sm"
        fontWeight={500}
        bg={outline ? 'white' : '#EDE9FE'}
        borderColor={outline ? 'brand.slate.400' : '#EDE9FE'}
        aria-label={text}
        icon={icon}
        onClick={onClickHandler}
        variant={outline ? 'outline' : 'solid'}
      />
    );
  };

  const ogImage = new URL(`${getURL()}api/dynamic-og/talent/`);
  ogImage.searchParams.set('name', `${talent?.firstName} ${talent?.lastName}`);
  ogImage.searchParams.set('username', talent?.username!);
  ogImage.searchParams.set('skills', JSON.stringify(talent?.skills));
  ogImage.searchParams.set(
    'totalEarned',
    stats?.totalWinnings?.toString() || '0',
  );
  ogImage.searchParams.set(
    'submissionCount',
    stats?.participations?.toString(),
  );
  ogImage.searchParams.set('winnerCount', stats?.wins?.toString());
  ogImage.searchParams.set('photo', talent?.photo!);

  const title =
    talent?.firstName && talent?.lastName
      ? `${talent?.firstName} ${talent?.lastName} | Solar Earn Talent`
      : 'Solar Earn';

  const feedItems = feed?.pages.flatMap((page) => page) ?? [];

  return (
    <>
      <Default
        meta={
          <Head>
            <title>{title}</title>
            <meta property="og:title" content={title} />
            <meta property="og:image" content={ogImage.toString()} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:image" content={ogImage.toString()} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Talent on Solar" />
            <meta charSet="UTF-8" key="charset" />
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
              key="viewport"
            />
          </Head>
        }
      >
        {!talent?.id && (
          <EmptySection message="Sorry! The profile you are looking for is not available." />
        )}
        {!!talent?.id && (
          <Box bg="white">
            <Box
              w="100%"
              h={{ base: '100px', md: '30vh' }}
              bgImage={`/assets/bg/profile-cover/${bgImages[randomIndex]}`}
              bgSize={'cover'}
              bgRepeat={'no-repeat'}
              objectFit={'cover'}
            />
            <Box
              pos={'relative'}
              top={{ base: '0', md: '-40' }}
              maxW={'700px'}
              mx="auto"
              px={{ base: '4', md: '7' }}
              py={7}
              bg="white"
              borderRadius={'20px'}
            >
              <Flex justify={'space-between'}>
                <Box>
                  <EarnAvatar
                    size={isMD ? '64px' : '52px'}
                    id={talent?.id}
                    avatar={talent?.photo}
                  />

                  <Text
                    mt={6}
                    color={'brand.slate.900'}
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight={'600'}
                  >
                    {talent?.firstName} {talent?.lastName}
                  </Text>
                  <Text
                    color={'brand.slate.500'}
                    fontSize={{ base: 'md', md: 'md' }}
                    fontWeight={'600'}
                  >
                    @
                    {isMD
                      ? talent?.username
                      : talent?.username?.length && talent?.username.length > 24
                        ? `${talent?.username.slice(0, 24)}...`
                        : talent?.username}
                  </Text>
                </Box>
                <Flex
                  direction={{ base: 'row', md: 'column' }}
                  gap={3}
                  w={{ base: 'auto', md: '160px' }}
                >
                  {user?.id === talent?.id
                    ? renderButton(
                      <EditIcon />,
                      '修改个人信息',
                      handleEditProfileClick,
                    )
                    : renderButton(<EmailIcon />, 'Reach Out', () => {
                      posthog.capture('reach out_talent profile');
                      const email = encodeURIComponent(talent?.email || '');
                      const subject = encodeURIComponent(
                        'Saw Your ST Earn Profile!',
                      );
                      const bcc = encodeURIComponent(
                        'vesper.yang.blockchain@gmail.com',
                      );
                      window.location.href = `mailto:${email}?subject=${subject}&bcc=${bcc}`;
                    })}
                  {renderButton(<ShareIcon />, '分享', onOpen, true)}
                </Flex>
              </Flex>
              <ShareProfile
                username={talent?.username as string}
                isOpen={isOpen}
                onClose={onClose}
                id={talent?.id}
              />
              <Divider my={8} />
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: '12', md: '100' }}
              >
                <Box w={{ base: '100%', md: '50%' }}>
                  <Text mb={4} color={'brand.slate.900'} fontWeight={500}>
                    详细信息
                  </Text>
                  {workPreferenceText && (
                    <Text mt={3} color={'brand.slate.400'}>
                      Looking for{' '}
                      <Text as={'span'} color={'brand.slate.500'}>
                        {workPreferenceText}
                      </Text>
                    </Text>
                  )}
                  {talent?.currentEmployer && (
                    <Text mt={3} color={'brand.slate.400'}>
                      Works at{' '}
                      <Text as={'span'} color={'brand.slate.500'}>
                        {talent?.currentEmployer}
                      </Text>
                    </Text>
                  )}
                  {talent?.location && (
                    <Text mt={3} color={'brand.slate.400'}>
                      定居{' '}
                      <Text as={'span'} color={'brand.slate.500'}>
                        {talent?.location}
                      </Text>
                    </Text>
                  )}
                </Box>
                <Box w={{ base: '100%', md: '50%' }}>
                  <Text color={'brand.slate.900'} fontWeight={500}>
                    技能
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
                          <Flex align="center">
                            <Flex wrap={'wrap'} gap={2} mt={2}>
                              {skillItem.subskills
                                .slice(0, 3)
                                .map((subskill: string, subIndex: number) => (
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
                                ))}
                            </Flex>
                            {skillItem.subskills.length > 3 && (
                              <IconButton
                                aria-label="Toggle subskills"
                                icon={
                                  showSubskills[index] ? (
                                    <ChevronUpIcon />
                                  ) : (
                                    <ChevronDownIcon />
                                  )
                                }
                                onClick={() => handleToggleSubskills(index)}
                                size="sm"
                                variant={'unstyled'}
                              />
                            )}
                          </Flex>

                          <Collapse in={showSubskills[index] ?? false}>
                            <Flex wrap={'wrap'} gap={2} mt={2}>
                              {skillItem.subskills
                                .slice(3)
                                .map((subskill: string, subIndex: number) => (
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
                                ))}
                            </Flex>
                          </Collapse>
                        </Box>
                      ) : null;
                    })
                  ) : (
                    <Text>No skills available</Text>
                  )}
                </Box>
              </Flex>
              <Divider my={8} />
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: '12', md: '100' }}
              >
                <Flex gap={6} w={{ base: '100%', md: '50%' }}>
                  {socialLinks.map(({ Icon, link }, i) => {
                    return <Icon link={link} boxSize={5} key={i} />;
                  })}
                </Flex>
                <Flex
                  gap={{ base: '8', md: '6' }}
                  w={{ base: '100%', md: '50%' }}
                >
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>
                      $
                      {new Intl.NumberFormat('en-US', {
                        maximumFractionDigits: 0,
                      }).format(Math.round(stats?.totalWinnings || 0))}
                    </Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      赚取
                    </Text>
                  </Flex>
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>{stats?.participations}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      提交
                    </Text>
                  </Flex>
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>{stats?.wins}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      赢得
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              <Box mt={{ base: '12', md: '16' }}>
                <Flex
                  align={{ base: 'right', md: 'center' }}
                  justify={'space-between'}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Flex align="center" gap={3}>
                    <Text color={'brand.slate.900'} fontWeight={500}>
                      工作经历
                    </Text>
                    {user?.id === talent?.id && (
                      <Button
                        color={'brand.slate.400'}
                        fontSize="sm"
                        fontWeight={600}
                        onClick={onOpenPow}
                        size="xs"
                        variant={'ghost'}
                      >
                        +添加
                      </Button>
                    )}
                  </Flex>
                  <Flex
                    justify={{ base: 'space-between', md: 'flex-end' }}
                    gap={6}
                    mt={{ base: '12', md: '0' }}
                  >
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
                      活跃信息流
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
                      个人项目
                    </Text>
                  </Flex>
                </Flex>
              </Box>
              <Divider my={4} />
              <Box>
                <FeedLoop
                  feed={feedItems}
                  ref={ref}
                  isFetchingNextPage={isFetchingNextPage}
                  isLoading={isLoading}
                >
                  <>
                    <Image
                      w={32}
                      mx="auto"
                      mt={32}
                      alt={'talent empty'}
                      src="/assets/bg/talent-empty.svg"
                    />
                    <Text
                      w="200px"
                      mx="auto"
                      mt={5}
                      color={'brand.slate.400'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      {user?.id === talent?.id ? '添加工作经历' : '无'}
                    </Text>
                    {user?.id === talent?.id ? (
                      <Button
                        display="block"
                        w="200px"
                        mx="auto"
                        mt={5}
                        onClick={onOpenPow}
                      >
                        添加
                      </Button>
                    ) : (
                      <Box mt={5} />
                    )}

                    <Button
                      display="block"
                      w="200px"
                      mx="auto"
                      mt={2}
                      color={'brand.slate.500'}
                      fontWeight={500}
                      bg="white"
                      borderColor={'brand.slate.400'}
                      onClick={() => router.push('/')}
                      variant={'outline'}
                    >
                      浏览赏金业务
                    </Button>
                  </>
                </FeedLoop>
              </Box>
            </Box>
          </Box>
        )}
        <AddProject
          isOpen={isOpenPow}
          onClose={onClosePow}
          upload
          onNewPow={addNewPow}
        />
      </Default>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  try {
    const talentReq = await axios.post(`${getURL()}/api/user/info`, {
      username: slug,
    });
    const statsReq = await axios.post(`${getURL()}/api/user/public-stats`, {
      username: slug,
    });
    const talent = talentReq.data;
    const stats = statsReq.data;

    return {
      props: { talent, stats },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { talent: null },
    };
  }
};

export default TalentProfile;
