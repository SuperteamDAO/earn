import { Box, Flex, Icon } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { LuCheck, LuClock, LuHourglass } from 'react-icons/lu';

import {
  AmtBarChart,
  NumberStatCard,
  type PaymentData,
  PaymentTable,
  QuickLinks,
  RegionalTable,
  SearchInput,
  type STATUS,
  StatusFilter,
  type TIMEFRAME,
  TimeRangeDropdown,
  TsxPieChart,
  type TSXTYPE,
} from '@/features/mission-control';
import { MissionControl } from '@/layouts/MissionControl';

const regionalPaymentData = [
  { id: 1, name: 'India', paid: 1220000, acceptedPercentage: 95.43 },
  { id: 2, name: 'Vietnam', paid: 1200000, acceptedPercentage: 80.34 },
  { id: 3, name: 'Turkey', paid: 925000, acceptedPercentage: 75.32 },
  { id: 4, name: 'Germany', paid: 565000, acceptedPercentage: 60.43 },
  { id: 5, name: 'Nigeria', paid: 125500, acceptedPercentage: 80.43 },
];

const tsxData: { name: string; value: number; color: string; type: TSXTYPE }[] =
  [
    { name: 'Grants', value: 234000, color: '#36A2EB', type: 'grants' },
    { name: 'Events', value: 44000, color: '#4BC0C0', type: 'st-earn' },
    {
      name: 'Contractors',
      value: 19600,
      color: '#97C95C',
      type: 'miscellaneous',
    },
  ];

const monthlyAmtData = [
  { name: 'Jan', value: 550000 },
  { name: 'Feb', value: 2000000 },
  { name: 'Mar', value: 1750000 },
  { name: 'Apr', value: 700000 },
  { name: 'May', value: 1300000 },
  { name: 'Jun', value: 1150000 },
  { name: 'July', value: 1500000 },
  { name: 'Aug', value: 1300000 },
  { name: 'Sept', value: 1900000 },
  { name: 'Oct', value: 550000 },
  { name: 'Nov', value: 900000 },
  { name: 'Dec', value: 2000000 },
];

export const dummyPaymentData: PaymentData[] = [
  {
    id: '1',
    title: 'Solana Foundation Grant Payment',
    name: 'John Doe',
    type: 'grants',
    date: new Date('2023-09-15'),
    amount: 10000,
    tokenSymbol: 'USDC',
    status: 'pending',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'john.doe@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'JohnDoe#1234',
  },
  {
    id: '2',
    title: 'Rust Development Bounty',
    name: 'Jane Smith',
    type: 'st-earn',
    date: new Date('2023-09-20'),
    amount: 8000,
    tokenSymbol: 'USDC',
    status: 'processing',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'jane.smith@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'JaneSmith#5678',
  },
  {
    id: '3',
    title: 'Hackathon Prize',
    name: 'Alex Johnson',
    type: 'st-earn',
    date: new Date('2023-09-25'),
    amount: 2000,
    tokenSymbol: 'USDC',
    status: 'paid',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'alex.johnson@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'AlexJohnson#9101',
  },
  {
    id: '4',
    title: 'Community Event Sponsorship',
    name: 'Sarah Brown',
    type: 'miscellaneous',
    date: new Date('2023-09-30'),
    amount: 9000,
    tokenSymbol: 'USDC',
    status: 'rejected',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'sarah.brown@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'SarahBrown#1121',
  },
  {
    id: '5',
    title: 'Smart Contract Audit RFP',
    name: 'Michael Lee',
    type: 'miscellaneous',
    date: new Date('2023-10-05'),
    amount: 19000,
    tokenSymbol: 'USDC',
    status: 'pending',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'michael.lee@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'MichaelLee#3141',
  },
  {
    id: '6',
    title: 'DeFi Integration Bounty',
    name: 'Emma Wilson',
    type: 'st-earn',
    date: new Date('2023-10-10'),
    amount: 29000,
    tokenSymbol: 'USDC',
    status: 'processing',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'emma.wilson@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'EmmaWilson#5161',
  },
  {
    id: '7',
    title: 'NFT Marketplace Development',
    name: 'David Clark',
    type: 'grants',
    date: new Date('2023-10-15'),
    amount: 5000,
    tokenSymbol: 'USDC',
    status: 'paid',
    kycLink:
      'https://imageservice-prod.jv-internal.com/2/stream?domain=fightful-frontend-prod.jv-internal.com&path=/131267_12cd965b28ac2b45-600x338-2_1709951453.jpg&op=crop&w=1200&h=800',
    email: 'david.clark@example.com',
    walletAddress: '255qB7tHoL1o2dnHfZZaeBQHYPpCwJpRQ5RSXwUUsCVi',
    discordId: 'DavidClark#7181',
  },
];

