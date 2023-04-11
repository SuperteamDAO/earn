import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Image,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { UseMutationResult } from '@tanstack/react-query';
import moment from 'moment';
import Countdown from 'react-countdown';

import { tokenList } from '../../../../constants';
import type { PrizeListType } from '../../../../interface/listings';
import { userStore } from '../../../../store/user';
import { VerticalStep } from '../../../misc/steps';
import { SubmissionModal } from '../../../modals/submissionModal';

interface Props {
  total: number;
  prizeList: Partial<PrizeListType>;
  onOpen: () => void;
  endingTime: string;
  submissionNumber: number;
  submissionisOpen: boolean;
  submissiononClose: () => void;
  submissiononOpen: () => void;
  token: string;
  SubmssionMutation: UseMutationResult<
    void,
    any,
    {
      link: string;
      questions: string;
    },
    unknown
  >;
  questions: string;
  eligibility: string;
}
export const DetailSideCard = ({
  total,
  prizeList,
  onOpen,
  endingTime,
  SubmssionMutation,
  submissionNumber,
  submissionisOpen,
  submissiononClose,
  submissiononOpen,
  questions,
  eligibility,
  token,
}: Props) => {
  const { userInfo } = userStore();
  const { connected } = useWallet();
  let submissionStatus = 0;
  if (Number(moment(endingTime).format('x')) < Date.now()) {
    submissionStatus = 1;
  }

  return (
    <>
      {submissionisOpen && (
        <SubmissionModal
          eligibility={eligibility as string}
          questions={questions}
          SubmssionMutation={SubmssionMutation}
          onClose={submissiononClose}
          isOpen={submissionisOpen}
        />
      )}
      <VStack gap={2} pt={10}>
        <VStack
          justify={'center'}
          gap={0}
          w={'22rem'}
          pb={5}
          bg={'#FFFFFF'}
          rounded={'xl'}
        >
          <HStack
            justify={'space-between'}
            w={'full'}
            h={16}
            px={'1.5rem'}
            borderBottom={'1px solid #E2E8EF'}
          >
            <Box
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              w={10}
              h={7}
              rounded={'full'}
            >
              <Image
                alt={'green doller'}
                rounded={'full'}
                src={
                  tokenList.filter((e) => e?.mintAddress === token)[0]?.icon ??
                  '/assets/icons/green-doller.svg'
                }
              />
            </Box>
            <Text color={'#000000'} fontSize={'1.5rem'} fontWeight={600}>
              {total.toLocaleString() ?? 0}
            </Text>
            <Text color={'#CBD5E1'} fontSize={'1.2rem'} fontWeight={500}>
              Total Prizes
            </Text>
          </HStack>
          <VStack w={'full'} borderBottom={'1px solid #E2E8EF'}>
            <TableContainer w={'full'}>
              <Table mt={-8} variant={'unstyled'}>
                <Thead>
                  <Tr>
                    <Th></Th>
                    <Th></Th>
                    <Th> </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {prizeList.first && (
                    <Tr>
                      <Td>
                        <Flex
                          align={'center'}
                          justify={'center'}
                          w={8}
                          h={8}
                          p={1.5}
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                        >
                          1st
                        </Flex>
                      </Td>
                      <Td>
                        <Text
                          color={'#64758B'}
                          fontSize={'1.1rem'}
                          fontWeight={600}
                        >
                          {prizeList.first}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          First Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList.second && (
                    <Tr>
                      <Td>
                        <Flex
                          align={'center'}
                          justify={'center'}
                          w={8}
                          h={8}
                          p={1.5}
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                        >
                          2nd
                        </Flex>
                      </Td>
                      <Td>
                        <Text
                          color={'#64758B'}
                          fontSize={'1.1rem'}
                          fontWeight={600}
                        >
                          {prizeList.second}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Second Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList.third && (
                    <Tr>
                      <Td>
                        <Flex
                          align={'center'}
                          justify={'center'}
                          w={8}
                          h={8}
                          p={1.5}
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                        >
                          3rd
                        </Flex>
                      </Td>
                      <Td>
                        <Text
                          color={'#64758B'}
                          fontSize={'1.1rem'}
                          fontWeight={600}
                        >
                          {prizeList.third}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Third Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList.forth && (
                    <Tr>
                      <Td>
                        <Flex
                          align={'center'}
                          justify={'center'}
                          w={8}
                          h={8}
                          p={1.5}
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                        >
                          4th
                        </Flex>
                      </Td>
                      <Td>
                        <Text
                          color={'#64758B'}
                          fontSize={'1.1rem'}
                          fontWeight={600}
                        >
                          {prizeList.forth}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Forth Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList.fifth && (
                    <Tr>
                      <Td>
                        <Flex
                          align={'center'}
                          justify={'center'}
                          w={8}
                          h={8}
                          p={1.5}
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                        >
                          5th
                        </Flex>
                      </Td>
                      <Td>
                        <Text
                          color={'#64758B'}
                          fontSize={'1.1rem'}
                          fontWeight={600}
                        >
                          {prizeList.fifth}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Fifth Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </VStack>
          <Flex justify={'space-between'} w={'full'} px={5}>
            <Flex align={'start'} justify={'center'} direction={'column'}>
              <Flex align={'center'} justify={'center'} gap={1}>
                <Image
                  w={'1.4rem'}
                  mt={-1}
                  alt={'suit case'}
                  src={'/assets/icons/purple-suitcase.svg'}
                />
                <Text color={'#000000'} fontSize="1.3rem" fontWeight={500}>
                  {submissionNumber}
                </Text>
              </Flex>
              <Text color={'#94A3B8'}>Submissions</Text>
            </Flex>
            <Flex
              align={'start'}
              justify={'center'}
              direction={'column'}
              py={3}
            >
              <Flex align={'start'} justify={'center'} gap={1}>
                <Image
                  w={'1.4rem'}
                  mt={1}
                  alt={'suit case'}
                  src={'/assets/icons/purple-timer.svg'}
                />
                <VStack align={'start'}>
                  <Text color={'#000000'} fontSize="1.3rem" fontWeight={500}>
                    <Countdown date={endingTime} daysInHours />
                  </Text>
                  <Text mt={'0px !important'} color={'#94A3B8'}>
                    Remaining
                  </Text>
                </VStack>
              </Flex>
            </Flex>
          </Flex>
          <Button
            w={'90%'}
            color={'white'}
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            onClick={() => {
              if (!userInfo?.talent || !connected) {
                onOpen();
                return;
              }
              console.log(questions);
              submissiononOpen();
            }}
          >
            Submit Now
          </Button>
        </VStack>
        <VStack
          align={'start'}
          justify={'center'}
          w={'22rem'}
          mt={4}
          p={6}
          bg={'#FFFFFF'}
          rounded={'xl'}
        >
          <VerticalStep
            sublabel={'Give your best shot'}
            currentStep={submissionStatus + 1}
            thisStep={1}
            label={'Submission Open'}
          />

          <Divider
            h={10}
            border={'2px'}
            borderColor={'#6562FF'}
            transform={'translate(1rem)'}
            orientation="vertical"
          />
          <VerticalStep
            currentStep={submissionStatus + 1}
            thisStep={2}
            label={'Submission Review'}
            sublabel={'Bounties being assessed'}
          />
          <Divider
            h={10}
            border={'2px'}
            borderColor={'#CBD5E1'}
            transform={'translate(1rem)'}
            orientation="vertical"
          />
          <VerticalStep
            currentStep={submissionStatus + 1}
            thisStep={3}
            sublabel={`On ${moment(endingTime).format('Do MMM  YY')}`}
            label={'Winner Announcement'}
          />
        </VStack>
      </VStack>
    </>
  );
};
