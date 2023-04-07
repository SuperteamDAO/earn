import { BellIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  Image,
  Link,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import moment from 'moment';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { TiTick } from 'react-icons/ti';
import { MultiSelectOptions } from '../../constants';
import { BountyStatus } from '../../interface/types';
import { TalentStore } from '../../store/talent';
import { userStore } from '../../store/user';
import { findTalentPubkey, updateNotification } from '../../utils/functions';
import { EarningModal } from '../modals/earningModal';
import parse from 'html-react-parser';
import { useRouter } from 'next/router';
import { tokenList } from '../../constants/index';

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
      w={{ md: '46.0625rem', base: '100%' }}
      mt={'1rem'}
      mb={'2.8125rem'}
      mx={'auto'}
    >
      <Flex
        borderBottom={'0.0625rem solid #E2E8F0'}
        pb={'0.75rem'}
        mb={'0.875rem'}
        alignItems={'center'}
      >
        <Image
          w={'1.4375rem'}
          h={'1.4375rem'}
          mr={'0.75rem'}
          alt=""
          src={emoji}
        />
        <Text
          fontSize={{ base: '14px', md: '16px' }}
          color={'#334155'}
          fontWeight={'600'}
        >
          {title}
        </Text>
        <Text color={'#CBD5E1'} mx={'0.625rem'}>
          |
        </Text>
        <Text fontSize={{ base: '12px', md: '14px' }} color={'#64748B'}>
          {sub}
        </Text>
      </Flex>
      <Flex direction={'column'} rowGap={'2.625rem'}>
        {children}
      </Flex>
    </Box>
  );
};

interface BountyProps {
  title: string;
  description: string;
  amount: string;
  due: string;
  logo: string;
  status: BountyStatus;
  token: string;
  slug: string;
}
export const BountiesCard = ({
  amount,
  description,
  due,
  status,
  logo,
  title,
  token,
  slug,
}: BountyProps) => {
  return (
    <Flex w={{ base: '100%', md: '46.125rem' }} h={'3.9375rem'}>
      <Image
        mr={'1.375rem'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph1.png'}
        w={'3.9375rem'}
        h={'3.9375rem'}
        alt={''}
      />
      <Flex direction={'column'} w={'full'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} color={'#334155'} fontSize={'1rem'}>
          {textLimiter(title, 30)}
        </Text>
        <Text
          fontWeight={'400'}
          color={'#64748B'}
          fontSize={{ md: '0.875rem', base: '0.7688rem' }}
          w={'full'}
          noOfLines={1}
        >
          {parse(
            description.startsWith('"')
              ? JSON.parse(description).slice(0, 100)
              : description.slice(0, 100)
          )}
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'0.1969rem'}
            w={'0.8125rem'}
            h={'0.8125rem'}
            alt=""
            rounded={'full'}
            src={
              tokenList.find((ele) => {
                return ele.mintAddress == token;
              })?.icon
            }
          />

          <Text color={'#334155'} fontWeight={'600'} fontSize={'0.8125rem'}>
            {amount}
          </Text>
          <Text color={'#CBD5E1'} mx={'0.5rem'} fontSize={'0.75rem'}>
            |
          </Text>
          <Text color={'#64748B'} fontSize={'0.75rem'}>
            {moment(due).fromNow().includes('ago')
              ? 'Closed ' + moment(due).fromNow()
              : 'Closing ' + moment(due).fromNow()}
          </Text>
        </Flex>
      </Flex>
      <Link
        ml={'auto'}
        href={`https://earn-frontend-v2.vercel.app/listings/bounties/` + slug}
        isExternal
      >
        <Button
          ml={'auto'}
          py={'0.5rem'}
          px={'1.5rem'}
          color={'#94A3B8'}
          bg={'transparent'}
          border={'0.0625rem solid #94A3B8'}
          display={{ base: 'none', md: 'block' }}
        >
          {Number(moment(due).format('x')) < Date.now()
            ? status === 'close'
              ? 'View'
              : 'View'
            : 'Apply'}
        </Button>
      </Link>
    </Flex>
  );
};
interface JobsProps {
  title: string;
  description: string;
  max: number;
  min: number;
  skills: MultiSelectOptions[];
  logo: string;
}
export const JobsCard = ({
  description,
  max,
  min,
  skills,
  title,
  logo,
}: JobsProps) => {
  return (
    <Flex w={{ base: '100%', md: '46.125rem' }} h={'3.9375rem'}>
      <Image
        mr={'1.375rem'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph2.png'}
        w={'3.9375rem'}
        h={'3.9375rem'}
        alt={''}
      />
      <Flex direction={'column'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} color={'#334155'} fontSize={'1rem'}>
          {title}
        </Text>
        <Text
          fontWeight={'400'}
          color={'#64748B'}
          fontSize={{ md: '0.875rem', base: '0.7688rem' }}
        >
          {parse(JSON.parse(description).slice(0, 100))}
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'0.1969rem'}
            h={'0.875rem'}
            w={'0.875rem'}
            alt=""
            src="/assets/icons/dollar.svg"
          />
          <Text color={'#64748B'} fontSize={'0.75rem'} mr={'0.6875rem'}>
            {min.toLocaleString()} - {max.toLocaleString()}
          </Text>
          <Text color={'#64748B'} fontSize={'0.75rem'} mr={'0.6875rem'}>
            0.02% Equity
          </Text>
          {skills.slice(0, 3).map((e) => {
            return (
              <Text
                display={{ base: 'none', md: 'block' }}
                key={''}
                color={'#64748B'}
                fontSize={'0.75rem'}
                mr={'0.6875rem'}
              >
                {e.label}
              </Text>
            );
          })}
        </Flex>
      </Flex>
      <Link
        ml={'auto'}
        href={
          `https://earn-frontend-v2.vercel.app/listings/jobs/` +
          title.split(' ').join('-')
        }
        isExternal
      >
        <Button
          ml={'auto'}
          py={'0.5rem'}
          px={'1.5rem'}
          color={'#94A3B8'}
          bg={'transparent'}
          border={'0.0625rem solid #94A3B8'}
          display={{ base: 'none', md: 'block' }}
        >
          Apply
        </Button>
      </Link>
    </Flex>
  );
};

