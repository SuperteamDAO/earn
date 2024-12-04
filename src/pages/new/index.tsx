import {
  Avatar,
  AvatarGroup,
  Box,
  Center,
  Divider,
  Flex,
  Icon,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { MdCheck } from 'react-icons/md';

import { SponsorButton } from '@/components/ProfileSetup/SponsorButton';
import { TalentButton } from '@/components/ProfileSetup/TalentButton';
import { ONBOARDING_KEY } from '@/constants';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { AuthWrapper } from '@/features/auth';
import { userCountQuery } from '@/features/home';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

export default function NewProfilePage({
  showTalentProfile,
}: {
  showTalentProfile: boolean;
}) {
  const avatars = [
    { name: 'Abhishek', src: ASSET_URL + '/pfps/t1.webp' },
    { name: 'Pratik', src: ASSET_URL + '/pfps/md2.webp' },
    { name: 'Yash', src: ASSET_URL + '/pfps/fff1.webp' },
  ];

  const { data: totals } = useQuery(userCountQuery);

  const router = useRouter();
  const { user } = useUser();
  const [isTalentLoading, setIsTalentLoading] = useState(false);
  const [isSponsorLoading, setIsSponsorLoading] = useState(false);

  const checkTalent = async () => {
    console.log('check talent called');
    localStorage.setItem(ONBOARDING_KEY, 'talent');
    console.log('local storage set', localStorage.getItem(ONBOARDING_KEY));
    if (!user) return;
    try {
      // localStorage.removeItem(ONBOARDING_KEY);
      if (!user?.isTalentFilled) {
        router.push('/new/talent');
      } else {
        router.push(`/t/${user.username}`);
      }
    } catch (error) {
      setIsTalentLoading(false);
    }
  };

  const checkSponsor = async () => {
    localStorage.setItem(ONBOARDING_KEY, 'sponsor');
    if (!user) return;
    try {
      // localStorage.removeItem(ONBOARDING_KEY);
      const sponsors = await axios.get('/api/user-sponsors');
      if (sponsors?.data?.length && user.currentSponsorId) {
        router.push('/dashboard/listings?open=1');
      } else {
        router.push('/new/sponsor');
      }
    } catch (error) {
      setIsSponsorLoading(false);
    }
  };

  useEffect(() => {
    if (router.query['loginState'] === 'signedIn') {
      const onboardingStep = localStorage.getItem(ONBOARDING_KEY);
      if (onboardingStep) {
        if (onboardingStep === 'talent') {
          setIsTalentLoading(true);
          checkTalent();
        } else if (onboardingStep === 'sponsor') {
          setIsSponsorLoading(true);
          checkSponsor();
        }
      }
    }
  }, [router, user]);

  return (
    <Default
      meta={
        <Meta
          title="Make Your Profile | Earn on Superteam | Connect with Crypto Talent"
          description="Join Superteam to engage with top talent and discover bounties and grants for your crypto projects."
          canonical="https://earn.superteam.fun/new/"
        />
      }
    >
      <Box
        pos={'relative'}
        display={'flex'}
        maxW="52rem"
        h={{ md: '100vh' }}
        mx="auto"
        fontFamily="var(--font-sans)"
      >
        <Flex
          pos={{ base: 'static', md: 'relative' }}
          top={{ base: 0, md: '10vh' }}
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: '4rem', md: '2rem' }}
          px={{ base: 4, lg: 0 }}
          py={{ base: 6, lg: 0 }}
        >
          {showTalentProfile && (
            <Flex direction={'column'} gap={9} w="full">
              <Flex direction={'column'} gap={1.5}>
                <Text color="brand.slate.900" fontSize={'2xl'} fontWeight={600}>
                  Continue as talent
                </Text>
                <Text
                  color="brand.slate.500"
                  fontSize={'1.125rem'}
                  lineHeight={'21.78px'}
                  letterSpacing="-0.2px"
                >
                  Create a profile to start submitting, and get notified on new
                  work opportunities
                </Text>
              </Flex>

              <AuthWrapper className="w-full" onClick={checkTalent}>
                <Flex
                  direction={'column'}
                  gap={4}
                  overflow="hidden"
                  w="full"
                  bg={'white'}
                  borderRadius={'7px'}
                  cursor="pointer"
                  onClick={checkTalent}
                >
                  <Box
                    pos="relative"
                    alignItems={'center'}
                    justifyContent={'center'}
                    display={'flex'}
                    w={'full'}
                  >
                    <img
                      style={{ width: '100%' }}
                      alt={'user icon'}
                      src={ASSET_URL + '/onboarding/talent-banner.webp'}
                    />
                    <Box
                      pos="absolute"
                      top={0}
                      left={0}
                      w="full"
                      h="full"
                      bg="#A78BFA"
                      mixBlendMode={'overlay'}
                    />
                  </Box>
                  <Box flexDir={'column'} gap={5} display={'flex'} px={4}>
                    <BulletPoint type="TALENT">
                      Contribute to top Solana projects
                    </BulletPoint>
                    <BulletPoint type="TALENT">
                      Build your web3 resume
                    </BulletPoint>
                    <BulletPoint type="TALENT">Get paid in crypto</BulletPoint>
                  </Box>
                  <Divider borderColor="brand.slate.300" />
                  <Box px={4} pb={4}>
                    <TalentButton
                      showMessage={false}
                      isLoading={isTalentLoading}
                      checkTalent={checkTalent}
                    />
                  </Box>
                </Flex>
              </AuthWrapper>
              <Flex align="center" gap={6} mx="auto" mt={-3}>
                <AvatarGroup max={3} size={'xs'}>
                  {avatars.map((avatar, index) => (
                    <Avatar
                      key={index}
                      pos="relative"
                      borderWidth={'0px'}
                      name={avatar.name}
                      src={avatar.src}
                    />
                  ))}
                </AvatarGroup>
                {totals?.totalUsers !== null && (
                  <Text pos="relative" color="brand.slate.500" fontSize="sm">
                    Join {totals?.totalUsers?.toLocaleString('en-us')}+ others
                  </Text>
                )}
              </Flex>
            </Flex>
          )}
          <Flex direction={'column'} gap={9} w="full">
            <Flex direction={'column'} gap={1.5}>
              <Text color="brand.slate.900" fontSize={'2xl'} fontWeight={600}>
                Continue as a sponsor
              </Text>
              <Text
                color="brand.slate.500"
                fontSize={'1.125rem'}
                lineHeight={'21.78px'}
                letterSpacing="-0.2px"
              >
                List a bounty or freelance gig for your project and find your
                next contributor
              </Text>
            </Flex>
            <AuthWrapper className="w-full" onClick={checkSponsor}>
              <Flex
                direction={'column'}
                gap={4}
                overflow="hidden"
                w="full"
                bg={'white'}
                borderRadius={'7px'}
                cursor="pointer"
                onClick={checkSponsor}
              >
                <Box
                  pos="relative"
                  alignItems={'center'}
                  justifyContent={'center'}
                  display={'flex'}
                  w={'full'}
                >
                  <img
                    style={{ width: '100%' }}
                    alt={'user icon'}
                    src={ASSET_URL + '/onboarding/sponsor-banner.webp'}
                  />
                  <Box
                    pos="absolute"
                    top={0}
                    left={0}
                    w="full"
                    h="full"
                    bg="#10B981"
                    mixBlendMode={'overlay'}
                  />
                </Box>
                <Box flexDir={'column'} gap={5} display={'flex'} px={4}>
                  <BulletPoint type="SPONSOR">
                    Get in front of 10,000 weekly visitors
                  </BulletPoint>
                  <BulletPoint type="SPONSOR">
                    20+ templates to choose from
                  </BulletPoint>
                  <BulletPoint type="SPONSOR">100% free</BulletPoint>
                </Box>
                <Divider borderColor="brand.slate.300" />
                <Box px={4} pb={4}>
                  <SponsorButton
                    isLoading={isSponsorLoading}
                    showMessage={false}
                    checkSponsor={checkSponsor}
                  />
                </Box>
              </Flex>
            </AuthWrapper>
            <Flex align="center" justify="space-between" gap={3} mt={-3} px={3}>
              <img
                className="h-5 object-contain"
                alt="Jupiter Icon"
                src={ASSET_URL + '/landingsponsor/sponsors/jupiter.webp'}
              />
              <img
                className="h-8 object-contain"
                alt="Solflare Icon"
                src={ASSET_URL + '/company-logos/solflare.webp'}
              />
              <img
                className="hidden h-4 object-contain md:block"
                alt="Squads Icon"
                src={ASSET_URL + '/company-logos/squads.webp'}
              />
              <img
                className="h-7 w-7 object-contain"
                alt="Tensor Icon"
                src={ASSET_URL + '/company-logos/tensor.svg'}
              />
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, query } = context;
  let showTalentProfile = true;

  try {
    const response = await axios.get(`${getURL()}api/user`, {
      headers: {
        Cookie: req.headers.cookie,
      },
    });

    const { isTalentFilled } = response.data;
    showTalentProfile = isTalentFilled === false;

    if (query.onboarding === 'true' && isTalentFilled) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }

  return {
    props: {
      showTalentProfile,
    },
  };
};

const TickIcon = ({ type }: { type: 'TALENT' | 'SPONSOR' }) => {
  return (
    <Center
      p={'3px'}
      bg={type === 'TALENT' ? '#EEF2FF' : '#ECFDF5'}
      rounded="full"
    >
      <Icon
        as={MdCheck}
        w="0.8rem"
        h="0.8rem"
        color={type === 'TALENT' ? '#4F46E5' : '#059669'}
      />
    </Center>
  );
};

const BulletPoint = ({
  type,
  children,
}: {
  type: 'TALENT' | 'SPONSOR';
  children: React.ReactNode;
}) => {
  return (
    <Flex align={'center'} gap={4}>
      <TickIcon type={type} />
      <Text color={'brand.slate.500'} fontWeight={400}>
        {children}
      </Text>
    </Flex>
  );
};
