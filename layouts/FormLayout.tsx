import { Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { Navbar } from '../components/navbar/navbar';
import { Step, Steps, useSteps } from 'chakra-ui-steps';
const FormLayout = ({ steps, children }: { steps: any[]; children: any }) => {
  const { nextStep, prevStep, setStep, activeStep } = useSteps({
    initialStep: 2,
  });
  return (
    <>
      <VStack>
        <Navbar />
        <VStack>
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
              Start from Scratch or use our readymade templates to save time
            </Text>
          </VStack>

          {children}
        </VStack>
      </VStack>
    </>
  );
};

export default FormLayout;
