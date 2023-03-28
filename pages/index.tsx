import { Box, Button, Flex, Text, Image, Center, Link } from '@chakra-ui/react';
import type { GetServerSideProps, NextPage } from 'next';
import NavHome from '../components/home/NavHome';
import moment from 'moment';
import { BellIcon } from '@chakra-ui/icons';

//components
import Banner from '../components/home/Banner';
import SideBar from '../components/home/SideBar';

import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import { fetchAll } from '../utils/functions';
import { MultiSelectOptions } from '../constants';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const listings = useQuery(['all', 'listings'], () => fetchAll());
  const router = useRouter();
  return (
    <>
      <NavHome />
      <Flex
        w={'100%'}
        h={'max-content'}
        minH={'100vh'}
        bg={'white'}
        pt={'3.5rem'}
        justifyContent={'center'}
      >
        <Box>
          <Banner />
          {/* <CategoryBanner /> */}
          <Box mt={'32px'}>
            <ListingSection
              type="bounties"
              title="Active Bounties"
              sub="Bite sized tasks for freelancers"
              emoji="/assets/home/emojis/moneyman.png"
            >
              {listings.data?.bounties?.map((bounty) => {
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
                    description=""
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
                    description=""
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
        <SideBar
          total={''}
          listings={
            (listings.data?.bounties.length as number) +
            (listings.data?.jobs.length as number) +
            (listings.data?.grants.length as number)
          }
          jobs={listings.data?.jobs}
        />
      </Flex>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery(['all', 'listings'], () => fetchAll());
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
        router.asPath !== '/'
          ? router.query.type === (type as string)
            ? 'block'
            : 'none'
          : 'block'
      }
      w={'737px'}
      mt={'1rem'}
      mb={'45px'}
    >
      <Flex borderBottom={'1px solid #E2E8F0'} pb={'12px'} mb={'14px'}>
        <Image mr={'12px'} alt="" src={emoji} />
        <Text color={'#334155'} fontWeight={'600'}>
          {title}
        </Text>
        <Text color={'#CBD5E1'} mx={'10px'}>
          |
        </Text>
        <Text color={'#64748B'}>{sub}</Text>
      </Flex>
      <Flex direction={'column'} rowGap={'42px'}>
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
    <Flex w={'738px'} h={'63px'}>
      <Image
        mr={'22px'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph1.png'}
        w={'63px'}
        h={'63px'}
        alt={''}
      />
      <Flex direction={'column'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} color={'#334155'} fontSize={'16px'}>
          {title}
        </Text>
        <Text fontWeight={'400'} color={'#64748B'} fontSize={'14px'}>
          We’re looking to design gum’s landing page from a....
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'3.15px'}
            w={'13px'}
            h={'13px'}
            alt=""
            src="/assets/landingsponsor/icons/usdc.svg"
          />
          <Text color={'#334155'} fontWeight={'600'} fontSize={'13px'}>
            ${amount}
          </Text>
          <Text color={'#CBD5E1'} mx={'8px'} fontSize={'12px'}>
            |
          </Text>
          <Text color={'#64748B'} fontSize={'12px'}>
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
          py={'8px'}
          px={'24px'}
          color={'#94A3B8'}
          bg={'transparent'}
          border={'1px solid #94A3B8'}
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
    <Flex w={'738px'} h={'63px'}>
      <Image
        mr={'22px'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph2.png'}
        w={'63px'}
        h={'63px'}
        alt={''}
      />
      <Flex direction={'column'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} color={'#334155'} fontSize={'16px'}>
          {title}
        </Text>
        <Text fontWeight={'400'} color={'#64748B'} fontSize={'14px'}>
          We’re looking to design gum’s landing page from a....
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'3.15px'}
            h={'14px'}
            w={'14px'}
            alt=""
            src="/assets/icons/dollar.svg"
          />
          <Text color={'#64748B'} fontSize={'12px'} mr={'11px'}>
            {max.toLocaleString()}-{min.toLocaleString()}
          </Text>
          <Text color={'#64748B'} fontSize={'12px'} mr={'11px'}>
            0.02% Equity
          </Text>
          {skills.slice(0, 3).map((e) => {
            return (
              <Text key={''} color={'#64748B'} fontSize={'12px'} mr={'11px'}>
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
          py={'8px'}
          px={'24px'}
          color={'#94A3B8'}
          bg={'transparent'}
          border={'1px solid #94A3B8'}
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
    <Flex w={'738px'} h={'63px'}>
      <Image
        mr={'22px'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph3.png'}
        w={'63px'}
        h={'63px'}
        alt={''}
      />
      <Flex direction={'column'} justifyContent={'space-between'}>
        <Text fontWeight={'600'} color={'#334155'} fontSize={'16px'}>
          {title}
        </Text>
        <Text fontWeight={'400'} color={'#64748B'} fontSize={'14px'}>
          We’re looking to design gum’s landing page from a....
        </Text>
        <Flex alignItems={'center'}>
          <Image
            mr={'3.15px'}
            h={'14px'}
            w={'14px'}
            alt=""
            src="/assets/icons/dollar.svg"
          />
          <Text color={'#64748B'} fontSize={'12px'} mr={'11px'}>
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
          py={'8px'}
          px={'24px'}
          color={'#94A3B8'}
          bg={'transparent'}
          border={'1px solid #94A3B8'}
        >
          Apply
        </Button>
      </Link>
    </Flex>
  );
};

const CategoryBanner = () => {
  return (
    <Flex
      p={'24px'}
      rounded={'lg'}
      backgroundSize={'contain'}
      w={'737px'}
      h={'118px'}
      mt={'25px'}
      bg={"url('/assets/home/display/bg_frontend.png')"}
    >
      <Center mr={'17px'} bg={'#FEA8EB'} w={'59px'} h={'59px'} rounded={'md'}>
        <Image src="/assets/home/category/frontend.png" />
      </Center>
      <Box w={'60%'}>
        <Text fontWeight={'700'} fontFamily={'Domine'}>
          Frontend Development
        </Text>
        <Text fontSize={'14px'} color={'#64748B'}>
          If you are a pixel-perfectionist who creates interfaces that users
          love, check out the earning opportunities below.
        </Text>
      </Box>
      <Button
        ml={'auto'}
        my={'auto'}
        px={'16px'}
        fontWeight={'300'}
        border={'1px solid #CBD5E1'}
        color={'#94A3B8'}
        leftIcon={<BellIcon />}
        bg={'white'}
        variant="solid"
      >
        Notify Me
      </Button>
    </Flex>
  );
};
