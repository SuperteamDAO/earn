import {
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
import { VerticalStep } from '../../../misc/steps';
import Countdown from 'react-countdown';
import { PrizeListType } from '../../../../interface/listings';

interface Props {
  total: number;
  prizeList: Partial<PrizeListType>;
  onOpen: () => void;
}
export const DetailSideCard = ({ total, prizeList, onOpen }: Props) => {
  return (
    <>
      <VStack pt={10} gap={2}>
        <VStack
          rounded={'xl'}
          justify={'center'}
          w={'22rem'}
          bg={'#FFFFFF'}
          gap={0}
          pb={5}
        >
          <HStack
            h={16}
            px={3}
            justify={'space-between'}
            w={'full'}
            borderBottom={'1px solid #E2E8EF'}
          >
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
          <VStack borderBottom={'1px solid #E2E8EF'} w={'full'}>
            <TableContainer>
              <Table mt={-8} variant={'unstyled'}>
                <Thead>
                  <Tr>
                    <Th></Th>
                    <Th></Th>
                    <Th> </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {prizeList['first'] && (
                    <Tr>
                      <Td>
                        <Flex
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                          p={1.5}
                          justify={'center'}
                          align={'center'}
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
                          $ {prizeList['first']}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          First Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList['second'] && (
                    <Tr>
                      <Td>
                        <Flex
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                          p={1.5}
                          justify={'center'}
                          align={'center'}
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
                          $ {prizeList['second']}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Second Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList['third'] && (
                    <Tr>
                      <Td>
                        <Flex
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                          p={1.5}
                          justify={'center'}
                          align={'center'}
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
                          $ {prizeList['third']}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Third Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList['forth'] && (
                    <Tr>
                      <Td>
                        <Flex
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                          justify={'center'}
                          align={'center'}
                          p={1.5}
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
                          $ {prizeList['forth']}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={'#CBD5E1'} fontWeight={500}>
                          Forth Prize
                        </Text>
                      </Td>
                    </Tr>
                  )}
                  {prizeList['fifth'] && (
                    <Tr>
                      <Td>
                        <Flex
                          fontSize={'0.7rem'}
                          bg={'#C6C6C62B'}
                          rounded={'full'}
                          p={1.5}
                          justify={'center'}
                          align={'center'}
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
                          $ {prizeList['fifth']}
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
            onClick={() => {
              onOpen();
            }}
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
