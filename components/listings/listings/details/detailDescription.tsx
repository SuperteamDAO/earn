import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import parse from 'html-react-parser';
import React, { useState } from 'react';
import { BiDownArrowAlt, BiUpArrowAlt } from 'react-icons/bi';

import type { MultiSelectOptions } from '../../../../constants';
import { SkillColor } from '../../../../utils/constants';

interface Props {
  skills: MultiSelectOptions[];
  description: string;
}

export const DetailDescription = ({ skills, description }: Props) => {
  const [show, setShow] = useState<boolean>(false);

  return (
    <>
      <VStack w={'full'} p={5} bg={'white'} rounded={'xl'}>
        <Flex
          justify={['center', 'center', 'space-between', 'space-between']}
          direction={['column', 'column', 'row', 'row']}
          gap={3}
          w={'full'}
        >
          <Text color={'brand.slate.400'} fontWeight={500}>
            Skills Needed
          </Text>
          <HStack flexWrap={'wrap'} gap={3}>
            {skills.length <= 5
              ? skills?.map((e) => {
                  return (
                    <Box
                      key={e.value}
                      m={'0px !important'}
                      px={4}
                      py={1}
                      bg={`${SkillColor[e.label as any]}1A`}
                      rounded={'md'}
                    >
                      <Text color={SkillColor[e.label as any]} fontSize={'sm'}>
                        {e.label}
                      </Text>
                    </Box>
                  );
                })
              : skills.slice(0, 4).map((e) => {
                  return (
                    <Box
                      key={e.value}
                      px={4}
                      py={1}
                      bg={`${SkillColor[e.label as any]}1A`}
                      rounded={'md'}
                    >
                      <Text color={SkillColor[e.label as any]} fontSize={'sm'}>
                        {e.label}
                      </Text>
                    </Box>
                  );
                })}
          </HStack>
        </Flex>
        <Flex pos={'relative'} direction={'column'} w={'full'}>
          <Flex
            direction={'column'}
            overflow={'hidden'}
            w={'full'}
            // eslint-disable-next-line no-nested-ternary
            h={show ? 'full' : description.length > 100 ? '21.5rem' : 'max'}
            mt={10}
            pb={8}
            px={5}
            id="reset-des"
          >
            {parse(
              description.startsWith('"')
                ? JSON.parse(description || '')
                : description ?? ''
            )}
          </Flex>
          {description.length > 100 && (
            <Box
              pos={'absolute'}
              bottom={0}
              alignItems={'start'}
              justifyContent={'center'}
              display={'flex'}
              w={'full'}
              h={'50%'}
              bg={
                show
                  ? 'transparent'
                  : 'linear-gradient(180deg, white 0%, rgba(255, 255, 255, 0.57) 100%)'
              }
              transform={'matrix(1, 0, 0, -1, 0, 0);'}
            >
              <Button
                w={'12rem'}
                mt={-3}
                color={'brand.slate.400'}
                fontSize={'md'}
                bg={'white'}
                shadow={'0px 4px 4px rgba(0, 0, 0, 0.06)'}
                transform={'matrix(1, 0, 0, -1, 0, 0);'}
                onClick={() => {
                  setShow(!show);
                }}
                rounded={'2xl'}
              >
                {show ? (
                  <>
                    <BiUpArrowAlt fontSize={'md'} />
                    <Text mx={3}>Read Less</Text>
                  </>
                ) : (
                  <>
                    <BiDownArrowAlt fontSize={'md'} />
                    <Text mx={3}>Read More</Text>
                  </>
                )}
              </Button>
            </Box>
          )}
        </Flex>
      </VStack>
    </>
  );
};
