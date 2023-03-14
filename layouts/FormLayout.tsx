import { Box, Flex, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import React, { Dispatch, SetStateAction } from 'react';
import { Steps } from '../components/misc/steps';
import { Navbar } from '../components/navbar/navbar';
import { SponsorType } from '../interface/sponsor';

interface StepsList {
  label: string;
  number: number;
  description?: string;
}
interface Props {
  children: any;
  currentStep: number;
  stepList: StepsList[];
  setStep: Dispatch<SetStateAction<number>>;
  sponsors?: SponsorType[];
}
const FormLayout = ({
  children,
  currentStep,
  stepList,
  setStep,
  sponsors,
}: Props) => {
  return (
    <>
      <VStack bg={currentStep !== 1 ? 'white' : '#F6FAFD'}>
        <Navbar sponsors={sponsors} />
        <VStack w={'80%'} gap={10}>
          <VStack mt={20}>
            <Heading
              color={'#334254'}
              fontWeight={700}
              fontSize={'24px'}
              fontFamily={'Inter'}
            >
              Create a new listing
            </Heading>
            <Text
              color={'#94A3B8'}
              fontSize={'20px'}
              fontFamily={'Inter'}
              fontWeight={500}
            >
              {stepList[currentStep - 1].description}
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
                    <>
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
                      {step.number === currentStep && (
                        <hr
                          style={{
                            width: '50%',
                            outline: '1px solid #CBD5E1',
                            border: 'none',
                          }}
                        />
                      )}
                    </>
                  )}
                </>
              );
            })}
          </HStack>
          {children}
        </VStack>
      </VStack>
    </>
  );
};

export default FormLayout;
