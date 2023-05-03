/* eslint-disable no-nested-ternary */
import { BellIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Image,
  Link,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import parse from 'html-react-parser';
import moment from 'moment';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { TiTick } from 'react-icons/ti';

import { Mixpanel } from '@/utils/mixpanel';
import { getURL } from '@/utils/validUrl';

import { type MultiSelectOptions, tokenList } from '../../constants';
import type { BountyStatus } from '../../interface/types';
import { TalentStore } from '../../store/talent';
import { userStore } from '../../store/user';
import { findTalentPubkey, updateNotification } from '../../utils/functions';
import { EarningModal } from '../modals/earningModal';

type ListingSectionProps = {
  children?: React.ReactNode;
  title: string;
  sub: string;
  emoji: string;
  type: 'bounties' | 'jobs' | 'grants';
};

export const ListingSection = ({
  children,
  title,
  sub,
  emoji,
  type,
}: ListingSectionProps) => {
  const router = useRouter();

  return (
    <Box
      display={
        router.query.category
          ? router.query.category === (type as string) ||
            router.query.category === 'all'
            ? 'block'
            : 'none'
          : 'block'
      }
      w={{ md: 'brand.120', base: '95%' }}
      mt={'1rem'}
      mb={'2.8125rem'}
      mx={'auto'}
    >
      <HStack
        align="center"
        justify="space-between"
        mb={4}
        py={3}
        borderBottom="2px solid"
        borderBottomColor="#E2E8F0"
      >
        <Flex align={'center'}>
          <Image
            w={'1.4375rem'}
            h={'1.4375rem'}
            mr={'0.75rem'}
            alt="emoji"
            src={emoji}
          />
          <Text
            color={'#334155'}
            fontSize={{ base: 14, md: 16 }}
            fontWeight={'600'}
          >
            {title}
          </Text>
          <Text mx={3} color={'brand.slate.300'} fontSize={'xxs'}>
            |
          </Text>
          <Text color={'brand.slate.400'} fontSize={{ base: 12, md: 14 }}>
            {sub}
          </Text>
        </Flex>
        <Flex>
          <Link
            display={
              router.query.category
                ? router.query.category === (type as string) ||
                  router.query.category === 'all'
                  ? 'none'
                  : 'block'
                : 'block'
            }
            px={3}
            py={1}
            color="brand.slate.500"
            _hover={{
              textDecoration: 'none',
              bg: 'brand.purple',
              color: 'white',
            }}
            href={`/${type}`}
            rounded={5}
          >
            View All
          </Link>
        </Flex>
      </HStack>
      <Flex direction={'column'} rowGap={'2.625rem'}>
        {children}
      </Flex>
    </Box>
  );
};

const textLimiter = (text: string, len: number) => {
  if (text.length > len) {
    return `${text.slice(0, len)}...`;
  }
  return text;
};

interface BountyProps {
  title: string;
  amount: string;
  due: string;
  logo?: string;
  status: BountyStatus;
  token: string;
  slug: string;
  sponsor: string;
}

export const BountiesCard = ({
  amount,
  due,
  status,
  logo,
  title,
  token,
  slug,
  sponsor,
}: BountyProps) => {
  return (
    <>
      <Link
        _hover={{
          textDecoration: 'none',
        }}
        href={`${getURL()}/listings/bounties/${slug}`}
        isExternal
        onClick={() => {
          Mixpanel.track('Bounty Clicked', {
            'Bounty Title': title,
          });
        }}
      >
        <Flex
          align="center"
          justify="space-between"
          w={{ base: '100%', md: 'brand.120' }}
          h={16}
        >
          <Flex w="80%" h={16}>
            <Image
              w={16}
              h={16}
              mr={5}
              alt={'company logo'}
              rounded={5}
              src={logo ?? '/assets/home/placeholder/ph1.png'}
            />
            <Flex justify={'space-between'} direction={'column'} w={'full'}>
              <Text color="brand.slate.700" fontSize="sm" fontWeight={600}>
                {textLimiter(title, 40)}
              </Text>
              <Text
                w={'full'}
                color={'brand.slate.400'}
                fontSize={{ md: 'sm', base: 'xs' }}
                fontWeight={'400'}
                noOfLines={1}
              >
                {sponsor}
              </Text>
              <Flex align={'center'} gap={3}>
                <Image
                  w={4}
                  h={4}
                  alt="token"
                  rounded="full"
                  src={
                    tokenList.find((ele) => {
                      return ele.mintAddress === token;
                    })?.icon
                  }
                />

                <Text
                  color={'brand.slate.700'}
                  fontSize={'sm'}
                  fontWeight={'600'}
                >
                  {amount}
                </Text>
                <Text color={'brand.slate.300'} fontSize={'sm'}>
                  |
                </Text>
                <Text color={'brand.slate.500'} fontSize={'sm'}>
                  {moment(due).fromNow().includes('ago')
                    ? `Closed ${moment(due).fromNow()}`
                    : `Closing ${moment(due).fromNow()}`}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Link
            w={24}
            py={2}
            color={'brand.slate.400'}
            textAlign="center"
            border="1px solid"
            borderColor="brand.slate.400"
            borderRadius={4}
            _hover={{
              textDecoration: 'none',
              bg: 'brand.slate.400',
              color: 'white',
            }}
            href={`${getURL()}/listings/bounties/${slug}`}
            isExternal
          >
            {Number(moment(due).format('x')) < Date.now()
              ? status === 'close'
                ? 'View'
                : 'View'
              : 'Apply'}
          </Link>
        </Flex>
      </Link>
    </>
  );
};
interface JobsProps {
  title: string;
  description: string;
  max: number;
  min: number;
  maxEq: number;
  minEq: number;
  skills: MultiSelectOptions[];
  logo?: string;
  orgName: string;
  link?: string;
}
export const JobsCard = ({
  description,
  max,
  min,
  maxEq,
  minEq,
  skills,
  title,
  logo,
  orgName,
  link,
}: JobsProps) => {
  return (
    <Link
      _hover={{
        textDecoration: 'none',
      }}
      href={link || `${getURL()}/listings/jobs/${title.split(' ').join('-')}`}
      isExternal
      onClick={() => {
        Mixpanel.track('job_clicked', {
          'Job Title': title,
        });
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        w={{ base: '100%', md: 'brand.120' }}
        h={'3.9375rem'}
      >
        <Flex justify="start">
          <Image
            w={16}
            h={16}
            mr={5}
            alt={'company logo'}
            rounded={5}
            src={logo ?? '/assets/home/placeholder/ph2.png'}
          />
          <Flex justify={'space-between'} direction={'column'}>
            <Text color="brand.slate.700" fontSize="sm" fontWeight="600">
              {title}
            </Text>
            <Text
              color="brand.slate.400"
              fontSize={{ md: 'sm', base: 'xs' }}
              fontWeight={400}
            >
              {description
                ? parse(
                    description?.startsWith('"')
                      ? JSON.parse(description || '')?.slice(0, 100)
                      : (description ?? '')?.slice(0, 100)
                  )
                : orgName}
            </Text>
            <Flex align={'center'}>
              {!!min && !!max && (
                <Text mr={3} color={'brand.slate.500'} fontSize={'sm'}>
                  <Text as="span" fontWeight="700">
                    ${' '}
                  </Text>
                  {min.toLocaleString()} - {max.toLocaleString()}
                </Text>
              )}
              {!!minEq && !!maxEq && (
                <Text mr={3} color={'brand.slate.500'} fontSize={'sm'}>
                  {minEq.toLocaleString()}% - {maxEq.toLocaleString()}% Equity
                </Text>
              )}
              {skills?.length &&
                skills.slice(0, 3).map((e) => {
                  return (
                    <Text
                      key={''}
                      display={{ base: 'none', md: 'block' }}
                      mr={3}
                      color={'brand.slate.500'}
                      fontSize="sm"
                    >
                      {e.label}
                    </Text>
                  );
                })}
            </Flex>

            <Link
              w={24}
              py={2}
              color={'brand.slate.400'}
              textAlign="center"
              border="1px solid"
              borderColor={'brand.slate.400'}
              borderRadius={4}
              _hover={{
                textDecoration: 'none',
                bg: 'brand.slate.400',
                color: 'white',
              }}
              href={
                link ||
                `${getURL()}/listings/jobs/${title.split(' ').join('-')}`
              }
              isExternal
            >
              Apply
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </Link>
  );
};

interface GrantsProps {
  title: string;
  sponsor: string;
  logo?: string;
  max: number;
  min: number;
}

export const GrantsCard = ({ title, logo, max, min, sponsor }: GrantsProps) => {
  return (
    <Link
      _hover={{
        textDecoration: 'none',
      }}
      href={`${getURL()}/listings/grants/${title.split(' ').join('-')}`}
      isExternal
      onClick={() => {
        Mixpanel.track('grant_clicked', {
          'Grant Title': title,
        });
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        w={{ base: '100%', md: 'brand.120' }}
        h={14}
      >
        <Flex justify="start">
          <Image
            w={16}
            h={16}
            mr={5}
            alt={'company logo'}
            rounded={5}
            src={logo ?? '/assets/home/placeholder/ph3.png'}
          />
          <Flex justify="space-between" direction="column">
            <Text color="brand.slate.700" fontSize="sm" fontWeight="600">
              {title}
            </Text>
            <Text
              color="brand.slate.400"
              fontSize={{ md: 'sm', base: 'xs' }}
              fontWeight="400"
            >
              {sponsor}
            </Text>
            <Flex align={'center'}>
              <Image w={3} h={3} alt="" src="/assets/icons/dollar.svg" />
              <Text mr={3} color={'brand.slate.500'} fontSize={'sm'}>
                {min.toLocaleString()} - {max.toLocaleString()}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Link
          w={24}
          py={2}
          color={'brand.slate.400'}
          textAlign="center"
          border="1px solid"
          borderColor={'brand.slate.400'}
          borderRadius={4}
          _hover={{
            textDecoration: 'none',
            bg: 'brand.slate.400',
            color: 'white',
          }}
          href={`${getURL()}/listings/grants/${title.split(' ').join('-')}`}
          isExternal
        >
          Apply
        </Link>
      </Flex>
    </Link>
  );
};

type CategoryAssetsType = {
  [key: string]: {
    bg: string;
    desc: string;
    color: string;
    icon: string;
  };
};

export const CategoryBanner = ({ type }: { type: string }) => {
  const { userInfo } = userStore();

  const { talentInfo, setTalentInfo } = TalentStore();
  const [loading, setLoading] = useState(false);
  const categoryAssets: CategoryAssetsType = {
    Design: {
      bg: `/assets/category_assets/bg/design.png`,
      desc: 'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
      color: '#FEFBA8',
      icon: '/assets/category_assets/icon/design.png',
    },
    Growth: {
      bg: `/assets/category_assets/bg/growth.png`,
      desc: 'If you’re a master of campaigns, building relationships, or data-driven strategy, we have earning opportunities for you.',
      color: '#BFA8FE',
      icon: '/assets/category_assets/icon/growth.png',
    },
    Content: {
      bg: `/assets/category_assets/bg/content.png`,
      desc: 'If you can write insightful essays, make stunning videos, or create killer memes, the opportunities below are calling your name.',
      color: '#FEB8A8',
      icon: '/assets/category_assets/icon/content.png',
    },
    'Frontend Development': {
      bg: `/assets/category_assets/bg/frontend.png`,
      desc: 'If you are a pixel-perfectionist who creates interfaces that users love, check out the earning opportunities below.',
      color: '#FEA8EB',
      icon: '/assets/category_assets/icon/frontend.png',
    },
    'Backend Development': {
      bg: `/assets/category_assets/bg/backend.png`,
      desc: 'Opportunities to build high-performance databases, on and off-chain. ',
      color: '#FEEBA8',
      icon: '/assets/category_assets/icon/backend.png',
    },
    Blockchain: {
      bg: `/assets/category_assets/bg/contract.png`,
      desc: 'If you can write insightful essays, make stunning videos, or create killer memes, the opportunities below are calling your name.',
      color: '#A8FEC0',
      icon: '/assets/category_assets/icon/contract.png',
    },
  };
  const { publicKey } = useWallet();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const updateTalent = async () => {
    const talent = await findTalentPubkey(publicKey?.toBase58() as string);
    if (!talent) {
      return null;
    }
    return setTalentInfo(talent.data);
  };
  return (
    <>
      {isOpen && <EarningModal isOpen={isOpen} onClose={onClose} />}
      <Flex
        direction={{ md: 'row', base: 'column' }}
        w={{ md: 'brand.120', base: '100%' }}
        h={{ md: '7.375rem', base: 'fit-content' }}
        mt={6}
        mx={'auto'}
        p={6}
        bg={`url('${categoryAssets[type]?.bg}')`}
        bgSize={'cover'}
        rounded={10}
      >
        <Center
          w={14}
          h={14}
          mr={3}
          bg={categoryAssets[type]?.color}
          rounded={'md'}
        >
          <Image alt="Category icon" src={categoryAssets[type]?.icon} />
        </Center>
        <Box w={{ md: '60%', base: '100%' }} mt={{ base: 4, md: '0' }}>
          <Text fontFamily={'Domine'} fontWeight={'700'}>
            {type}
          </Text>
          <Text color={'brand.slate.500'} fontSize={'small'}>
            {categoryAssets[type]?.desc}
          </Text>
        </Box>
        <Button
          mt={{ base: 4, md: '' }}
          ml={{ base: '', md: 'auto' }}
          my={{ base: '', md: 'auto' }}
          px={4}
          color={'brand.slate.400'}
          fontWeight={'300'}
          bg={'white'}
          border={'1px solid'}
          borderColor={'brand.slate.500'}
          isLoading={loading}
          leftIcon={
            JSON.parse(talentInfo?.notifications ?? '[]').includes(type) ? (
              <TiTick />
            ) : (
              <BellIcon />
            )
          }
          onClick={async () => {
            if (!userInfo?.talent) {
              onOpen();
            }
            if (
              JSON.parse(talentInfo?.notifications as string).includes(type)
            ) {
              setLoading(true);
              const notification: string[] = [];

              JSON.parse(talentInfo?.notifications as string).forEach(
                (e: any) => {
                  if (e !== type) {
                    notification.push(e);
                  }
                }
              );
              await updateNotification(talentInfo?.id as string, notification);
              await updateTalent();
              setLoading(false);
            }
            setLoading(true);
            await updateNotification(talentInfo?.id as string, [
              ...JSON.parse(talentInfo?.notifications as string),
              type,
            ]);
            await updateTalent();
            Mixpanel.track('notification_added', {
              category: type,
              name: `${talentInfo?.firstname} ${talentInfo?.lastname}`,
            });
            setLoading(false);
          }}
          variant="solid"
        >
          Notify Me
        </Button>
        <Toaster />
      </Flex>
    </>
  );
};
