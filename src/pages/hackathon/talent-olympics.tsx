import { type SubscribeHackathon } from '@prisma/client';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';
import Countdown from 'react-countdown';
import { FaPlay } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa6';
import { TbBell, TbBellRinging } from 'react-icons/tb';
import { toast } from 'sonner';

import { UserFlag } from '@/components/shared/UserFlag';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';
import { LocalImage } from '@/components/ui/local-image';
import { Tooltip } from '@/components/ui/tooltip';
import { Superteams } from '@/constants/Superteam';
import { tokenList } from '@/constants/tokenList';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { TalentOlympicsHeader } from '@/svg/talent-olympics-header';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

const SLUG = 'talent-olympics';

const base = `/hackathon/talent-olympics/`;
const baseAsset = (filename: string) => base + filename;

const slugLink = (slug: string) => `/listings/hackathon/${slug}`;

const frontendTrack: TrackProps[] = [
  {
    icon: baseAsset('scan.svg'),
    title: 'New Wallet with Swap Functionality',
    description:
      'Create a wallet with the best-in-class integration and swapping experience.',
    amount: 1000,
    token: 'USDC',
    link: slugLink(
      'new-wallet-design-and-swap-functionality-st-talent-olympics',
    ),
  },
  {
    icon: baseAsset('laptop.svg'),
    title: 'Escrow UI + Blink  ',
    description: 'Create a user-friendly escrow UI and a Blink for it.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('escrow-ui-blink-st-talent-olympics'),
  },
  {
    icon: baseAsset('cube.svg'),
    title: 'Oracle Aggregator',

    description:
      'Display Oracle data using multiple sources for a DeFi application.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('oracle-aggregator-st-talent-olympics'),
  },
  {
    icon: baseAsset('cube2.svg'),
    title: 'Tooling Data Explorer/Dashboard',
    description:
      'Make an explorer or dashboard that fetches data from RPC/API sources.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('tooling-data-explorerdashboard-st-talent-olympics'),
  },
  {
    icon: baseAsset('code.svg'),
    title: 'Create a Marketplace UI',
    description:
      'Design and develop a creative marketplace UI using the given smart contract repo.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('create-a-marketplace-ui-st-talent-olympics'),
  },
];

const rustTrack: TrackProps[] = [
  {
    icon: baseAsset('monitor.svg'),
    title: 'NFT Mint, Vault & Swap',
    description: 'Create an Anchor program that can mint, vault and swap NFTs.',
    amount: 1000,
    token: 'USDC',
    link: slugLink(
      'nft-creation-and-vault-integration-with-anchor-st-talent-olympics',
    ),
  },
  {
    icon: baseAsset('git.svg'),
    title: 'DAO Voting Program',
    description:
      'Develop a DAO voting program that displays results, using Anchor.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('dao-voting-program-st-talent-olympics'),
  },
  {
    icon: baseAsset('filegit.svg'),
    title: 'Prediction Market & Blink for Memecoins',
    description:
      'Create a prediction marketplace (binary option model) for SPL memecoin prices.',
    amount: 1000,
    token: 'USDC',
    link: slugLink(
      'prediction-market-and-blink-for-memecoins-st-talent-olympics',
    ),
  },
  {
    icon: baseAsset('book.svg'),
    title: 'Whitelist-gated Token Sale',
    description:
      'Using Native Rust or Anchor, create a whitelist-gated token airdrop.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('whitelist-gated-token-sale-st-talent-olympics'),
  },
  {
    icon: baseAsset('bookmark.svg'),
    title: 'Two-sided Marketplace for Services',
    description:
      'Create a 2-sided marketplace model for services using Anchor or Rust.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('two-sided-marketplace-for-services-st-talent-olympics'),
  },
];

interface Props {
  countryLeaders: CountryLeader[];
  rankings: { user: User; rating: number }[];
}

