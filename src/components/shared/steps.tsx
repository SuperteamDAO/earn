import { CheckIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import React, { type Dispatch, type SetStateAction } from 'react';

interface Props {
  currentStep: number;
  thisStep: number;
  label: string;
  sublabel?: string;
  setStep?: Dispatch<SetStateAction<number>>;
}
export const Steps = ({ currentStep, thisStep, label, setStep }: Props) => {
  const handleChange = () => {
    if (currentStep > thisStep && setStep) {
      setStep(thisStep);
    }
  };
  return (
    <Box
      pos="relative"
      alignItems={'center'}
      justifyContent={'center'}
      display={'flex'}
      h={'6rem'}
      cursor={currentStep > thisStep ? 'pointer' : 'default'}
      onClick={handleChange}
    >
      <Flex
        align={'center'}
        justify="center"
        w="2.3rem"
        h="2.3rem"
        color="white"
        bg={currentStep >= thisStep ? '#6562FF' : 'transparent'}
        border={currentStep > thisStep - 1 ? 'none' : '1px solid #94A3B8'}
        borderRadius="full"
      >
        {currentStep > thisStep ? (
          <CheckIcon color="white" />
        ) : (
          <Flex>
            <Text
              h="100%"
              color={currentStep === thisStep ? 'white' : 'brand.slate.500'}
              fontSize="1rem"
              textAlign="center"
            >
              {thisStep}
            </Text>
          </Flex>
        )}
      </Flex>
      <Text
        pos="absolute"
        bottom={0}
        alignItems={'center'}
        justifyContent={'center'}
        display={'flex'}
        w={'max-content'}
        color={currentStep === thisStep ? 'brand.purple' : 'brand.slate.500'}
        fontSize={{ base: '0.9rem', md: '1rem' }}
        fontWeight={currentStep === thisStep ? 600 : 500}
      >
        {label}
      </Text>
    </Box>
  );
};
