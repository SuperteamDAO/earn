import { Box, Flex, Image, Text } from '@chakra-ui/react';
import React, { Dispatch, SetStateAction } from 'react';
interface Props {
  currentStep: number;
  thisStep: number;
  label: string;
  setStep: Dispatch<SetStateAction<number>>;
}
export const Steps = ({ currentStep, thisStep, label, setStep }: Props) => {
  const handleChange = () => {
    if (currentStep > thisStep) {
      setStep(thisStep);
    }
  };
  return (
    <>
      <Box onClick={handleChange} cursor={'pointer'} position="relative">
        <Flex
          w="2.3rem"
          h="2.3rem"
          borderRadius="50%"
          bg={currentStep >= thisStep ? '#6562FF' : 'transparent'}
          color="white"
          justify="center"
          align={'center'}
          border={currentStep === thisStep ? 'none' : '1px solid #94A3B8'}
        >
          {currentStep > thisStep ? (
            <Image src={'/assets/icons/white-tick.svg'} alt="Tick icon" />
          ) : (
            <Flex>
              <Text
                color={currentStep === thisStep ? 'white' : '#94A3B8'}
                h="100%"
                fontSize="1rem"
                textAlign="center"
              >
                {thisStep}
              </Text>
            </Flex>
          )}
        </Flex>
        <Text
          transform={
            label === 'Company' || label === 'Template'
              ? 'translate(-1.5rem)'
              : 'translate(-0.7rem)'
          }
          mt="0.8rem"
          fontSize="1rem"
          position="absolute"
          color={currentStep === thisStep ? '#1E293B' : '#CBD5E1'}
          fontWeight={600}
        >
          {label}
        </Text>
      </Box>
    </>
  );
};
