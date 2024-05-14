import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import router from 'next/router';
import React, { Fragment, useEffect, useState } from 'react';
import { create } from 'zustand';

import { Steps } from '@/components/misc/steps';
import { AboutYou } from '@/components/Talent/AboutYou';
import type { UserStoreType } from '@/components/Talent/types';
import { YourLinks } from '@/components/Talent/YourLinks';
import { YourWork } from '@/components/Talent/YourWork';
import { TalentBio } from '@/components/TalentBio';
import { type User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';
import { getURL } from '@/utils/validUrl';

const useFormStore = create<UserStoreType>()((set) => ({
  form: {
    bio: '',
    username: '',
    location: '',
    photo: '',
    experience: '',
    cryptoExperience: '',
    currentEmployer: '',
    community: '',
    interests: '',
    skills: [],
    subSkills: '',
    workPrefernce: '',
    discord: '',
    twitter: '',
    github: '',
    linkedin: '',
    website: '',
    telegram: '',
    private: false,
  },
  otp: undefined,
  emailVerified: false,
  updateState: (data) => {
    set((state) => {
      state.form = { ...state.form, ...data };
      return { ...state };
    });
  },
}));

const StepsCon = ({ setSuccess }: { setSuccess: () => void }) => {
  const [currentStep, setSteps] = useState<number>(1);
  const stepList = [
    {
      label: 'About You',
      number: 1,
    },
    {
      label: 'Your Work',
      number: 2,
    },
    {
      label: 'Links',
      number: 3,
    },
  ];

  const TitleArray = [
    {
      title: 'Create Your Profile',
      subTitle:
        "If you're ready to start contributing to crypto projects, you're in the right place.",
    },
    {
      title: 'Tell Us About Your Work',
      subTitle: 'The more you tell us, the better we can match you!',
    },
    {
      title: 'Socials & Proof of Work',
      subTitle: 'Where can people learn more about your work?',
    },
  ];

  return (
    <VStack gap={4} w={{ base: 'auto', md: 'xl' }} px={4}>
      <VStack mt={8}>
        <Heading
          color={'#334254'}
          fontFamily={'var(--font-sans)'}
          fontSize={{ base: '18px', md: '24px' }}
          fontWeight={700}
        >
          {TitleArray[currentStep - 1]?.title}
        </Heading>
        <Text
          color={'#94A3B8'}
          fontFamily={'var(--font-sans)'}
          fontSize={{ base: '16px', md: '20px' }}
          fontWeight={500}
          textAlign={'center'}
        >
          {TitleArray[currentStep - 1]?.subTitle}
        </Text>
      </VStack>
      <HStack w="100%" px={{ base: 4, md: 0 }}>
        {stepList.map((step, stepIndex) => {
          return (
            <Fragment key={stepIndex}>
              <Steps
                setStep={setSteps}
                currentStep={currentStep}
                label={step.label}
                thisStep={step.number}
              />
              {step.number !== stepList.length && (
                <hr
                  style={{
                    width: '50%',
                    outline:
                      currentStep >= step.number
                        ? '1px solid #6562FF'
                        : '1px solid #CBD5E1',
                    border: 'none',
                  }}
                />
              )}
            </Fragment>
          );
        })}
      </HStack>
      {currentStep === 1 && (
        <AboutYou setStep={setSteps} useFormStore={useFormStore} />
      )}
      {currentStep === 2 && (
        <YourWork setStep={setSteps} useFormStore={useFormStore} />
      )}
      {currentStep === 3 && (
        <YourLinks
          setStep={setSteps}
          useFormStore={useFormStore}
          success={() => {
            setSuccess();
          }}
        />
      )}
    </VStack>
  );
};

const SuccessScreen = () => {
  const { form } = useFormStore();

  if (!form) {
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
    <Box
      w={'100%'}
      h={'100%'}
      minH={'100vh'}
      pt={'6.25rem'}
      bgImage="url('/assets/bg/success-bg.png')"
      bgSize={'cover'}
      bgRepeat={'no-repeat'}
    >
      <VStack>
        <Image w={'40px'} h={'40px'} alt={''} src="/assets/icons/success.png" />
        <Text
          color={'white'}
          fontSize={{ base: '1.25rem', md: '1.8125rem' }}
          fontWeight={'700'}
          textAlign={'center'}
        >
          Your Earn Profile is Ready!
        </Text>
        <Text
          color={'rgba(255, 255, 255, 0.53)'}
          fontSize={{ base: '18px', md: '28px' }}
          fontWeight={'500'}
          textAlign={'center'}
        >
          Have a look at your profile or start earning
        </Text>
      </VStack>
      <HStack
        align={'start'}
        justifyContent={'center'}
        flexDir={{ base: 'column', md: 'row' }}
        gap={8}
        h={{ md: '25rem' }}
        minH={{ md: '25rem' }}
        mx={3}
        my={8}
      >
        <Box w={{ sm: 'full', lg: '25rem' }} h={'full'}>
          <TalentBio
            user={form as unknown as User}
            successPage={true}
            w={{ sm: '100%' }}
          />
        </Box>

        <Flex
          justify={'space-between'}
          direction={'column'}
          gap={'12px'}
          maxW={{ lg: '35rem' }}
          h={'100%'}
          p={'1.5625rem'}
          bg="white"
          rounded={'lg'}
        >
          <Flex
            h={'full'}
            bg={'rgb(224,242,255)'}
            borderRadius={'8px'}
            objectFit={'contain'}
          >
            <Image
              objectFit={'contain'}
              alt="final"
              src="/assets/talent/fake-tasks.png"
            />
          </Flex>
          <Button
            w="full"
            py={'1.5rem'}
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            onClick={() => {
              window.location.href = window.location.origin;
            }}
          >
            Start Earning
          </Button>
        </Flex>
      </HStack>
    </Box>
  );
};

export default function Talent() {
  const [currentPage, setcurrentPage] = useState<'steps' | 'success'>('steps');
  const { userInfo } = userStore();

  useEffect(() => {
    if (userInfo && userInfo?.isTalentFilled) {
      router.push('/');
    }
  }, [userInfo, router]);

  return (
    <Default
      meta={
        <Meta
          title="Create Your Profile to Access Bounties & Grants | Superteam Earn"
          description="Become part of Superteam's talent network, where you can present your skills and collaborate on various crypto bounties, grants, and projects."
          canonical="https://earn.superteam.fun/new/talent/"
        />
      }
    >
      <VStack>
        {currentPage === 'steps' && (
          <StepsCon
            setSuccess={() => {
              setcurrentPage('success');
            }}
          />
        )}
        {currentPage === 'success' && <SuccessScreen />}
      </VStack>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;

  const res = await axios.get(`${getURL()}api/user`, {
    headers: {
      Cookie: req.headers.cookie,
    },
  });

  if (res.data.isTalentFilled === true) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
