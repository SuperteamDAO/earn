import { cn } from '@/utils';

import { maxW } from '../utils';
import { ListingCard, type ListingCardProps } from './ListingCard';

const base = '/landingsponsor';

const works: ListingCardProps[] = [
  {
    pfp: base + '/sponsors/dreader.webp',
    title: 'Full Stack Development',
    name: 'dReader',
    description: `dReader is looking for a full stack developer to build a feature that allows creators to publish their comics, analyse stats and engage with their community. `,
    skills: ['frontend', 'backend'],
    submissionCount: 114,
    type: 'development',
    amount: '$1,000',
    tokenIcon: base + '/icons/usdc.svg',
    token: '',
  },
  {
    pfp: base + '/sponsors/okx.webp',
    title: 'OKX Super Season Thread Bounty',
    name: 'OKX',
    description: `In celebration of the Solana Super Season, OKX is calling all crypto enthusiasts to dive into the details of this campaign on OKX Web3 Wallet, and share their insights in a captivating Twitter thread.`,
    skills: ['writing', 'marketing', 'community'],
    submissionCount: 116,
    type: 'content',
    amount: '$500',
    tokenIcon: base + '/icons/usdc.svg',
    token: '',
  },
  {
    pfp: base + '/sponsors/de.webp',
    title: 'y00ts royalty dashboard design',
    name: 'DeLabs',
    description: `de[labs], the team behind y00ts, DeGods, and BTC DeGods, is looking for a talented designers to make the y00ts royalty dashboard`,
    skills: ['design'],
    submissionCount: 59,
    type: 'design',
    amount: '5,000',
    tokenIcon: base + '/icons/DUST.png',
    token: '$DUST',
  },
  {
    pfp: base + '/sponsors/saros.webp',
    title: 'Community Manager at Saros Finance',
    name: 'Saros',
    description: `Saros, a DeFi Mobile Superapp is looking for a community manager who can help strategise community growth, and manage its community`,
    skills: ['writing', 'marketing', 'community'],
    submissionCount: 84,
    type: 'community',
    amount: '$6,000',
    tokenIcon: base + '/icons/usdc.svg',
    token: '',
  },
];

export function ListingWork() {
  return (
    <div className="relative mx-auto mb-16 mt-32 w-full pt-16">
      <div
        className={cn(
          'absolute left-0 top-0 w-full bg-slate-100',
          'h-[27.8rem] md:h-[25.8rem]',
        )}
      />
      <div
        className={cn(
          'relative mx-auto w-screen items-start gap-8',
          maxW,
          'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
          'flex flex-col',
        )}
      >
        <h2
          className={cn(
            'relative w-full text-center font-semibold text-slate-800',
            'text-[2rem] md:text-[3.5rem]',
          )}
        >
          Get almost any kind of work done
        </h2>

        <div className="banner-wrapper w-full">
          <Banner />
        </div>
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div className="banner-wrapper">
      <div className="wrapper">
        {[...new Array(4)].map((_, i) => (
          <div className="content flex gap-2" key={i}>
            {works.map((value) => (
              <div
                className="flex flex-col items-start"
                key={`${value.title}-${value.type}`}
              >
                <p className="text-lg font-semibold uppercase">{value.type}</p>
                <ListingCard key={value.title} {...value} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