export default function TalentOlympics({ countryLeaders, rankings }: Props) {
  const START_DATE = '2024-07-10T23:59:59Z';
  const CLOSE_DATE = '2024-07-14T23:59:59Z';

  const [hackathonIsOn, setHackathonIsOn] = useState(false);
  useEffect(() => {
    const hackathonStartTime = dayjs(START_DATE);

    const checkHackathonStatus = () => {
      const now = dayjs.utc();
      if (now.isAfter(hackathonStartTime)) {
        setHackathonIsOn(true);
      }
    };

    checkHackathonStatus();

    const intervalId = setInterval(checkHackathonStatus, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Talent Olympics | Superteam Earn"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <div>
        <Hero START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
        <div className="mx-auto max-w-7xl overflow-x-hidden px-4">
          <GetHiredBy />
        </div>
        <hr className="border-slate-300" />{' '}
        <div className="mx-auto max-w-7xl overflow-x-hidden px-4">
          <About />
        </div>
        <div className="relative w-full bg-slate-50 px-4 py-8">
          <p className="absolute top-32 z-0 hidden rotate-[-90deg] text-7xl font-bold text-slate-300 md:block">
            Tracks
          </p>
          <div className="relative z-[1] mx-auto flex max-w-7xl flex-col justify-center gap-8 overflow-x-hidden md:flex-row">
            <Track
              title="Front End Track"
              tracks={frontendTrack}
              hackathonIsOn={hackathonIsOn}
            />
            <Track
              title="Rust Track"
              tracks={rustTrack}
              hackathonIsOn={hackathonIsOn}
            />
          </div>
        </div>
        <div className="mx-auto max-w-7xl overflow-x-hidden px-4">
          {hackathonIsOn && <Leaderboard leaders={countryLeaders} />}
          <Rankings rankings={rankings} />
          <FAQs />
        </div>
      </div>
    </Default>
  );
}

function Hero({
  START_DATE,
  CLOSE_DATE,
}: {
  START_DATE: string;
  CLOSE_DATE: string;
}) {
  const PoweredByHeight = '2.5rem';
  const isSM = useMediaQuery('(min-width: 640px)');
  const isMD = useMediaQuery('(min-width: 768px)');

  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(START_DATE).toDate(),
  );
  const [status, setStatus] = useState<'Open In' | 'Close In' | 'Closed'>(
    'Open In',
  );

  useEffect(() => {
    function updateStatus() {
      if (dayjs().isAfter(CLOSE_DATE)) {
        setStatus('Closed');
      } else if (dayjs().isAfter(START_DATE)) {
        setCountdownDate(dayjs.utc(CLOSE_DATE).toDate());
        setStatus('Close In');
      }
    }

    const intervalId = setInterval(updateStatus, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className="flex flex-col items-center border-b border-slate-200 bg-cover bg-center bg-no-repeat pb-4 pt-12"
      style={{ backgroundImage: `url('${base}bg.png')` }}
    >
      <TalentOlympicsHeader
        styles={{ height: isSM ? '12rem' : '12rem', width: 'auto' }}
      />
      <p className="mt-4 max-w-sm px-6 text-center font-medium text-white">
        Complete Challenges. Earn Prizes. <br /> Get a Full-Time Job.
      </p>
      <div className="mb-1 mt-6 flex flex-col items-center gap-3 sm:gap-6 md:flex-row">
        <div className="flex w-full gap-5 md:w-auto">
          <Button
            className="w-full rounded-full bg-brand-purple px-6 text-sm text-white hover:bg-brand-purple/90 active:bg-[#6366D1] md:w-auto"
            asChild
          >
            <Link
              className="flex items-center gap-2"
              href="https://discord.gg/5agsprjsj4"
              target="_blank"
            >
              <FaDiscord className="h-5 w-5" />
              Join Discord
            </Link>
          </Button>

          {!isMD && <SubscribeHackathon />}
        </div>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-full bg-black/40 px-6 text-sm md:w-auto',
            'pointer-events-none',
            status === 'Close In' ? 'text-[#39FFC1]' : 'text-slate-200',
          )}
        >
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              status === 'Close In' ? 'bg-[#39FFC1]' : 'bg-slate-200',
            )}
          />
          <p className="font-medium">
            Submissions {status}{' '}
            {status !== 'Closed' && (
              <Countdown
                date={countdownDate}
                renderer={CountDownRenderer}
                zeroPadDays={1}
              />
            )}
          </p>
        </button>
        {isMD && <SubscribeHackathon />}
      </div>
      <p className="mt-4 text-xxs text-white">POWERED BY</p>
      <div className="my-4 flex items-center gap-8">
        <ExternalImage
          style={{ height: PoweredByHeight }}
          alt="Web3 Builders Alliance"
          src={'/company-logos/turbine.svg'}
          className="w-[5rem] sm:w-[7rem]"
        />
        <ExternalImage
          className="w-[5rem] sm:w-[7rem]"
          alt="Superteam"
          src={'/company-logos/superteam.svg'}
          style={{ height: PoweredByHeight }}
        />
        <ExternalImage
          className="w-[5rem] sm:w-[7rem]"
          alt="Rise In"
          src={'/company-logos/rise-in.svg'}
          style={{ height: PoweredByHeight }}
        />
      </div>
    </div>
  );
}

