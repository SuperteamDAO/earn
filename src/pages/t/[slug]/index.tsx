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
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import { AddProject } from '@/components/Form/AddProject';
import { ShareIcon } from '@/components/misc/shareIcon';
import { ShareProfile } from '@/components/modals/shareProfile';
import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { type FeedDataProps, PowCard, SubmissionCard } from '@/features/feed';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface TalentProps {
  slug: string;
}

type UserWithEarnings = User & {
  totalEarnings: number;
  feed: FeedDataProps[];
};

function TalentProfile({ slug }: TalentProps) {
  const [talent, setTalent] = useState<UserWithEarnings>();
  const [isloading, setIsloading] = useState<boolean>(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'projects'>(
    'activity',
  );
  const [randomIndex, setRandomIndex] = useState<number>(0);
  const [showSubskills, setShowSubskills] = useState<Record<number, boolean>>(
    {},
  );

  const handleToggleSubskills = (index: number) => {
    setShowSubskills({
      ...showSubskills,
      [index]: !showSubskills[index],
    });
  };
  const { userInfo } = userStore();

  const {
    isOpen: isOpenPow,
    onOpen: onOpenPow,
    onClose: onClosePow,
  } = useDisclosure();

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
        }
      } catch (err) {
        console.log(err);
        setError(true);
        setIsloading(false);
      }
    };
    fetch();
  }, []);

  const bgImages = ['1.png', '2.png', '3.png', '4.png', '5.png'];

  useEffect(() => {
    setRandomIndex(Math.floor(Math.random() * bgImages.length));
  }, []);

  const socialLinks = [
    {
      icon: '/assets/talent/twitter.png',
      link: talent?.twitter,
    },

    {
      icon: '/assets/talent/linkedin.png',
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
    talent?.feed?.filter(
      (sub) =>
        sub?.type === 'Submission' && sub.isWinner && sub?.isWinnersAnnounced,
    ).length ?? 0;

  const submissionCount =
    talent?.feed?.filter((sub) => sub?.type === 'Submission').length ?? 0;

  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/t/${talent?.username}/edit`);
  };

  const filteredFeed = useMemo(() => {
    if (activeTab === 'activity') {
      return talent?.feed;
    }

    return talent?.feed?.filter((item) => item.type === 'PoW');
  }, [activeTab, talent?.feed]);

  const addNewPow = (newPow: any) => {
    setTalent((prevTalent) => {
      if (!prevTalent) {
        return prevTalent;
      }
      const previousFeed = prevTalent.feed ?? [];
      return {
        ...prevTalent,
        feed: [newPow, ...previousFeed],
      };
    });
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

  return (
    <>
      <Default
        meta={
          <Meta
            title={
              talent?.firstName && talent?.lastName
                ? `Superteam Earn Talent: ${talent?.firstName} ${talent?.lastName}`
                : 'Superteam Earn'
            }
            description={
              talent?.firstName && talent?.lastName
                ? `${talent.firstName} ${talent.lastName} is on Superteam Earn. Become a part of our talent community to explore opportunities in the crypto space and work on bounties, grants, and projects.`
                : 'Superteam Earn is a platform for developers, designers, and content marketers to work on real-world crypto projects. Explore opportunities by becoming part of our community.'
            }
          />
        }
      >
        {isloading && <LoadingSection />}
        {!isloading && !!error && <EmptySection />}
        {!isloading && !error && !talent?.id && (
          <EmptySection message="Sorry! The profile you are looking for is not available." />
        )}
        {!isloading && !error && !!talent?.id && (
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
                  {userInfo?.id === talent?.id
                    ? renderButton(
                        <EditIcon />,
                        'Edit Profile',
                        handleEditProfileClick,
                      )
                    : renderButton(<EmailIcon />, 'Reach Out', () => {
                        const email = encodeURIComponent(talent?.email || '');
                        const subject = encodeURIComponent(
                          'Saw Your ST Earn Profile!',
                        );
                        const bcc = encodeURIComponent(
                          'hello@superteamearn.com',
                        );
                        window.location.href = `mailto:${email}?subject=${subject}&bcc=${bcc}`;
                      })}
                  {renderButton(<ShareIcon />, 'Share', onOpen, true)}
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
                    Details
                  </Text>
                  {workPreferenceText && (
                    <Text mt={3} color={'brand.slate.400'}>
                      Looking for{' '}
                      <Text as={'span'} color={'brand.slate.500'}>
                        {workPreferenceText}
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
                <Box w={{ base: '100%', md: '50%' }}>
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
                  {socialLinks.map((ele, eleIndex) => {
                    return (
                      <Box
                        key={eleIndex}
                        onClick={() => {
                          if (ele.link) {
                            const formattedLink =
                              ele.link.startsWith('http://') ||
                              ele.link.startsWith('https://')
                                ? ele.link
                                : `https://${ele.link}`;
                            window.open(formattedLink, '_blank');
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
                <Flex
                  gap={{ base: '8', md: '6' }}
                  w={{ base: '100%', md: '50%' }}
                >
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>${talent?.totalEarnedInUSD}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      Earned
                    </Text>
                  </Flex>
                  <Flex direction={'column'}>
                    <Text fontWeight={600}>{submissionCount}</Text>
                    <Text color={'brand.slate.500'} fontWeight={500}>
                      {submissionCount === 1 ? 'Submission' : 'Submissions'}
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
              <Box mt={{ base: '12', md: '16' }}>
                <Flex
                  align={{ base: 'right', md: 'center' }}
                  justify={'space-between'}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Flex align="center" gap={3}>
                    <Text color={'brand.slate.900'} fontWeight={500}>
                      Proof of Work
                    </Text>
                    {userInfo?.id === talent?.id && (
                      <Button
                        color={'brand.slate.400'}
                        fontSize="sm"
                        fontWeight={600}
                        onClick={onOpenPow}
                        size="xs"
                        variant={'ghost'}
                      >
                        +ADD
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
                {filteredFeed?.length === 0 ? (
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
                      {userInfo?.id === talent?.id
                        ? 'Add some proof of work to build your profile'
                        : 'Nothing to see here yet ...'}
                    </Text>
                    {userInfo?.id === talent?.id ? (
                      <Button
                        display="block"
                        w="200px"
                        mx="auto"
                        mt={5}
                        onClick={onOpenPow}
                      >
                        Add
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
                      Browse Bounties
                    </Button>
                  </>
                ) : (
                  filteredFeed?.map((item, index) => {
                    if (item.type === 'Submission') {
                      return (
                        <SubmissionCard
                          key={index}
                          sub={item as any}
                          type="profile"
                        />
                      );
                    }
                    if (item.type === 'PoW') {
                      return (
                        <PowCard key={index} pow={item as any} type="profile" />
                      );
                    }
                    return null;
                  })
                )}
              </Box>
            </Box>
          </Box>
        )}
        <AddProject
          {...{
            isOpen: isOpenPow,
            onClose: onClosePow,
            upload: true,
            onNewPow: addNewPow,
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
