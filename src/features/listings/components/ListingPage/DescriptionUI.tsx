import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import parse, { type HTMLReactParserOptions } from 'html-react-parser';
import React, { useEffect, useState } from 'react';

import { skillMap } from '@/constants';
import type { MainSkills } from '@/interface/skills';

interface Props {
  skills?: MainSkills[];
  description?: string;
}

export function DescriptionUI({ skills, description }: Props) {
  const options: HTMLReactParserOptions = {
    replace: ({ name, children, attribs }: any) => {
      if (name === 'p' && (!children || children.length === 0)) {
        return <br />;
      }
      return { name, children, attribs };
    },
  };

  //to resolve a chain of hydration errors
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Box w={'full'}>
      <VStack px={{ base: 0 }} py={5} bg={'white'} rounded={'xl'}>
        <Flex
          justify={['center', 'center', 'space-between', 'space-between']}
          direction={['column', 'column', 'row', 'row']}
          gap={3}
          w={'full'}
          px={5}
        >
          <Text
            color={'brand.slate.400'}
            fontWeight={500}
            whiteSpace={'nowrap'}
          >
            Skills Needed
          </Text>
          <HStack flexWrap={'wrap'} gap={3}>
            {skills?.map((skill) => (
              <Box
                key={skill}
                m={'0px !important'}
                px={4}
                py={1}
                bg={`${skillMap.find((e) => e.mainskill === skill)?.color}1A`}
                rounded={'md'}
              >
                <Text
                  color={skillMap.find((e) => e.mainskill === skill)?.color}
                  fontSize={'sm'}
                >
                  {skill}
                </Text>
              </Box>
            ))}
          </HStack>
        </Flex>
        <Box
          overflow={'hidden'}
          w={'full'}
          h={'full'}
          px={5}
          pb={8}
          id="reset-des"
        >
          {parse(
            description?.startsWith('"')
              ? JSON.parse(description || '')
              : description ?? '',
            options,
          )}
        </Box>
      </VStack>
    </Box>
  );
}