function GetHiredBy() {
  const base = '/company-logos/';
  const baseAsset = (filename: string) => base + filename;

  const hiredBy: { name: string; src: string }[] = [
    {
      name: 'Mirron World',
      src: baseAsset('mirror-world.svg'),
    },
    {
      name: 'Pyth',
      src: baseAsset('pyth2.svg'),
    },
    {
      name: 'Rise In',
      src: baseAsset('rise-in-dark.svg'),
    },
    {
      name: 'Metawealth',
      src: baseAsset('metawealth.png'),
    },
    {
      name: 'Galxe',
      src: baseAsset('galxe.svg'),
    },
    {
      name: 'Sanctum',
      src: baseAsset('sanctum.svg'),
    },
    {
      name: 'Tensor',
      src: baseAsset('tensor.svg'),
    },
    {
      name: 'Metaplex',
      src: baseAsset('metaplex.svg'),
    },
    {
      name: 'Helio',
      src: baseAsset('helio.svg'),
    },
    {
      name: 'Helius',
      src: baseAsset('helius.svg'),
    },
    {
      name: 'Flash Trade',
      src: baseAsset('flash-trade.svg'),
    },
    {
      name: 'Jito Labs',
      src: baseAsset('jito-labs.svg'),
    },
    {
      name: 'Khiza',
      src: baseAsset('khiza.svg'),
    },
    {
      name: 'Open Book',
      src: baseAsset('open-book.svg'),
    },
    {
      name: 'Orca',
      src: baseAsset('orca.svg'),
    },
    {
      name: 'Drift',
      src: baseAsset('drift.svg'),
    },
    {
      name: 'Squads',
      src: baseAsset('squads.svg'),
    },
    {
      name: 'Mango Markets',
      src: baseAsset('mango-markets.svg'),
    },
    {
      name: 'Kamino',
      src: baseAsset('kamino.svg'),
    },
    {
      name: 'Solana Beach',
      src: baseAsset('solana-beach.svg'),
    },
    {
      name: 'Turbine',
      src: baseAsset('turbine2.svg'),
    },
    {
      name: 'Iron',
      src: baseAsset('iron.svg'),
    },
    {
      name: 'Bandit Network',
      src: baseAsset('bandit-network.svg'),
    },
    {
      name: 'Trustless Engineering',
      src: baseAsset('trustless-engineering.svg'),
    },
    {
      name: 'Bonk',
      src: baseAsset('bonk.png'),
    },
    {
      name: 'MH Ventures',
      src: baseAsset('mh-ventures.svg'),
    },
    {
      name: 'Meta Pool',
      src: baseAsset('metapool.svg'),
    },
    {
      name: 'Prism',
      src: baseAsset('prism.svg'),
    },
    {
      name: 'Neo Nomad',
      src: baseAsset('neonomad.svg'),
    },
    {
      name: 'Linum Labs',
      src: baseAsset('linumlabs.svg'),
    },
    {
      name: 'Truther',
      src: baseAsset('truther.svg'),
    },
    {
      name: 'Infratoken',
      src: baseAsset('infratoken.svg'),
    },
    {
      name: 'One Percent',
      src: baseAsset('onepercent.svg'),
    },
    {
      name: 'Bitfinex',
      src: baseAsset('bitfinex.svg'),
    },
    {
      name: 'Dabba',
      src: baseAsset('dabba.svg'),
    },
    {
      name: 'Proto',
      src: baseAsset('proto.svg'),
    },
    {
      name: 'someraw2',
      src: baseAsset('someraw2.svg'),
    },
    {
      name: 'Transfero',
      src: baseAsset('transfero.svg'),
    },
    {
      name: 'Jungle',
      src: baseAsset('jungle.svg'),
    },
    {
      name: 'Moby',
      src: baseAsset('moby.svg'),
    },
    {
      name: 'Backpack',
      src: baseAsset('backpack.svg'),
    },
    {
      name: 'MobiUp',
      src: baseAsset('mobiup.svg'),
    },
    {
      name: 'Ripio',
      src: baseAsset('ripio.svg'),
    },
    {
      name: 'Parcl',
      src: baseAsset('parcl.svg'),
    },
    {
      name: 'Staking Facilities',
      src: baseAsset('staking-facilities.svg'),
    },
    {
      name: 'DeCharge',
      src: baseAsset('decharge.svg'),
    },
    {
      name: 'Solana ID',
      src: baseAsset('solana-id.svg'),
    },
    {
      name: 'Light Protocol',
      src: baseAsset('light-protocol.svg'),
    },
    {
      name: 'Sonar Watch',
      src: baseAsset('sonar-watch.svg'),
    },
  ];

  const multipliedHiredBy = [
    ...hiredBy,
    ...hiredBy,
    ...hiredBy,
    ...hiredBy,
    ...hiredBy,
  ];

  return (
    <div className="flex w-full items-center gap-4 py-6 md:gap-8">
      <div className="block min-w-20 text-slate-500">
        Get Hired <br /> By{' '}
      </div>
      <div className="min-w-0">
        <Marquee speed={100}>
          {multipliedHiredBy.map((h, index) => (
            <ExternalImage
              className="mx-4 inline-block h-8"
              key={`${h.name}-${index}`}
              alt={h.name}
              src={h.src}
            />
          ))}
        </Marquee>
      </div>
    </div>
  );
}

