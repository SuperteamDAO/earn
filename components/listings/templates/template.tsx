import { AddIcon } from '@chakra-ui/icons';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { Dispatch, SetStateAction } from 'react';
interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
}
const Template = ({ setSteps }: Props) => {
  const router = useRouter();
  return (
    <>
      <VStack align={'start'} w="full">
        <VStack w={'full'} mb={6} align="start">
          <Flex align="center" w="full" justify="center" gap="2rem" mb="2rem">
            <Text fontSize="1.3rem" color="gray.600" fontWeight={600}>
              Bounty
            </Text>
            <hr
              style={{
                width: '100%',
                outline: '1px solid #CBD5E1',
                border: 'none',
              }}
            />
          </Flex>
          <Flex>
            <Box
              bg={'white'}
              w={'15rem'}
              h={'15rem'}
              border={'1px solid #cbd5e1'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              flexDirection={'column'}
              cursor={'pointer'}
              onClick={() => {
                setSteps(2);
                router.replace('/listings/create?type=bounties');
              }}
            >
              <AddIcon color="gray.500" mb="1rem" />
              <Text fontSize="1rem" color="gray.500" fontWeight={500}>
                Start from Scratch
              </Text>
            </Box>
          </Flex>
        </VStack>
        <VStack w={'full'} mb={6} align="start">
          <Flex align="center" w="full" justify="center" gap="2rem" mb="2rem">
            <Text fontSize="1.3rem" color="gray.600" fontWeight={600}>
              Jobs
            </Text>
            <hr
              style={{
                width: '100%',
                outline: '1px solid #CBD5E1',
                border: 'none',
              }}
            />
          </Flex>
          <Flex>
            <Box
              bg={'white'}
              w={'15rem'}
              h={'15rem'}
              border={'1px solid #cbd5e1'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              flexDirection={'column'}
              cursor={'pointer'}
              onClick={() => {
                setSteps(2);
                router.replace('/listings/create?type=jobs');
              }}
            >
              <AddIcon color="gray.500" mb="1rem" />
              <Text fontSize="1rem" color="gray.500" fontWeight={500}>
                Start from Scratch
              </Text>
            </Box>
          </Flex>
        </VStack>
        <VStack w={'full'} mb={6} align="start">
          <Flex align="center" w="full" justify="center" gap="2rem" mb="2rem">
            <Text fontSize="1.3rem" color="gray.600" fontWeight={600}>
              Grants
            </Text>
            <hr
              style={{
                width: '100%',
                outline: '1px solid #CBD5E1',
                border: 'none',
              }}
            />
          </Flex>
          <Flex>
            <Box
              bg={'white'}
              w={'15rem'}
              h={'15rem'}
              border={'1px solid #cbd5e1'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              flexDirection={'column'}
              cursor={'pointer'}
              onClick={() => {
                setSteps(2);
                router.replace('/listings/create?type=grants');
              }}
            >
              <AddIcon color="gray.500" mb="1rem" />
              <Text fontSize="1rem" color="gray.500" fontWeight={500}>
                Start from Scratch
              </Text>
            </Box>
          </Flex>
        </VStack>
      </VStack>
    </>
  );
};

export default Template;
