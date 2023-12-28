/* eslint-disable no-nested-ternary */
import {
  Button,
  Heading,
  HStack,
  Image,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import moment from 'moment';
import { useRouter } from 'next/router';
import React from 'react';

import type { SponsorType } from '../../../interface/sponsor';
import { CreateProfileModal } from '../../modals/createProfile';

type Eligibility = 'permission' | 'permission-less';

interface Props {
  sponsor: SponsorType;
  title: string;
  tabs: boolean;
  endTime?: string;
  eligibility: Eligibility;
}
export const ListingHeader = ({
  sponsor,
  title,
  tabs,
  endTime,
  eligibility,
}: Props) => {
  const router = useRouter();
  const { isOpen, onClose } = useDisclosure();
  return (
    <>
      {isOpen && <CreateProfileModal isOpen={isOpen} onClose={onClose} />}
      <VStack bg={'white'}>
        <VStack
          align="start"
          justify={['start', 'start', 'space-between', 'space-between']}
          flexDir={['column', 'column', 'row', 'row']}
          gap={5}
          w={'full'}
          maxW={'7xl'}
          mx={'auto'}
          py={10}
        >
          <HStack align="start" px={[3, 3, 0, 0]}>
            <Image
              w={'4rem'}
              h={'4rem'}
              objectFit={'cover'}
              alt={'phantom'}
              rounded={'md'}
              src={sponsor?.logo}
            />
            <VStack align={'start'}>
              <Heading
                color={'brand.charcoal.700'}
                fontFamily={'var(--font-sans)'}
                fontSize={'lg'}
                fontWeight={700}
              >
                {title}
              </Heading>
              <HStack>
                <Text color={'#94A3B8'}>
                  by @{sponsor?.slug} at {sponsor?.name}
                </Text>
                {endTime ? (
                  Number(moment(endTime).format('x')) > Date.now() ? (
                    <Text
                      px={3}
                      py={1}
                      color={'green.600'}
                      fontSize={'sm'}
                      bg={'green.100'}
                      rounded={'full'}
                    >
                      Submission Open
                    </Text>
                  ) : (
                    <Text
                      px={3}
                      py={1}
                      color={'orange.600'}
                      fontSize={'sm'}
                      bg={'orange.100'}
                      rounded={'full'}
                    >
                      In Review
                    </Text>
                  )
                ) : (
                  <Text
                    px={3}
                    py={1}
                    color={'green.600'}
                    fontSize={'sm'}
                    bg={'green.100'}
                    rounded={'full'}
                  >
                    Open
                  </Text>
                )}
              </HStack>
            </VStack>
          </HStack>
        </VStack>
        <HStack w="full" maxW={'7xl'} h={'max'} px={[3, 3, 0, 0]}>
          <Button
            color={
              router.asPath.includes('submission')
                ? 'brand.slate.400'
                : 'brand.slate.800'
            }
            borderBottom={
              !router.asPath.includes('submission') ? '3px solid ' : '0'
            }
            borderBottomColor={
              !router.asPath.includes('submission')
                ? 'brand.purple'
                : 'transparent'
            }
            onClick={() => {
              if (!tabs) return;
              router.push(
                `/bounties/${title.split(' ').join('-').toLowerCase()}`
              );
            }}
            rounded={0}
            variant={'ghost'}
          >
            Details
          </Button>
          {tabs && eligibility === 'permission-less' && (
            <Button
              color={router.query.subid ? 'brand.slate.800' : 'brand.slate.400'}
              borderBottom={
                router.asPath.includes('submission') ? '3px solid' : '0'
              }
              borderBottomColor={
                router.asPath.includes('submission')
                  ? 'brand.purple'
                  : 'transparent'
              }
              onClick={() => {
                router.push(`${router.asPath}/submission`);
              }}
              rounded={0}
              variant={'ghost'}
            >
              Submissions
            </Button>
          )}
        </HStack>
      </VStack>
    </>
  );
};
