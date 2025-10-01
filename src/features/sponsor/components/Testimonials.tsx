import { ASSET_URL } from '@/constants/ASSET_URL';
import { cn } from '@/utils/cn';

import { maxW } from '../utils/styles';

const SPONSOR_LOGO_BASE = `${ASSET_URL}/landingsponsor/sponsors`;
const USER_PFP_BASE = `${ASSET_URL}/landingsponsor/users`;

interface MetricsData {
  views?: string;
  submissions?: string;
  paidOut?: string;
}

interface MetricsProps {
  data: MetricsData;
  className?: string;
}

const Metrics = ({ data, className }: MetricsProps) => {
  const formatMetric = (key: string, value: string) => {
    let label: string;
    switch (key) {
      case 'views':
        label = 'Views';
        break;
      case 'submissions':
        label = 'Submissions';
        break;
      case 'paidOut':
        label = 'Paid Out';
        break;
      default:
        return value;
    }

    return (
      <span className="text-xs font-semibold whitespace-nowrap xl:text-base">
        <span className="text-slate-600">{value}</span>{' '}
        <span className="text-slate-500">{label}</span>
      </span>
    );
  };

  const items = Object.entries(data)
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, value }));

  return (
    <div className={cn('flex flex-wrap items-center gap-0', className)}>
      {items.map(({ key, value }, idx) => (
        <div
          key={`${key}-${value}`}
          className={cn('flex items-center', idx === 2 && 'hidden md:flex')}
        >
          {idx > 0 && (
            <span className="mx-3 inline-block size-2 rounded-full bg-slate-200" />
          )}
          {formatMetric(key, value)}
        </div>
      ))}
    </div>
  );
};

interface TestimonialTileProps {
  logo: string;
  logoAlt: string;
  quote: string;
  metrics: MetricsData;
  personName: string;
  personTitle: string;
  personPfp: string;
  hero?: boolean;
}

const TestimonialTile = ({
  logo,
  logoAlt,
  quote,
  metrics,
  personName,
  personTitle,
  personPfp,
  hero,
}: TestimonialTileProps) => {
  if (hero) {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded border border-slate-200 bg-white md:flex-row">
        <div className="flex items-center justify-center border-b border-slate-200 p-10 md:h-auto md:w-[33%] md:border-r md:border-b-0">
          <div className="w-44 md:w-56">
            <img
              src={logo}
              alt={logoAlt}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5 md:p-8">
          <p className="mb-auto text-[1.05rem] leading-snug text-slate-600 md:text-[1.15rem]">
            “{quote}”
          </p>
          <Metrics data={metrics} />
          <div className="mt-1 flex items-center gap-3">
            <div className="h-[2rem] w-[2rem] flex-shrink-0 md:h-[2.5rem] md:w-[2.5rem]">
              <img
                src={personPfp}
                alt={personName}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <p className="text-[0.95rem] font-medium text-slate-500">
              <span className="text-slate-700">{personName}</span>,{' '}
              {personTitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col overflow-hidden rounded border border-slate-200 bg-white">
      <div className="flex items-center justify-center border-b border-slate-200 p-10">
        <div className="h-[4rem] w-40">
          <img
            src={logo}
            alt={logoAlt}
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="mb-auto text-[0.98rem] leading-snug text-slate-600 md:text-[1.05rem]">
          “{quote}”
        </p>
        <Metrics data={metrics} />

        <div className="mt-1 flex items-center gap-3">
          <div className="h-[2rem] w-[2rem] flex-shrink-0 md:h-[2.25rem] md:w-[2.25rem]">
            <img
              src={personPfp}
              alt={personName}
              className="h-full w-full rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="text-[0.95rem] font-medium text-slate-500">
            <span className="text-gray-600">{personName}</span>, {personTitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export function Testimonials() {
  return (
    <section className="mx-auto w-full bg-slate-50">
      <div
        className={cn(
          'mx-auto mb-16 flex w-full flex-col items-start gap-6 py-10 md:py-16',
          maxW,
          'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
        )}
        id="trusted-by"
      >
        <h2 className="mx-auto w-full text-center text-[2.45rem] leading-[1.1] font-semibold text-slate-800 md:text-[2.75rem]">
          Trusted By Top Solana Teams
        </h2>

        <div className="mt-4 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-3">
            <TestimonialTile
              hero
              logo={`${SPONSOR_LOGO_BASE}/jupiter-2.webp`}
              logoAlt="Jupiter"
              quote={
                "Earn is the default place for us at Jupiter to find Solana native freelancers. We've been powerusers of it for a while — its distribution to talent is unmatched."
              }
              metrics={{
                views: '2M+',
                submissions: '3000+',
                paidOut: '$300k+',
              }}
              personName="Kash Dhanda"
              personTitle="COO, Jupiter"
              personPfp={`${USER_PFP_BASE}/kash-dhanda.webp`}
            />
          </div>

          <TestimonialTile
            logo={`${SPONSOR_LOGO_BASE}/solana-foundation.webp`}
            logoAlt="Solana Foundation"
            quote={
              'Within moments, we set up our bounty and drew in exceptional talent. The dashboard is incredibly intuitive, making the entire process feel effortless!'
            }
            metrics={{ views: '1M+', submissions: '1,000+' }}
            personName="Vibhu"
            personTitle="Product Marketing, Solana"
            personPfp={`${USER_PFP_BASE}/vibhu.webp`}
          />

          <TestimonialTile
            logo={`${SPONSOR_LOGO_BASE}/helius.webp`}
            logoAlt="Helius"
            quote={
              'Running a hackathon without Superteam is nearly impossible. Earn gave us everything we needed to operate and they provided us with first-class support.'
            }
            metrics={{ views: '250k+', submissions: '200+' }}
            personName="Brady"
            personTitle="BD Lead, Helius"
            personPfp={`${USER_PFP_BASE}/brady.webp`}
          />

          <TestimonialTile
            logo={`${SPONSOR_LOGO_BASE}/civic.webp`}
            logoAlt="Civic"
            quote={
              'I have tested several platforms and Earn is by far the most intuitive and user-friendly. Many of the others feel overbuilt, with lots of confusing tabs and unnecessary complexity.'
            }
            metrics={{ views: '100k+', submissions: '100' }}
            personName="Nancy Li"
            personTitle="Dir. of Marketing, Civic"
            personPfp={`${USER_PFP_BASE}/nancy-li.webp`}
          />
        </div>
      </div>
    </section>
  );
}
