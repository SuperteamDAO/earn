/* eslint-disable no-param-reassign */
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
// layouts

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
    skills: '',
    subSkills: '',
    workPrefernce: '',
    discord: '',
    twitter: '',
    github: '',
    linkedin: '',
    website: '',
    telegram: '',
    pow: '',
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
        "If you're ready to start contributing to Solana, you're in the right place.",
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
    <VStack gap={4} w={'xl'}>
      <VStack mt={8}>
        <Heading
          color={'#334254'}
          fontFamily={'Inter'}
          fontSize={'24px'}
          fontWeight={700}
        >
          {TitleArray[currentStep - 1]?.title}
        </Heading>
        <Text
          color={'#94A3B8'}
          fontFamily={'Inter'}
          fontSize={'20px'}
          fontWeight={500}
          textAlign={'center'}
        >
          {TitleArray[currentStep - 1]?.subTitle}
        </Text>
      </VStack>
      <HStack w="100%">
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
        <Text color={'white'} fontSize={'1.8125rem'} fontWeight={'700'}>
          Your Earn Profile is Ready!
        </Text>
        <Text
          color={'rgba(255, 255, 255, 0.53)'}
          fontSize={'29px'}
          fontWeight={'500'}
        >
          Have a look at your profile or start earning
        </Text>
      </VStack>
      <HStack gap={'1.25rem'} w={'fit-content'} mt={'66px'} mx={'auto'}>
        <TalentBio user={form as User} successPage={true} />
        <Flex
          align={'center'}
          direction={'column'}
          w={'34.375rem'}
          h={'21.375rem'}
          pt={'33px'}
          bg={'white'}
          borderRadius={'0.6875rem'}
        >
          <Center w={'30.6875rem'} h={'206px'} mx={'auto'} bg={'#E0F2FF'}>
            <Image
              w={'26.875rem'}
              h={'12.875rem'}
              alt={''}
              src="/assets/talent/fake-tasks.png"
            />
          </Center>
          <Button
            w={'31.0625rem'}
            h="50px"
            mt={'1.8125rem'}
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

function Talent() {
  const [currentPage, setcurrentPage] = useState('steps');

  return (
    <Default
      meta={
        <Meta
          title="New Talent | Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="/assets/logo/og.svg"
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
