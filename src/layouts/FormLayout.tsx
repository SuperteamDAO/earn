import { Heading, HStack, Text, VStack } from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { Steps } from '../components/misc/steps';

interface StepsList {
  label: string;
  number: number;
  description?: string;
  mainHead?: string;
}
interface Props {
  children: any;
  currentStep: number;
  stepList: StepsList[];
  setStep: Dispatch<SetStateAction<number>>;
}

const FormLayout = ({ children, currentStep, stepList, setStep }: Props) => {
  return (
    <VStack mb={12}>
      <VStack gap={6} w={'80%'}>
        <VStack>
          <Heading
            color={'#334254'}
            fontFamily={'var(--font-sans)'}
            fontSize={'24px'}
            fontWeight={700}
          >
            {stepList[currentStep - 1]?.mainHead}
          </Heading>
          <Text
            color={'#94A3B8'}
            fontFamily={'var(--font-sans)'}
            fontSize={'20px'}
            fontWeight={500}
            textAlign={'center'}
          >
            {stepList[currentStep - 1]?.description}
          </Text>
        </VStack>
        <HStack w="50%">
          {stepList.map((step) => {
            return (
              <>
                <Steps
                  setStep={setStep}
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
              </>
            );
          })}
        </HStack>
        {children}
      </VStack>
    </VStack>
  );
};

export default FormLayout;