const quickLinks = [
  {
    text: 'Community GDP',
    href: 'https://playbook.superteam.fun/community-gdp',
  },
  {
    text: 'Payment Pipeline Process',
    href: 'https://playbook.superteam.fun/guides/payment-pipeline-process',
  },
  {
    text: 'ST Points of Contact',
    href: 'https://playbook.superteam.fun/guides/points-of-contact',
  },
  { text: 'Stats Dashboard', href: 'https://stats.superteam.fun/login' },
  { text: 'Reputation Dashboard', href: 'https://reputation.superteam.fun/' },
  {
    text: 'Superteam Operations Guide',
    href: 'https://playbook.superteam.fun/guides/guide-to-superteam-operations',
  },
  {
    text: 'Global Link Repository',
    href: 'https://playbook.superteam.fun/guides/global-link-repository',
  },
];

interface Props {
  span: TIMEFRAME;
  status: STATUS;
}

export default function MissionControlPage({ span, status }: Props) {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [loading, setLoading] = useState(false);

  const serverSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', value);
    startTransition(() => {
      router.replace('?' + params.toString(), undefined, { scroll: false });
    });
  };

  const debouncedServerSearch = useCallback(debounce(serverSearch, 500), []);

  useEffect(() => {
    debouncedServerSearch(query);
    setLoading(false);
    return () => {
      debouncedServerSearch.cancel();
    };
  }, [query]);

  return (
    <MissionControl>
      <Flex direction="column" gap={6}>
        <Flex gap={6}>
          <NumberStatCard
            title="Total Paid"
            amount={1223000}
            iconBg="green.100"
          >
            <Flex
              align="center"
              justify="center"
              p={1}
              color="white"
              bg="green.600"
              borderRadius="full"
              rounded={'full'}
            >
              <Icon as={LuCheck} strokeWidth={3} />
            </Flex>
          </NumberStatCard>
          <NumberStatCard
            title="Total Pending"
            amount={1223000}
            iconBg="#FEFCE8"
          >
            <Icon as={LuHourglass} color="#D97706" strokeWidth={3} />
          </NumberStatCard>
          <NumberStatCard
            title="Pending Requests"
            amount={24}
            iconBg="#FEFCE8"
            isUsd={false}
          >
            <Icon as={LuClock} color="#92400E" strokeWidth={3} />
          </NumberStatCard>
          <Box ml="auto">
            <TimeRangeDropdown value={span} />
          </Box>
        </Flex>
        <Flex gap={8}>
          <RegionalTable data={regionalPaymentData} />
          <TsxPieChart data={tsxData} />
        </Flex>

        <Flex gap={8}>
          <AmtBarChart data={monthlyAmtData} />
          <QuickLinks links={quickLinks} />
        </Flex>

        <Flex overflow={'visible'}>
          <StatusFilter status={status}>
            <SearchInput loading={loading} query={query} setQuery={setQuery} />
          </StatusFilter>
        </Flex>
        <Flex>
          <PaymentTable
            data={dummyPaymentData}
            onApprove={() => 0}
            onReject={() => 0}
          />
        </Flex>
      </Flex>
    </MissionControl>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const span: TIMEFRAME =
    ((query.span as string)?.trim() as TIMEFRAME) || 'all';
  const status: STATUS = ((query.status as string)?.trim() as STATUS) || 'all';
  const q: string = (query.query as string) || '';

  return {
    props: {
      span,
      status,
      query: q,
    },
  };
};
