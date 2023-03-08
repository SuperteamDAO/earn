import React from 'react';
import { Navbar } from '../../navbar/navbar';
import {
  Box,
  VStack,
  Image,
  Heading,
  HStack,
  Text,
  Button,
} from '@chakra-ui/react';
import { BsBell } from 'react-icons/bs';
import { useRouter } from 'next/router';
import { SponsorType } from '../../../interface/sponsor';
interface Props {
  sponsor: SponsorType;
  title: string;
}
export const ListingHeader = ({ sponsor, title }: Props) => {
  const router = useRouter();
  return (
    <>
      <Navbar />
      <VStack bg={'white'}>
        <VStack
          maxW={'7xl'}
          align="start"
          justify={['start', 'start', 'space-between', 'space-between']}
          flexDir={['column', 'column', 'row', 'row']}
          mx={'auto'}
          h={'14rem'}
          gap={5}
          pt={24}
          w={'full'}
        >
          <HStack px={[3, 3, 0, 0]} align="start">
            <Image
              src={sponsor?.logo}
              alt={'phantom'}
              w={'4rem'}
              rounded={'md'}
              h={'4rem'}
              objectFit={'cover'}
            />
            <VStack align={'start'}>
              <Heading
                fontFamily={'Inter'}
                fontSize={'1.2rem'}
                fontWeight={700}
                color={'#334254'}
              >
                {title}
              </Heading>
              <Text color={'#94A3B8'}>by @{sponsor?.name}</Text>
            </VStack>
          </HStack>
          <HStack align="start" px={[3, 3, 0, 0]}>
            <Button bg="#F7FAFC">
              <BsBell color="#DADADA" />
            </Button>
          </HStack>
        </VStack>
        <HStack px={[3, 3, 0, 0]} maxW={'7xl'} w="full" h={'max'}>
          <Button
            borderBottom={!router.query.submission ? '3px solid #6562FF' : '0'}
            rounded={0}
            variant={'ghost'}
            color={router.query.submission ? '#94A3B8' : '#1E293B'}
            onClick={() => {
              router.push(router.asPath.split('?')[0]);
            }}
          >
            Details
          </Button>
          <Button
            onClick={() => {
              router.push(router.asPath + '?submission=true');
            }}
            borderBottom={router.query.submission ? '3px solid #6562FF' : '0'}
            rounded={0}
            variant={'ghost'}
            color={router.query.submission ? '#1E293B' : '#94A3B8'}
          >
            Submissions
          </Button>
        </HStack>
      </VStack>
    </>
  );
};
