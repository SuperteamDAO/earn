import { AddIcon } from '@chakra-ui/icons';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  setListingType: Dispatch<SetStateAction<string>>;
}
const Template = ({ setSteps, setListingType }: Props) => {
  return (
    <>
      <VStack align={'start'} gap={8} w="full">
        <VStack align="start" w={'full'}>
          <Flex align="center" justify="center" gap="2rem" w="full" mb="2rem">
            <Text color="gray.600" fontSize="1.3rem" fontWeight={600}>
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
              alignItems={'center'}
              justifyContent={'center'}
              flexDir={'column'}
              display={'flex'}
              w={'15rem'}
              h={'15rem'}
              bg={'white'}
              border={'1px solid #cbd5e1'}
              cursor={'pointer'}
              onClick={() => {
                setListingType('BOUNTY');
                setSteps(2);
              }}
            >
              <AddIcon color="gray.500" mb="1rem" />
              <Text color="gray.500" fontSize="1rem" fontWeight={500}>
                Start from Scratch
              </Text>
            </Box>
          </Flex>
        </VStack>
        {/* <VStack align="start" w={'full'}>
          <Flex align="center" justify="center" gap="2rem" w="full" mb="2rem">
            <Text color="gray.600" fontSize="1.3rem" fontWeight={600}>
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
              alignItems={'center'}
              justifyContent={'center'}
              flexDir={'column'}
              display={'flex'}
              w={'15rem'}
              h={'15rem'}
              bg={'white'}
              border={'1px solid #cbd5e1'}
              cursor={'pointer'}
              onClick={() => {
                setListingType('JOB');
                setSteps(2);
              }}
            >
              <AddIcon color="gray.500" mb="1rem" />
              <Text color="gray.500" fontSize="1rem" fontWeight={500}>
                Start from Scratch
              </Text>
            </Box>
          </Flex>
        </VStack>
        <VStack align="start" w={'full'}>
          <Flex align="center" justify="center" gap="2rem" w="full" mb="2rem">
            <Text color="gray.600" fontSize="1.3rem" fontWeight={600}>
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
              alignItems={'center'}
              justifyContent={'center'}
              flexDir={'column'}
              display={'flex'}
              w={'15rem'}
              h={'15rem'}
              bg={'white'}
              border={'1px solid #cbd5e1'}
              cursor={'pointer'}
              onClick={() => {
                setListingType('GRANT');
                setSteps(2);
              }}
            >
              <AddIcon color="gray.500" mb="1rem" />
              <Text color="gray.500" fontSize="1rem" fontWeight={500}>
                Start from Scratch
              </Text>
            </Box>
          </Flex>
        </VStack> */}
      </VStack>
    </>
  );
};

export default Template;
