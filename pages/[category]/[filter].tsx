import {
  Box,
  Button,
  Flex,
  Text,
  Image,
  Center,
  Link,
  VStack,
  useMediaQuery,
  useDisclosure,
} from '@chakra-ui/react';
import type { GetServerSideProps, NextPage } from 'next';
import NavHome from '../../components/home/NavHome';
import moment from 'moment';
import { BellIcon } from '@chakra-ui/icons';
import parse from 'html-react-parser';
//components
import Banner from '../../components/home/Banner';
import SideBar from '../../components/home/SideBar';

import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import {
  fetchAll,
  fetchBasicInfo,
  findTalentPubkey,
  updateNotification,
} from '../../utils/functions';
import { MultiSelectOptions } from '../../constants';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { type } from 'os';
import { userStore } from '../../store/user';
import { CreateProfileModal } from '../../components/modals/createProfile';
import { TalentStore } from '../../store/talent';
import toast, { Toaster } from 'react-hot-toast';
import { TiTick } from 'react-icons/ti';
import { useWallet } from '@solana/wallet-adapter-react';
import { EarningModal } from '../../components/modals/earningModal';

const Home: NextPage = () => {
  const router = useRouter();
  const { connected } = useWallet();
  const { talentInfo } = TalentStore();
  const { userInfo } = userStore();
  const listings = useQuery(
    ['all', 'listings', router.query.search ?? '', router.query.filter ?? ''],
    ({ queryKey }) => fetchAll(queryKey[2] as string, queryKey[3] as string)
  );
  const listingBasic = useQuery({
    queryFn: () => fetchBasicInfo(),
    queryKey: ['all', 'basic'],
  });
  const [isLessThan1200px] = useMediaQuery('(max-width: 1200px)');
  const [isLessThan850px] = useMediaQuery('(max-width: 850px)');
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    let html = document.querySelector('html');
    try {
      if (isLessThan768px) {
        html!.style.fontSize = '100%';
      } else if (isLessThan850px) {
        html!.style.fontSize = '60%';
      } else if (isLessThan1200px) {
        html!.style.fontSize = '70%';
      } else {
        html!.style.fontSize = '100%';
      }
    } catch (error) {
      console.log(error);
    }
  }, [isLessThan1200px, isLessThan850px, isLessThan768px]);
  const listingsType = [
    'Design',
    'Growth',
    'Content',
    'Frontend Development',
    'Backend Development',
    'Contract Development',
  ];
  return (
    <>
      {!isLessThan768px && <NavHome />}
      <Flex
        w={'100%'}
        h={'max-content'}
        minH={'100vh'}
        bg={'white'}
        pt={'3.5rem'}
        justifyContent={'center'}
      >
        {router.asPath.includes('search') ? (
          <Box>
            <Flex w={['full', 'full', '50rem', '50rem']} gap={1}>
              <Text color={'#64748B'}>
                Found{' '}
                {(listings.data?.bounty.length as number) +
                  (listings.data?.jobs.length as number) +
                  (listings.data?.grants.length as number)}{' '}
                opportunities matching{' '}
              </Text>
              <Text color={'#1E293B'}>{"'" + router.query.search + "'"}</Text>
            </Flex>
            {/* <CategoryBanner /> */}
            <VStack mt={'2rem'} gap={5}>
              {listings.data?.bounty?.map((bounty) => {
                return (
                  <Bounties
                    amount={bounty.bounty?.amount}
                    key={bounty.bounty?.id}
                    description={bounty.bounty?.description}
                    due={bounty.bounty?.deadline}
                    title={bounty.bounty?.title}
                    logo={bounty.sponsorInfo?.logo}
                  />
                );
              })}

              {listings.data?.jobs?.map((job) => {
                return (
                  <Jobs
                    logo={job.sponsorInfo.logo}
                    description={job.jobs.description}
                    max={job.jobs.maxSalary}
                    min={job.jobs.minSalary}
                    key={job.jobs.id}
                    skills={JSON.parse(job.jobs.skills)}
                    title={job.jobs.title}
                  />
                );
              })}

              {listings.data?.grants?.map((grant) => {
                return (
                  <Grants
                    description={grant.grants.description}
                    logo={grant.sponsorInfo.logo}
                    key={grant.grants.id}
                    max={grant.grants.maxSalary}
                    title={grant.grants.title}
                    min={grant.grants.minSalary}
                  />
                );
              })}
            </VStack>
          </Box>
        ) : (
          <Box>
            {connected ? (
              userInfo?.talent ? (
                <>
                  <Text
                    fontFamily={'Domine'}
                    fontWeight={700}
                    fontSize={'26px'}
                    color={'#1E293B'}
                  >
                    Welcome back,{talentInfo?.username}
                  </Text>
                </>
              ) : (
                ''
              )
            ) : (
              <>
                <Banner />
              </>
            )}
            {router.query.filter && (
              <CategoryBanner
                type={
                  listingsType.find((type) =>
                    type
                      .toLocaleLowerCase()
                      .includes(router.query.filter as string)
                  ) as string
                }
              />
            )}
            <Box mt={'2rem'}>
              <ListingSection
                type="bounties"
                title="Active Bounties"
                sub="Bite sized tasks for freelancers"
                emoji="/assets/home/emojis/moneyman.png"
              >
                {listings.data?.bounty?.map((bounty) => {
                  return (
                    <Bounties
                      amount={bounty.bounty?.amount}
                      key={bounty.bounty?.id}
                      description={bounty.bounty?.description}
                      due={bounty.bounty?.deadline}
                      title={bounty.bounty?.title}
                      logo={bounty.sponsorInfo?.logo}
                    />
                  );
                })}
              </ListingSection>
              <ListingSection
                type="jobs"
                title="Jobs"
                sub="Join a high-growth team"
                emoji="/assets/home/emojis/job.png"
              >
                {listings.data?.jobs?.map((job) => {
                  return (
                    <Jobs
                      logo={job.sponsorInfo.logo}
                      description={job.jobs.description}
                      max={job.jobs.maxSalary}
                      min={job.jobs.minSalary}
                      key={job.jobs.id}
                      skills={JSON.parse(job.jobs.skills)}
                      title={job.jobs.title}
                    />
                  );
                })}
              </ListingSection>
              <ListingSection
                type="grants"
                title="Grants"
                sub="Equity-free funding opportunities for builders"
                emoji="/assets/home/emojis/grants.png"
              >
                {listings.data?.grants?.map((grant) => {
                  return (
                    <Grants
                      description={grant.grants.description}
                      logo={grant.sponsorInfo.logo}
                      key={grant.grants.id}
                      max={grant.grants.maxSalary}
                      title={grant.grants.title}
                      min={grant.grants.minSalary}
                    />
                  );
                })}
              </ListingSection>
            </Box>
          </Box>
        )}
        {!isLessThan768px && (
          <SideBar
            total={listingBasic.data?.total ?? 0}
            listings={listingBasic.data?.count ?? 0}
            jobs={listings.data?.jobs}
          />
        )}
      </Flex>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { query } = context;
  try {
    await queryClient.prefetchQuery(['all', 'listings'], () =>
      fetchAll(query.search as string, query.filter as string)
    );
    await queryClient.prefetchQuery(['all', 'basic'], () => fetchBasicInfo());
  } catch (error) {
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default Home;

type ListingSectionProps = {
  children?: React.ReactNode;
  title: string;
  sub: string;
  emoji: string;
  type: 'bounties' | 'jobs' | 'grants';
};

const ListingSection = ({
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
          ? router.query.category === (type as string)
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
}
const Bounties = ({ amount, description, due, logo, title }: BountyProps) => {
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
          {title}
        </Text>
        <Text
          fontWeight={'400'}
          color={'#64748B'}
          fontSize={{ md: '0.875rem', base: '0.7688rem' }}
          w={'full'}
          noOfLines={1}
        >
          {parse(JSON.parse(description).slice(0, 100))}
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'0.1969rem'}
            w={'0.8125rem'}
            h={'0.8125rem'}
            alt=""
            src="/assets/landingsponsor/icons/usdc.svg"
          />
          <Text color={'#334155'} fontWeight={'600'} fontSize={'0.8125rem'}>
            ${amount}
          </Text>
          <Text color={'#CBD5E1'} mx={'0.5rem'} fontSize={'0.75rem'}>
            |
          </Text>
          <Text color={'#64748B'} fontSize={'0.75rem'}>
            {moment(due).fromNow()}
          </Text>
        </Flex>
      </Flex>
      <Link
        ml={'auto'}
        href={
          `https://earn-frontend-v2.vercel.app/listings/bounties/` +
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
interface JobsProps {
  title: string;
  description: string;
  max: number;
  min: number;
  skills: MultiSelectOptions[];
  logo: string;
}
const Jobs = ({ description, max, min, skills, title, logo }: JobsProps) => {
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
            {max.toLocaleString()}-{min.toLocaleString()}
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
const Grants = ({ description, title, logo, max, min }: GrantsProps) => {
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

const CategoryBanner = ({ type }: { type: string }) => {
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
    'Contract Development': {
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
        w={'46.0625rem'}
        h={'7.375rem'}
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
        <Box w={'60%'}>
          <Text fontWeight={'700'} fontFamily={'Domine'}>
            {type}
          </Text>
          <Text fontSize={'0.875rem'} color={'#64748B'}>
            {categoryAssets[type].desc}
          </Text>
        </Box>
        <Button
          ml={'auto'}
          my={'auto'}
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
