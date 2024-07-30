import { Box, Flex, Icon } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { getSession, useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { LuCheck, LuClock, LuHourglass } from 'react-icons/lu';

import { Superteams } from '@/constants/Superteam';
import {
  AmtBarChart,
  fetchAirtable,
  NumberStatCard,
  type PaymentData,
  PaymentTable,
  QuickLinks,
  RegionalTable,
  SearchInput,
  type STATUS,
  StatusFilter,
  type SuperteamOption,
  type TIMEFRAME,
  TimeRangeDropdown,
  TsxPieChart,
  type TSXTYPE,
  updateStatus,
} from '@/features/mission-control';
import { MissionControl } from '@/layouts/MissionControl';
import promiser from '@/utils/promiser';

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
  superteamLists: SuperteamOption[];
  selectedSuperteam: SuperteamOption;
  paymentData: PaymentData[];
  nextOffset?: string[];
}

export default function MissionControlPage({
  span,
  status,
  superteamLists,
  selectedSuperteam,
  paymentData,
}: Props) {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { data: session } = useSession();

  const [paymentDataState, setPaymentData] =
    useState<PaymentData[]>(paymentData);
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

  // useEffect(() => {
  //   if (!session || !session.user.misconRole) {
  //     router.push('/')
  //   }
  //
  // }, [])

  if (!session || !session.user.misconRole) return null;

  const updateStateStatus = (
    id: string,
    status: STATUS,
    approvedAmount?: number,
  ) => {
    console.log('Start updating status');
    const paymentIndex = paymentDataState.findIndex((p) => p.id === id);
    console.log('ID - ', id);
    console.log('paymentIndex - ', paymentIndex);
    if (paymentIndex === -1) {
      toast.error('Payment not found only state no index');
      return;
    }
    const payment = paymentDataState[paymentIndex];
    if (!payment) {
      toast.error('Payment not found only state wrong index');
      return;
    }
    payment.status = status;
    if (approvedAmount) payment.amount = approvedAmount;
    const newPayments = [...paymentDataState];
    newPayments[paymentIndex] = payment;
    setPaymentData(newPayments);
  };

  async function updateStatusWithState(
    id: string,
    status: STATUS,
    approvedAmount?: number,
  ) {
    const payment = paymentDataState.find((p) => p.id === id);
    console.log('ID - ', id);
    console.log('payment data', paymentDataState);
    console.log('payment', payment);
    if (!payment || !payment.recordId || !payment.type) {
      toast.error('Payment not found status with state');
      return;
    }
    const [resp, respErr] = await promiser(
      updateStatus({
        id,
        sourceId: payment.recordId,
        status,
        type: payment.type,
        approvedAmount,
        earnId: payment.earnId ?? undefined,
      }),
    );
    if (respErr || resp.status !== 200) {
      console.log('RESP ERR - ', respErr);
      toast.error('Failed to approve transaction, please try again later');
      return;
    }
    toast.success('Successfully approved transaction');
    updateStateStatus(id, status, approvedAmount);
  }

  return (
    <MissionControl
      superteamList={superteamLists}
      selectedSuperteam={selectedSuperteam}
    >
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
            data={paymentDataState}
            onApprove={(id: string, approvedAmount?: number) => {
              updateStatusWithState(id, 'accepted', approvedAmount);
            }}
            onReject={(id: string) => {
              updateStatusWithState(id, 'rejected');
            }}
          />
        </Flex>
      </Flex>
    </MissionControl>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  console.log('session- ', session?.user.misconRole);
  if (!session || !session.user.misconRole) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const { query } = context;

  const span: TIMEFRAME =
    ((query.span as string)?.trim() as TIMEFRAME) || 'all';
  const status: STATUS = ((query.status as string)?.trim() as STATUS) || 'all';
  const q: string = (query.query as string) || '';
  let region: string | null = (query.region as string) || 'global';
  const type: TSXTYPE = ((query.type as string)?.trim() as TSXTYPE) || 'all';

  const globalLead: SuperteamOption = {
    value: 'global',
    label: 'Global Lead',
    superteam: {
      name: 'Global Lead',
      logo: '/assets/global.png',
    },
  };

  const superteamLists: SuperteamOption[] = Superteams.map((s) => ({
    value: s.region,
    label: s.displayValue,
    superteam: {
      name: s.displayValue,
      logo: s.icons,
    },
  }));

  superteamLists.unshift(globalLead);

  let selectedSuperteam: SuperteamOption;
  if (session.user.misconRole === 'ZEUS') {
    selectedSuperteam =
      superteamLists.find((s) => s.value === region) || globalLead;
  } else {
    region = null;
    const regionTeam = superteamLists.find(
      (s) => s.value.toLowerCase() === session.user.misconRole.toLowerCase(),
    );
    if (!regionTeam) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    } else {
      selectedSuperteam = regionTeam;
    }
  }
  const [data, dataError] = await promiser(
    fetchAirtable({
      pageSize: 5,
      region: selectedSuperteam.value,
      regionKey: 'Region',
      searchTerm: q,
      searchKey: 'Purpose of Payment Main',
      status,
      statusKey: 'Status',
      type,
      typeKey: 'Sync Source',
    }),
  );

  if (dataError) {
    console.log('data error - ', dataError);
    throw Error('Could not fetch data');
  }

  console.log('data - ', data.data);
  console.log('data length - ', data.data.length);
  return {
    props: {
      span,
      status,
      query: q,
      superteamLists:
        session.user.misconRole === 'ZEUS' ? superteamLists : null,
      selectedSuperteam,
      paymentData: data.data,
      nextOffset: data.nextOffset,
    },
  };
};
