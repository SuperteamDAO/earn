import { Heading, HStack, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import router from 'next/router';
import React, { Fragment, useEffect, useState } from 'react';
import { create } from 'zustand';

import { Steps } from '@/components/shared/steps';
import {
  AboutYou,
  type UserStoreType,
  YourLinks,
  YourWork,
} from '@/features/talent';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
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
    isPrivate: false,
  },
  emailVerified: false,
  updateState: (data) => {
    set((state) => {
      state.form = { ...state.form, ...data };
      return { ...state };
    });
  },
}));

const StepsCon = () => {
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
        <YourLinks setStep={setSteps} useFormStore={useFormStore} />
      )}
    </VStack>
  );
};

export default function Talent() {
  const { user } = useUser();

  useEffect(() => {
    if (user && user?.isTalentFilled) {
      router.push('/');
    }
  }, [user, router]);

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
        <StepsCon />
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
