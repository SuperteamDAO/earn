import { Box, Flex, Icon } from '@chakra-ui/react';
import { type Redis } from '@upstash/redis';
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
  airtableUrlMaker,
  AmtBarChart,
  colors,
  fetchAirtable,
  NumberStatCard,
  type OverviewTotals,
  type PaymentData,
  PaymentTable,
  QuickLinks,
  REDIS_PREFIX,
  RegionalTable,
  type RegionData,
  SearchInput,
  type StatNumbericalData,
  type StatTypeData,
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
import { redis } from '@/redis';
import { dayjs } from '@/utils/dayjs';
import promiser from '@/utils/promiser';

type PieChartTsxData = {
  name: string;
  value: number;
  color: string;
  type: TSXTYPE;
};

type MonthlyAmtData = { name: string; value: number };

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
  numericalData: StatNumbericalData;
  overviewTotals: PieChartTsxData[];
  monthlyApprovedData: MonthlyAmtData[];
  topRegionStats: RegionData[];
  nextOffset?: string[];
}

export default function MissionControlPage({
  span,
  status,
  superteamLists,
  selectedSuperteam,
  paymentData,
  numericalData,
  overviewTotals,
  monthlyApprovedData,
  topRegionStats,
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
            title="Total Approved"
            amount={numericalData.totalPaidAmount}
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
            amount={numericalData.totalPendingAmount}
            iconBg="#FEFCE8"
          >
            <Icon as={LuHourglass} color="#D97706" strokeWidth={3} />
          </NumberStatCard>
          <NumberStatCard
            title="Pending Requests"
            amount={numericalData.totalPendingRequests}
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
          <RegionalTable data={topRegionStats} />
          <TsxPieChart data={overviewTotals} />
        </Flex>

        <Flex gap={8}>
          <AmtBarChart data={monthlyApprovedData} />
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
  const airtableUrl = airtableUrlMaker({
    fields: [
      'Purpose of Payment Main',
      'Submitter',
      'Status',
      'Amount',
      'Name',
      'SOL Wallet',
      'Discord Handle',
      'Application Time',
      'Sync Source',
      'KYC',
      'Contact Email',
      'Region',
      'RecordID',
      'earnApplicationId',
    ],
    sortField: 'Application Time',
    sortDirection: 'desc',
  });
  const [data, dataError] = await promiser(
    fetchAirtable({
      airtableUrl,
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
    throw Error('Could not fetch transactions data from airtable');
  }

  const stats = await redis.get<StatTypeData>(
    `${REDIS_PREFIX}:${selectedSuperteam.value.toLowerCase()}`,
  );
  if (!stats) {
    throw Error('Could not fetch stats data from redis');
  }

  const currentTypeData = stats[type];
  const monthlyApprovedData = currentTypeData?.approvedMonthly;
  const currentSpanData = currentTypeData?.timespan[span] ?? {
    totalPendingRequests: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0,
    acceptedPercentage: 0,
  };

  const overviewTotals: OverviewTotals = {
    grants: stats['grants']?.timespan[span]?.totalPaidAmount ?? 0,
    'st-earn': stats['st-earn']?.timespan[span]?.totalPaidAmount ?? 0,
    miscellaneous: stats['miscellaneous']?.timespan[span]?.totalPaidAmount ?? 0,
  };

  const topRegionStats = await getTopRegionStats(redis, type, span);
  console.log('topRegionStats - ', topRegionStats);

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
      numericalData: currentSpanData,
      overviewTotals: convertOverviewTotals(overviewTotals),
      monthlyApprovedData: convertMonthlyApprovedData(monthlyApprovedData),
      topRegionStats,
    },
  };
};

function convertOverviewTotals(
  overviewTotals: OverviewTotals,
): PieChartTsxData[] {
  return Object.entries(overviewTotals).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value,
    color: colors[type as TSXTYPE],
    type: type as TSXTYPE,
  }));
}

function convertMonthlyApprovedData(
  monthlyApprovedData: Record<string, number>,
): MonthlyAmtData[] {
  const currentDate = dayjs();
  const result: MonthlyAmtData[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = currentDate.subtract(i, 'month');
    const monthKey = monthDate.format('YYYY-MM');

    result.push({
      name: monthDate.format('MMM'),
      value: monthlyApprovedData?.[monthKey] ?? 0,
    });
  }

  console.log('monthly approved data', result);

  return result;
}

async function getTopRegionStats(
  redis: Redis,
  type: TSXTYPE,
  span: TIMEFRAME,
): Promise<RegionData[]> {
  const pipeline = redis.pipeline();

  Superteams.forEach((team) => {
    const key = `${REDIS_PREFIX}:${team.region.toLowerCase()}`;
    pipeline.get(key);
  });

  const results = await pipeline.exec<StatTypeData[]>();

  const regionData: RegionData[] = results
    .map((result, index) => {
      if (result) {
        const typeData = result[type];
        if (typeData && typeData.timespan[span]) {
          const { totalPaidAmount, acceptedPercentage } =
            typeData.timespan[span];
          return {
            name: Superteams[index]?.displayValue,
            icon: Superteams[index]?.icons,
            paid: totalPaidAmount,
            acceptedPercentage,
          };
        }
      }
      return null;
    })
    .filter((stat): stat is RegionData => stat !== null)
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 5);

  return regionData;
}