function About() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="my-8 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
      <KashModal isOpen={isOpen} onClose={onClose} />
      <div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-xl font-bold">
            Get Hired Based on Your Proof of Work
          </h2>
          <p className="text-slate-500">
            The Talent Olympics is designed to help talented developers from
            around the world get jobs at the best companies on Solana. To enter,
            simply complete the developer challenges below. Each challenge has a
            prize pool for the best submissions, and the participants with the
            most points globally will split an additional $10,000 prize pool and
            receive interviews with our hiring partners.
          </p>
          <button
            onClick={onOpen}
            className="flex gap-2 rounded-full bg-slate-50 px-3 py-2 hover:bg-slate-200"
          >
            <ExternalImage
              alt="kash"
              src={base + 'kash.png'}
              className="h-6 w-6"
            />
            <span className="text-sm font-medium text-slate-500">
              Message from Kash
            </span>
            <FaPlay color="#1B0341" className="h-[0.7rem] w-[0.7rem]" />
          </button>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FeatureCard
              image={base + 'trophy.png'}
              title="45 Companies Hiring"
              description="at the Talent Olympics"
            />
          </div>
          <div>
            <FeatureCard
              image={base + 'cashbag.png'}
              title="$20,000 USDC"
              description="as cash prizes for the best submissions"
            />
          </div>
          <div>
            <FeatureCard
              image={base + 'coder.png'}
              title="Front End & Rust Tracks"
              description="with multiple challenges"
            />
          </div>
          <div>
            <FeatureCard
              image={base + 'winflag.png'}
              title="Ten Challenges"
              description="to prove you're the best candidate"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 p-4">
      <ExternalImage alt={title} src={image} />
      <div className="flex flex-col items-center gap-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs font-medium text-slate-500">{description}</p>
      </div>
    </div>
  );
}

interface TrackProps {
  icon: string;
  title: string;
  description: string;
  token: string;
  amount: number;
  link: string;
  hackathonIsOn?: boolean;
}

function Track({
  title,
  tracks,
  hackathonIsOn,
}: {
  title: string;
  tracks: TrackProps[];
  hackathonIsOn: boolean;
}) {
  return (
    <div className="mx-auto flex flex-col items-start gap-6 md:mx-0">
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <div className="flex flex-col gap-4">
        {tracks.map((t) => (
          <TrackBox key={t.title} {...t} hackathonIsOn={hackathonIsOn} />
        ))}
      </div>
    </div>
  );
}

