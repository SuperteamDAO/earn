/* eslint-disable no-param-reassign */
import {
  Box,
  Button,
  Center,
  Heading,
  HStack,
  Image,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { User } from '@prisma/client';
import React, { Fragment, useState } from 'react';
import { create } from 'zustand';

import AboutYou from '@/components/Talent/AboutYou';
import type { UserStoreType } from '@/components/Talent/types';
import WelcomeMessage from '@/components/Talent/WelcomeMessage';
import YourLinks from '@/components/Talent/YourLinks';
import YourWork from '@/components/Talent/YourWork';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { Steps } from '../../components/misc/steps';
import TalentBio from '../../components/TalentBio';

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
  setOtp: (data) => {
    set((state) => {
      state.otp = data;
      return { ...state };
    });
  },
  emailVerified: false,
  verifyEmail: () => {
    set((state) => {
      state.emailVerified = true;
      return { ...state };
    });
  },
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
        gap={10}
        w={'fit-content'}
        mt={10}
        mx={'auto'}
      >
        <Box w={'full'} p={{ base: 4, md: 0 }}>
          <TalentBio
            user={form as unknown as User}
            successPage={true}
            w={{ md: '90%' }}
          />
        </Box>
        <VStack
          maxW={'35rem'}
          h={'full'}
          mb={12}
          mx={{ base: 4, md: 0 }}
          p={5}
          bg="white"
          rounded={'lg'}
        >
          <Image alt="final" src="/assets/talent/fake-tasks.png" />
          <Button
            w="full"
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            onClick={() => {
              window.location.href = window.location.origin;
            }}
          >
            Start Earning
          </Button>
        </VStack>
      </HStack>
    </Box>
  );
};

function Talent() {
  const [currentPage, setcurrentPage] = useState<
    'welcome' | 'steps' | 'success'
  >('steps');

  return (
    <Default
      meta={
        <Meta
          title="New Talent | Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="https://earn.superteam.fun/new/talent/"
        />
      }
    >
      <VStack>
        {currentPage === 'welcome' && (
          <WelcomeMessage
            setStep={() => {
              setcurrentPage('steps');
            }}
          />
        )}
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

export default Talent;
