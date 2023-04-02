import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { BiDownArrowAlt, BiUpArrowAlt } from 'react-icons/bi';
import { MultiSelectOptions, skillSubSkillMap } from '../../../../constants';
import { SkillColor } from '../../../../utils/constants';
import parse from 'html-react-parser';
interface Props {
  skills: MultiSelectOptions[];
  description: string;
}

export const DetailDescription = ({ skills, description }: Props) => {
  const [show, setShow] = useState<boolean>(false);

  return (
    <>
      <VStack w={'full'} rounded={'xl'} p={5} bg={'white'}>
        <Flex
          w={'full'}
          flexDir={['column', 'column', 'row', 'row']}
          gap={3}
          justify={['center', 'center', 'space-between', 'space-between']}
        >
          <Text color={'#94A3B8'} fontWeight={500}>
            Skills Needed
          </Text>
          <HStack gap={3} flexWrap={'wrap'}>
            {skills.length <= 5
              ? skills?.map((e) => {
                  return (
                    <Box
                      bg={SkillColor[e.label as any] + '1A'}
                      key={e.value}
                      px={4}
                      py={1}
                      rounded={'md'}
                      m={'0px !important'}
                    >
                      <Text
                        fontSize={'0.8rem'}
                        color={SkillColor[e.label as any]}
                      >
                        {e.label}
                      </Text>
                    </Box>
                  );
                })
              : skills.slice(0, 4).map((e) => {
                  return (
                    <Box
                      bg={SkillColor[e.label as any] + '1A'}
                      key={e.value}
                      px={4}
                      py={1}
                      rounded={'md'}
                    >
                      <Text
                        fontSize={'0.8rem'}
                        color={SkillColor[e.label as any]}
                      >
                        {e.label}
                      </Text>
                    </Box>
                  );
                })}
          </HStack>
        </Flex>
        <Flex w={'full'} position={'relative'} flexDir={'column'}>
          <Flex
            id="reset-des"
            h={show ? 'full' : description.length > 100 ? '21.5rem' : 'max'}
            overflow={'hidden'}
            flexDir={'column'}
            mt={10}
            w={'full'}
            pb={8}
            px={5}
          >
            {parse(
              description.startsWith('"')
                ? JSON.parse(description)
                : description ?? ''
            )}
          </Flex>
          {description.length > 100 && (
            <Box
              h={'50%'}
              position={'absolute'}
              bottom={0}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'start'}
              w={'full'}
              transform={'matrix(1, 0, 0, -1, 0, 0);'}
              bg={
                show
                  ? 'transparent'
                  : 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.57) 100%)'
              }
            >
              <Button
                color={'#94A3B8'}
                fontSize={'1.1rem'}
                w={'12rem'}
                onClick={() => {
                  setShow(!show);
                }}
                transform={'matrix(1, 0, 0, -1, 0, 0);'}
                boxShadow={'0px 4px 4px rgba(0, 0, 0, 0.06)'}
                bg={'#FFFFFF'}
                rounded={'2xl'}
                mt={-3}
              >
                {show ? (
                  <>
                    <BiUpArrowAlt fontSize={'1.3rem'} />
                    <Text mx={3}>Read Less</Text>
                  </>
                ) : (
                  <>
                    <BiDownArrowAlt fontSize={'1.3rem'} />
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
