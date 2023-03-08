import {
  Button,
  Divider,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { Steps, VerticalStep } from '../../../misc/steps';
import Countdown from 'react-countdown';
import { PrizeListMap, PrizeListType } from '../../../../interface/listings';

interface Props {
  total: number;
  prizeList: Partial<PrizeListType>;
}
export const DetailSideCard = ({ total, prizeList }: Props) => {
  const labels = ['1st', '2nd', '3rd', '4th', '5th'];
  const prizeValue = Object.values(prizeList);
  const prizeKey = Object.keys(prizeList);
  return (
    <>
      <VStack pt={10} gap={3}>
        <VStack
          rounded={'xl'}
          justify={'center'}
          w={'22rem'}
          bg={'#FFFFFF'}
          gap={4}
          pb={5}
        >
          <HStack
            h={20}
            px={3}
            justify={'space-between'}
            w={'full'}
            borderBottom={'1px solid #E2E8EF'}
          >
            {/* <Image src="" alt={'total prize'} /> */}
            <Flex
              fontSize={'1rem'}
              bg={'#C6C6C62B'}
              rounded={'full'}
              w={8}
              h={8}
              align={'center'}
              justify={'center'}
            >
              $
            </Flex>
            <Text fontSize={'1.5rem'} color={'#000000'} fontWeight={600}>
              ${total.toLocaleString() ?? 0}
            </Text>
            <Text fontSize={'1.2rem'} color={'#CBD5E1'} fontWeight={500}>
              Total Prizes
            </Text>
          </HStack>
          <VStack pb={6} borderBottom={'1px solid #E2E8EF'} w={'full'}>
            {prizeKey.map((el, index) => {
              return (
                <HStack
                  key={el}
                  justify={'space-between'}
                  px={3}
                  w={'full'}
                  gap={4}
                >
                  <Flex
                    fontSize={'0.7rem'}
                    bg={'#C6C6C62B'}
                    rounded={'full'}
                    p={1.5}
                  >
                    {labels[index]}
                  </Flex>
                  <Text color={'#64758B'} fontSize={'1.1rem'} fontWeight={600}>
                    $ {prizeValue[index]}
                  </Text>
                  <Text color={'#CBD5E1'} fontWeight={500}>
                    {/* {PrizeListMap[el] as any} */}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
          <Flex w={'full'} justify={'space-between'} px={5}>
            <Flex flexDir={'column'} align={'start'} justify={'center'}>
              <Flex gap={1} align={'center'} justify={'center'}>
                <Image
                  mt={-1}
                  src={'/assets/icons/purple-suitcase.svg'}
                  alt={'suit case'}
                  w={'1.4rem'}
                />
                <Text color={'#000000'} fontSize="1.3rem" fontWeight={500}>
                  05
                </Text>
              </Flex>
              <Text color={'#94A3B8'}>Submissions</Text>
            </Flex>
            <Flex py={3} flexDir={'column'} align={'start'} justify={'center'}>
              <Flex gap={1} align={'center'} justify={'center'}>
                <Image
                  mt={-1}
                  src={'/assets/icons/purple-timer.svg'}
                  alt={'suit case'}
                  w={'1.4rem'}
                />
                <Text color={'#000000'} fontSize="1.3rem" fontWeight={500}>
                  <Countdown date={Date.now() + 100000000} daysInHours />
                </Text>
              </Flex>
              <Text color={'#94A3B8'}>Remaining</Text>
            </Flex>
          </Flex>
          <Button
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            color={'white'}
            w={'90%'}
          >
            Submit Now
          </Button>
        </VStack>
        <VStack
          mt={4}
          rounded={'xl'}
          justify={'center'}
          w={'22rem'}
          bg={'#FFFFFF'}
          align={'start'}
          p={6}
        >
          <VerticalStep currentStep={1} thisStep={1} label={'Submission'} />

          <Divider
            border={'2px'}
            borderColor={'#6562FF'}
            h={10}
            transform={'translate(1rem)'}
            orientation="vertical"
          />
          <VerticalStep currentStep={1} thisStep={2} label={'Submission'} />
          <Divider
            border={'2px'}
            borderColor={'#CBD5E1'}
            h={10}
            transform={'translate(1rem)'}
            orientation="vertical"
          />
          <VerticalStep currentStep={1} thisStep={3} label={'Submission'} />
        </VStack>
      </VStack>
    </>
  );
};
