import { Flex, HStack, Text, VStack } from '@chakra-ui/react';
import React, { type Dispatch, type SetStateAction } from 'react';

import { Steps } from '@/components/shared/steps';

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

export const FormLayout = ({
  children,
  currentStep,
  stepList,
  setStep,
}: Props) => {
  return (
    <VStack mb={12}>
      <VStack w={'80%'}>
        <Flex align={'center'} direction="column">
          <Text color={'brand.slate.700'} fontSize={'1.7rem'} fontWeight={700}>
            {stepList[currentStep - 1]?.mainHead}
          </Text>
          <Text
            mt={1}
            color={'brand.slate.400'}
            fontSize={'lg'}
            fontWeight={500}
            textAlign={'center'}
          >
            {stepList[currentStep - 1]?.description}
          </Text>
        </Flex>
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
                      width: '100%',
                      outline:
                        currentStep >= step.number
                          ? '1px solid #6562FF'
                          : '1px solid #CBD5E1',
                      border: 'none',
                      marginLeft: '-0.5rem',
                      marginRight: '-0.5rem',
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
