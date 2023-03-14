import { Box, Flex, Image, Text } from '@chakra-ui/react';
import React, { Dispatch, SetStateAction } from 'react';
interface Props {
  currentStep: number;
  thisStep: number;
  label: string;
  sublabel?: string;
  setStep?: Dispatch<SetStateAction<number>>;
}
export const Steps = ({ currentStep, thisStep, label, setStep }: Props) => {
  const handleChange = () => {
    if (currentStep > thisStep) {
      //@ts-ignore
      setStep(thisStep);
    }
  };
  return (
    <>
      <Box
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
        flexDir={'column'}
        onClick={handleChange}
        cursor={'pointer'}
        position="relative"
        h={'6rem'}
      >
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
          fontSize="1rem"
          bottom={0}
          w={'max-content'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
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

export const VerticalStep = ({
  currentStep,
  thisStep,
  label,
  sublabel,
}: Props) => {
  return (
    <Flex
      cursor={'pointer'}
      align={'center'}
      justifyContent={'center'}
      gap={3}
      position="relative"
    >
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
      <Flex flexDir={'column'}>
        <Text fontSize="1.3rem" color={'#1E293B'} fontWeight={600}>
          {label}
        </Text>
        <Text fontSize="1rem" color={'#94A3B8'} fontWeight={500}>
          {sublabel}
        </Text>
      </Flex>
    </Flex>
  );
};
