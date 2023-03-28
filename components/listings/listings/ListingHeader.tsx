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
  useDisclosure,
} from '@chakra-ui/react';
import { TbBellRinging } from 'react-icons/tb';
import { BsBell } from 'react-icons/bs';
import { useRouter } from 'next/router';
import { SponsorType } from '../../../interface/sponsor';
import { TalentStore } from '../../../store/talent';
import { userStore } from '../../../store/user';
import { CreateProfileModal } from '../../modals/createProfile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSubscription,
  removeSubscription,
} from '../../../utils/functions';
import { genrateuuid } from '../../../utils/helpers';
import toast from 'react-hot-toast';
import { SubscribeType } from '../../../interface/listings';
import moment from 'moment';

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
              <HStack>
                <Text color={'#94A3B8'}>
                  by @{sponsor?.username} at {sponsor.name}
                </Text>
                {endTime ? (
                  Number(moment(endTime).format('x')) > Date.now() ? (
                    <Text
                      px={3}
                      py={1}
                      rounded={'full'}
                      bg={'#16A36821'}
                      color={'#16A368'}
                      fontSize={'0.75rem'}
                    >
                      Submission Open
                    </Text>
                  ) : (
                    <Text
                      px={3}
                      py={1}
                      rounded={'full'}
                      bg={'#A3731621'}
                      color={'#A35A16'}
                      fontSize={'0.75rem'}
                    >
                      In Review
                    </Text>
                  )
                ) : (
                  <Text
                    px={3}
                    py={1}
                    rounded={'full'}
                    bg={'#16A36821'}
                    color={'#16A368'}
                    fontSize={'0.75rem'}
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
                    isLoading={subDeleteMutation.isLoading}
                    onClick={() => {
                      subDeleteMutation.mutate(
                        sub?.filter(
                          (e) => e.talentId === (talentInfo?.id as string)
                        )[0].id as string
                      );
                    }}
                    bg="#F7FAFC"
                  >
                    <TbBellRinging color="rgb(107 114 128)" />
                  </Button>
                ) : (
                  <Button
                    isLoading={subMutation.isLoading}
                    onClick={() => {
                      if (!userInfo?.talent) {
                        return onOpen();
                      }
                      subMutation.mutate({
                        bountiesId: id as string,
                        talentId: talentInfo?.id as string,
                        id: genrateuuid(),
                      });
                    }}
                    bg="#F7FAFC"
                  >
                    <BsBell color="rgb(107 114 128)" />
                  </Button>
                )}
              </HStack>
              <HStack>
                <HStack
                  display={sub?.length! === 0 ? 'none' : 'flex'}
                  position={'relative'}
                  align={'center'}
                  justify={'center'}
                  w={'3rem'}
                >
                  {sub?.slice(0, 3).map((e, index) => {
                    return (
                      <Box
                        position={'absolute'}
                        left={index}
                        marginInlineStart={1}
                        key={e.id}
                      >
                        <Image
                          w={8}
                          objectFit={'contain'}
                          rounded={'full'}
                          h={8}
                          src={e.Talent?.avatar}
                          alt={e.Talent?.username}
                        />
                      </Box>
                    );
                  })}
                </HStack>
                <VStack align={'start'}>
                  <Text color={'#000000'} fontSize={'1rem'} fontWeight={500}>
                    {sub?.length ?? 0}
                  </Text>
                  <Text
                    mt={'0px !important'}
                    color={'gray.500'}
                    fontSize={'1rem'}
                    fontWeight={500}
                  >
                    People Interested
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          )}
        </VStack>
        <HStack px={[3, 3, 0, 0]} maxW={'7xl'} w="full" h={'max'}>
          <Button
            borderBottom={
              !router.asPath.includes('submission') ? '3px solid #6562FF' : '0'
            }
            rounded={0}
            variant={'ghost'}
            color={router.asPath.includes('submission') ? '#94A3B8' : '#1E293B'}
            onClick={() => {
              if (!tabs) return;
              router.push(`/listings/bounties/${title.split(' ').join('-')}`);
            }}
          >
            Details
          </Button>
          {tabs && eligibility === 'premission-less' && (
            <Button
              onClick={() => {
                router.push(router.asPath + '/submission');
              }}
              borderBottom={
                router.asPath.includes('submission') ? '3px solid #6562FF' : '0'
              }
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
