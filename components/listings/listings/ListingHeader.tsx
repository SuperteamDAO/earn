/* eslint-disable no-nested-ternary */
import {
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useRouter } from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';
import { BsBell } from 'react-icons/bs';
import { TbBellRinging } from 'react-icons/tb';

import { Mixpanel } from '@/utils/mixpanel';

import type { SubscribeType } from '../../../interface/listings';
import type { SponsorType } from '../../../interface/sponsor';
import { TalentStore } from '../../../store/talent';
import { userStore } from '../../../store/user';
import {
  createSubscription,
  removeSubscription,
} from '../../../utils/functions';
import { genrateuuid } from '../../../utils/helpers';
import { CreateProfileModal } from '../../modals/createProfile';

type Eligibility = 'premission' | 'premission-less';

interface Props {
  sponsor: SponsorType;
  title: string;
  tabs: boolean;
  id?: string;
  sub?: SubscribeType[];
  endTime?: string;
  eligibility: Eligibility;
}
export const ListingHeader = ({
  sponsor,
  title,
  tabs,
  id,
  sub,
  endTime,
  eligibility,
}: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { userInfo } = userStore();
  const { talentInfo } = TalentStore();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const subMutation = useMutation({
    mutationFn: createSubscription,
    mutationKey: ['subscribe'],
    onSuccess: () => {
      queryClient.invalidateQueries(['bounties', router.query.id ?? '']);
      toast.success('Alerts For Bounty Is Active');
    },
  });
  const subDeleteMutation = useMutation({
    mutationFn: removeSubscription,
    mutationKey: ['subscribe', 'delete'],
    onSuccess: () => {
      queryClient.invalidateQueries(['bounties', router.query.id ?? '']);
      toast.success('Alerts For Bounty Is Active');
    },
  });
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
                fontFamily={'Inter'}
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
          {router.asPath.includes('bounties') && (
            <HStack>
              <HStack align="start" px={[3, 3, 0, 0]}>
                {sub?.filter((e) => e.talentId === (talentInfo?.id as string))
                  ?.length! > 0 ? (
                  <Button
                    bg="#F7FAFC"
                    isLoading={subDeleteMutation.isLoading}
                    onClick={() => {
                      Mixpanel.track('notification_remove_listing', {
                        title,
                        name: `${talentInfo?.firstname} ${talentInfo?.lastname}`,
                      });
                      subDeleteMutation.mutate(
                        sub?.filter(
                          (e) => e?.talentId === (talentInfo?.id as string)
                        )[0]?.id as string
                      );
                    }}
                  >
                    <TbBellRinging color="rgb(107 114 128)" />
                  </Button>
                ) : (
                  <Button
                    bg="gray.50"
                    isLoading={subMutation.isLoading}
                    onClick={() => {
                      if (!userInfo?.talent) {
                        onOpen();
                      }

                      subMutation.mutate({
                        bountiesId: id as string,
                        talentId: talentInfo?.id as string,
                        id: genrateuuid(),
                      });
                      Mixpanel.track('notification_added_listing', {
                        title,
                        name: `${talentInfo?.firstname} ${talentInfo?.lastname}`,
                      });
                    }}
                  >
                    <BsBell color="rgb(107 114 128)" />
                  </Button>
                )}
              </HStack>
              <HStack>
                <HStack
                  pos={'relative'}
                  align={'center'}
                  justify={'center'}
                  display={sub?.length! === 0 ? 'none' : 'flex'}
                  w={'3rem'}
                >
                  {sub?.slice(0, 3).map((e, index) => {
                    return (
                      <Box
                        key={e.id}
                        pos={'absolute'}
                        left={index}
                        marginInlineStart={1}
                      >
                        <Image
                          w={8}
                          h={8}
                          objectFit={'contain'}
                          alt={e.Talent?.username}
                          rounded={'full'}
                          src={e.Talent?.avatar}
                        />
                      </Box>
                    );
                  })}
                </HStack>
                <VStack align={'start'}>
                  <Text color={'#000000'} fontSize={'md'} fontWeight={500}>
                    {sub?.length ?? 0}
                  </Text>
                  <Text
                    mt={'0px !important'}
                    color={'gray.500'}
                    fontSize={'md'}
                    fontWeight={500}
                  >
                    People Interested
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          )}
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
          {tabs && eligibility === 'premission-less' && (
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
