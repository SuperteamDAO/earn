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
import { TalentStore } from '../../../store/talent';
import { userStore } from '../../../store/user';
interface Props {
  sponsor: SponsorType;
  title: string;
  tabs: boolean;
}
export const ListingHeader = ({ sponsor, title, tabs }: Props) => {
  const router = useRouter();
  const { userInfo } = userStore();
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
                fontSize={'1.3rem'}
                fontWeight={700}
                color={'#334254'}
              >
                {title}
              </Heading>
              <Text color={'#94A3B8'}>
                by @{sponsor?.username} at {sponsor.name}
              </Text>
            </VStack>
          </HStack>
          <HStack align="start" px={[3, 3, 0, 0]}>
            <Button
              onClick={() => {
                if (!userInfo?.talent) {
                  return;
                }
              }}
              bg="#F7FAFC"
            >
              <BsBell color="rgb(107 114 128)" />
            </Button>
          </HStack>
        </VStack>
        <HStack px={[3, 3, 0, 0]} maxW={'7xl'} w="full" h={'max'}>
          <Button
            borderBottom={!router.query.subid ? '3px solid #6562FF' : '0'}
            rounded={0}
            variant={'ghost'}
            color={router.query.subid ? '#94A3B8' : '#1E293B'}
            onClick={() => {
              if (!tabs) return;
              router.push(`/listings/bounties/${title.split(' ').join('-')}`);
            }}
          >
            Details
          </Button>
          {tabs && (
            <Button
              onClick={() => {
                router.push(router.asPath + '?subid=true');
              }}
              borderBottom={router.query.subid ? '3px solid #6562FF' : '0'}
              rounded={0}
              variant={'ghost'}
              color={router.query.subid ? '#1E293B' : '#94A3B8'}
            >
              Submissions
            </Button>
          )}
        </HStack>
      </VStack>
    </>
  );
};