function TrackBox({
  icon,
  title,
  description,
  amount,
  token,
  link,
  hackathonIsOn,
}: TrackProps) {
  return (
    <Tooltip
      content={!hackathonIsOn ? 'Details to be revealed on July 11.' : null}
    >
      <div className="w-full">
        <Link
          href={link}
          className={cn(
            'w-full no-underline',
            hackathonIsOn ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        >
          <div
            className={cn(
              'w-full max-w-lg rounded-lg border border-slate-200 bg-white',
              'p-3 md:p-4',
              hackathonIsOn ? 'cursor-pointer' : 'cursor-not-allowed',
            )}
          >
            <div className="flex items-center gap-5 hover:underline">
              <ExternalImage
                className="h-12 w-12 rounded-md object-cover md:h-[4.5rem] md:w-[4.5rem]"
                alt={title}
                src={icon}
              />
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-900 md:text-base">
                  <TextStyler text={title} />
                </p>
                <p className="line-clamp-2 text-sm text-slate-500 md:text-base">
                  <TextStyler text={description} />
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1">
              <LocalImage
                className="h-4 w-4 rounded-full md:h-6 md:w-6"
                alt={token}
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              />
              <p className="text-sm font-semibold text-slate-700 md:text-base">
                {amount?.toLocaleString('en-us')}
              </p>
              <p className="text-sm font-semibold text-slate-400 no-underline hover:no-underline md:text-base">
                {token}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </Tooltip>
  );
}

function Leaderboard({ leaders }: { leaders: CountryLeader[] }) {
  return (
    <div className="mx-auto flex w-full flex-col items-center gap-8 py-8">
      <h2 className="text-xl font-bold text-slate-600">
        Top Countries by Submissions
      </h2>
      <div className="grid w-full max-w-[35rem] auto-cols-auto grid-flow-col grid-rows-10 gap-x-24 gap-y-6 md:grid-rows-5">
        {leaders.map((l, i) => (
          <div key={l.location} className="flex w-full items-center">
            <div className="flex items-center font-medium">
              <span className="text-slate-400">{i + 1}.</span>
              <UserFlag location={l.location} />
              <p className="max-w-[12rem] truncate text-slate-500">
                {l.location}
              </p>
            </div>
            <span className="ml-auto font-medium">
              {l.submission_count === 0 ? '-' : l.submission_count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Rankings({
  rankings,
}: {
  rankings: { user: User; rating: number }[];
}) {
  return (
    <div className="mx-auto hidden w-full flex-col items-center gap-8 py-8">
      <h2 className="text-xl font-bold text-slate-600">
        Top Individuals by Rating
      </h2>
      <div className="grid w-full max-w-[35rem] auto-cols-auto grid-flow-col grid-rows-10 gap-x-12 gap-y-6 md:grid-rows-5">
        {rankings.map((r, i) => (
          <div
            key={r.user.id}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center text-xs font-medium text-slate-500">
              <p className="text-slate-400">#{i + 1}</p>
              <Link
                className="ph-no-capture flex items-center gap-2"
                href={`/t/${r.user.username}`}
                target="_blank"
              >
                <img
                  className="h-8 w-8 rounded-full"
                  src={r.user.photo ?? undefined}
                  alt={`${r.user.firstName}'s avatar`}
                />
                <div className="flex flex-col items-start gap-1 leading-normal md:justify-start md:leading-[1.15]">
                  <div className="flex items-center gap-2">
                    <p className="max-w-[7rem] truncate text-black">
                      {r.user.firstName} {r.user.lastName}
                    </p>
                  </div>
                  <p className="max-w-[7rem] truncate">@{r.user.username}</p>
                </div>
              </Link>
            </div>
            <div className="ml-auto flex gap-2 text-sm font-medium">
              <p>{r.rating}</p>
              <p className="text-slate-500">Points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
const faqs: { question: string; answer: string }[] = [
  {
    question: 'What is the Talent Olympics?',
    answer:
      'Talent Olympics is like a virtual job fair, except with users applying with real proof of work.',
  },
  {
    question: 'How do I enter the competition?',
    answer:
      'By submitting to any of the ten challenges under the Frontend and Rust tracks.',
  },
  {
    question: 'Which teams are hiring?',
    answer:
      'Over 50 Solana teams are hiring. In no particular order, here is the list of teams that are hiring: Transfero, Jungle, Khiza, Rippio, Moby Up, Coinlivre, Meta Pool, Prism, Bonk, MH Ventures, Bandit, Turbine, Future, Prizm, MoonThat, Jito, Flash, Mirror World, Pyth, Galaxe, Nosana, Sanctum, Tensor, Metaplex, Backpack, Parcl, Helio, Streamflow, Helius, DeCharge, Orca, Iron, Proto map, SolanaID, WifiDabba, Drift, Squads, Light Protocol, Mango, Sonar Watch, Kamino, Openbook, Staking facilities, Solana Beach, Noenomad, Linum Labs, DUX, VW Trucks & Bus, TRUTHER, Infratoken, One Percent, Bitfinix, etc.',
  },
  {
    question: 'Does winning a Talent Olympics bounty guarantee a job?',
    answer:
      'Winning one or multiple tracks does not guarantee a job, but greatly increases your chances of catching the eye of the hiring partners.',
  },
  {
    question: 'Can I participate in any track or challenge?',
    answer:
      "Yes, you can participate in any track, and any number of challenges as you'd like. But remember, that quality of your submission is the most important thing.",
  },
  {
    question: 'What is the prize split like?',
    answer:
      "The individual prizes for each challenge are mentioned in the listings themselves. On top of that, there's a separate prize pool of $10,000 for the best overall participants. We will consider both the quality (most important criteria) and the number of challenges that participants have submitted to for the grand prize, based on the reviews from our partners.",
  },
];

function FAQs() {
  return (
    <div className="flex flex-col items-center py-8">
      <h2 className="text-xl font-bold">FAQ</h2>
      <div className="w-full max-w-[35rem]">
        <Accordion type="single" collapsible>
          {faqs.map((f) => (
            <AccordionItem
              key={f.question}
              value={f.question}
              className="my-4 rounded-lg border shadow-md"
            >
              <AccordionTrigger className="rounded px-4 py-3 text-left data-[state=open]:bg-black/5 hover:bg-black/5">
                <span className="flex-1 text-left text-sm sm:text-base">
                  {f.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 text-sm sm:text-base">
                <div dangerouslySetInnerHTML={{ __html: f.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

const CountDownRenderer = ({
  days,
  hours,
  minutes,
}: {
  days: number;
  hours: number;
  minutes: number;
}) => {
  if (days > 0) {
    return <span>{`${days}d:${hours}h`}</span>;
  }
  return <span>{`${hours}h:${minutes}m`}</span>;
};

const SubscribeHackathon = () => {
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
  const [sub, setSub] = useState<
    (SubscribeHackathon & { User: User | null })[]
  >([]);
  const { user } = useUser();
  const posthog = usePostHog();
  const [update, setUpdate] = useState<boolean>(false);

  const handleToggleSubscribe = async () => {
    setIsSubscribeLoading(true);
    try {
      await axios.post('/api/hackathon/subscribe/toggle', { slug: SLUG });
      setUpdate((prev) => !prev);
      toast.success(
        sub.find((e) => e.userId === user?.id) ? 'Unsubscribed' : 'Subscribed',
      );
    } catch (error) {
      console.log(error);
      toast.error('Error occurred while toggling subscription');
    } finally {
      setIsSubscribeLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const { data } = await axios.post('/api/hackathon/subscribe/get', {
          slug: SLUG,
        });
        setSub(data);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };
    fetchSubscriptions();
  }, [update]);

  const isSubscribed = sub.find((e) => e.userId === user?.id);

  return (
    <div className="flex gap-2">
      <div className="flex items-start">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before subscribing to a hackathon.'
          }
        >
          <Button
            className={cn(
              'ph-no-capture',
              isSubscribed
                ? 'bg-brand-purple text-white hover:bg-purple-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            )}
            aria-label="Notify"
            onClick={() => {
              posthog.capture(
                isSubscribed ? 'unnotify me_hackathon' : 'notify me_hackathon',
              );
              handleToggleSubscribe();
            }}
            size="icon"
          >
            {isSubscribeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <TbBellRinging className="h-4 w-4" />
            ) : (
              <TbBell className="h-4 w-4" />
            )}
          </Button>
        </AuthWrapper>
      </div>
      <div className="flex whitespace-nowrap">
        <div className="flex flex-col items-start gap-0">
          <p className="font-medium text-white">
            {sub?.length ? sub.length : 0}
          </p>
          <p className="hidden text-sm font-normal text-slate-300 md:flex">
            {sub?.length === 1 ? 'Person' : 'People'} Interested
          </p>
        </div>
      </div>
    </div>
  );
};

function KashModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-7xl border-none p-0">
          <div className="aspect-video w-[100vw]">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/QSw-xf54PT0?autoplay=1"
              className="border-none"
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
}

const Marquee: React.FC<MarqueeProps> = ({ children, speed = 50 }) => {
  const [contentWidth, setContentWidth] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateContentWidth = () => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.scrollWidth / 2);
      }
    };

    updateContentWidth();
    window.addEventListener('resize', updateContentWidth);

    return () => {
      window.removeEventListener('resize', updateContentWidth);
    };
  }, [children]);

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.offsetWidth / 2);
    }
  }, []);

  const duration = contentWidth / speed;

  return (
    <>
      <style>
        {`
          .marquee-scroll {
            animation: scroll ${duration}s linear infinite;
          }
          
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${contentWidth}px); }
          }
        `}
      </style>
      <div className="relative overflow-hidden">
        <div ref={contentRef} className="marquee-scroll flex whitespace-nowrap">
          {children}
          {children}
        </div>
      </div>
    </>
  );
};

interface TextStylerProps {
  text: string;
}

const TextStyler: React.FC<TextStylerProps> = ({ text }) => {
  const words = text.split(' ');

  return (
    <p className="text-lg">
      {words.map((word, index) => {
        if (word.toLowerCase() === '<redacted>') {
          return (
            <span
              key={index}
              className="mx-1 inline-block select-none rounded-md bg-gray-200 px-2 text-transparent blur-sm"
              style={{ textShadow: '0 0 32px white' }}
              title="Redacted content"
            >
              redac
            </span>
          );
        }
        return <span key={index}>{word} </span>;
      })}
    </p>
  );
};

const rankedUsers: { email: string; rating: number }[] = [
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
];

interface CountryLeader {
  location: string;
  submission_count: number;
}
export const getServerSideProps: GetServerSideProps = async ({}) => {
  const countryLeaders = await prisma.$queryRaw<CountryLeader[]>`
SELECT 
    u.location,
    COUNT(s.id) as submission_count
FROM 
    Hackathon h
JOIN 
    Bounties b ON h.id = b.hackathonId
JOIN 
    Submission s ON b.id = s.listingId
JOIN 
    User u ON s.userId = u.id
WHERE 
    h.slug = ${'talent-olympics'}
GROUP BY 
    u.location
ORDER BY 
    submission_count DESC
LIMIT 10;
`;

  const countryLeaderLength = countryLeaders.length;
  if (countryLeaderLength < 10) {
    const restSuperteams = Superteams.filter(
      (s) =>
        countryLeaderLength === 0 ||
        !countryLeaders.some((c) => s.country.includes(c.location)),
    ).slice(0, 10 - countryLeaderLength);

    for (let i = 0; i < 10 - countryLeaderLength; i++) {
      countryLeaders.push({
        location: restSuperteams[i]?.country[0] ?? 'na',
        submission_count: 0,
      });
    }
  }

  const emails = rankedUsers.map((u) => u.email);
  const emailProfiles = await prisma.user.findMany({
    where: {
      email: { in: emails },
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      photo: true,
      email: true,
    },
  });

  const rankedProfiles = rankedUsers
    .map((u) => ({
      user: emailProfiles.find((p) => p.email === u.email),
      rating: u.rating,
    }))
    .sort((a, b) => b.rating - a.rating);

  return {
    props: {
      countryLeaders: JSON.parse(
        JSON.stringify(countryLeaders, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      ),
      rankings: rankedProfiles,
    },
  };
};
