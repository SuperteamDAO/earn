import { AddIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';
import type { Dispatch, SetStateAction } from 'react';
import React, { useEffect, useState } from 'react';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  setListingType: Dispatch<SetStateAction<string>>;
}
const Template = ({ setSteps, setListingType }: Props) => {
  const [bountiesTemplates, setBountiesTemplates] = useState([]);
  const [isBountiesTemplatesLoading, setIsBountiesTemplatesLoading] =
    useState(false);

  const getBountyTemplates = async () => {
    setIsBountiesTemplatesLoading(true);
    try {
      const templates: any = await axios.get('/api/bounties/templates/');
      console.log(
        'file: template.tsx:19 ~ getBountyTemplates ~ templates:',
        templates
      );
      setBountiesTemplates(templates?.data || []);
      setIsBountiesTemplatesLoading(false);
    } catch (e) {
      setIsBountiesTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (!isBountiesTemplatesLoading) {
      getBountyTemplates();
    }
  }, []);

  const createTemplate = (templateId: string) => {
    console.log(
      'file: template.tsx:38 ~ useTemplate ~ templateId:',
      templateId
    );
  };

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
          <Flex wrap={'wrap'} gap={6}>
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
            {bountiesTemplates.map((template: any) => (
              <Box key={template.id} w={'15rem'} h={'15rem'} bg={'white'}>
                <Flex
                  align="center"
                  justify="center"
                  h="45%"
                  fontSize="3xl"
                  bg={template.color || 'white'}
                >
                  {template?.emoji}
                </Flex>
                <Flex
                  align="start"
                  justify={'space-between'}
                  direction={'column'}
                  h="55%"
                  px={6}
                  py={4}
                  bg="white"
                >
                  <Text color={'brand.slate.700'} fontWeight={500}>
                    {template?.templateTitle}
                  </Text>
                  <Button
                    w="full"
                    onClick={() => createTemplate(template?.id)}
                    size="sm"
                    variant="solid"
                  >
                    Use Template
                  </Button>
                </Flex>
              </Box>
            ))}
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