interface GrantsProps {
  title: string;
  description: string;
  logo: string;
  max: number;
  min: number;
}
export const GrantsCard = ({
  description,
  title,
  logo,
  max,
  min,
}: GrantsProps) => {
  return (
    <Flex w={{ base: '100%', md: '46.125rem' }} h={'3.9375rem'}>
      <Image
        mr={'1.375rem'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph3.png'}
        w={'3.9375rem'}
        h={'3.9375rem'}
        alt={''}
      />
      <Flex direction={'column'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} color={'#334155'} fontSize={'1rem'}>
          {title}
        </Text>
        <Text
          fontWeight={'400'}
          color={'#64748B'}
          fontSize={{ md: '0.875rem', base: '0.7688rem' }}
        >
          {parse(JSON.parse(description).slice(0, 100))}
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'0.1969rem'}
            h={'0.875rem'}
            w={'0.875rem'}
            alt=""
            src="/assets/icons/dollar.svg"
          />
          <Text color={'#64748B'} fontSize={'0.75rem'} mr={'0.6875rem'}>
            {max.toLocaleString()} - {min.toLocaleString()}
          </Text>
        </Flex>
      </Flex>
      <Link
        ml={'auto'}
        href={
          `https://earn-frontend-v2.vercel.app/listings/grants/` +
          title.split(' ').join('-')
        }
        isExternal
      >
        <Button
          ml={'auto'}
          py={'0.5rem'}
          px={'1.5rem'}
          color={'#94A3B8'}
          bg={'transparent'}
          border={'0.0625rem solid #94A3B8'}
          display={{ base: 'none', md: 'block' }}
        >
          Apply
        </Button>
      </Link>
    </Flex>
  );
};

type categoryAssetsType = {
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
  let categoryAssets: categoryAssetsType = {
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
      return;
    }
    return setTalentInfo(talent.data);
  };
  return (
    <>
      {isOpen && <EarningModal isOpen={isOpen} onClose={onClose} />}
      <Flex
        p={'1.5rem'}
        rounded={'lg'}
        backgroundSize={'contain'}
        w={{ md: '46.0625rem', base: '24.125rem' }}
        h={{ md: '7.375rem', base: 'fit-content' }}
        flexDirection={{ md: 'row', base: 'column' }}
        mt={'1.5625rem'}
        bg={`url('${categoryAssets[type].bg}')`}
      >
        <Center
          mr={'1.0625rem'}
          bg={categoryAssets[type].color}
          w={'3.6875rem'}
          h={'3.6875rem'}
          rounded={'md'}
        >
          <Image src={categoryAssets[type].icon} />
        </Center>
        <Box w={{ md: '60%', base: '100%' }} mt={{ base: '1rem', md: '0' }}>
          <Text fontWeight={'700'} fontFamily={'Domine'}>
            {type}
          </Text>
          <Text fontSize={'0.875rem'} color={'#64748B'}>
            {categoryAssets[type].desc}
          </Text>
        </Box>
        <Button
          ml={{ base: '', md: 'auto' }}
          my={{ base: '', md: 'auto' }}
          mt={{ base: '1rem', md: '' }}
          px={'1rem'}
          fontWeight={'300'}
          border={'0.0625rem solid #CBD5E1'}
          color={'#94A3B8'}
          isLoading={loading}
          leftIcon={
            JSON.parse(talentInfo?.notifications ?? '[]').includes(type) ? (
              <TiTick />
            ) : (
              <BellIcon />
            )
          }
          bg={'white'}
          variant="solid"
          onClick={async () => {
            if (!userInfo?.talent) {
              return onOpen();
            }
            if (
              JSON.parse(talentInfo?.notifications as string).includes(type)
            ) {
              setLoading(true);
              const notification: string[] = [];

              JSON.parse(talentInfo?.notifications as string).map((e: any) => {
                if (e !== type) {
                  notification.push(e);
                }
              });
              await updateNotification(talentInfo?.id as string, notification);
              await updateTalent();
              return setLoading(false);
            }
            setLoading(true);
            await updateNotification(talentInfo?.id as string, [
              ...JSON.parse(talentInfo?.notifications as string),
              type,
            ]);
            await updateTalent();
            setLoading(false);
          }}
        >
          Notify Me
        </Button>
        <Toaster />
      </Flex>
    </>
  );
};

const textLimiter = (text: string, len: number) => {
  if (text.length > len) {
    return text.slice(0, len) + '...';
  }
  return text;
};
