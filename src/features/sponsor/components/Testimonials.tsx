import { cn } from '@/utils/cn';

import { maxW } from '../utils/styles';
import { HighQualityImage } from './HighQualityImage';
import { Stars } from './Stars';
import { TestimonialCard, type TestimonialProps } from './TestimonialCard';

const testimonials: TestimonialProps[] = [
  {
    stars: 5,
    message: `I'll say it again, Earn is going to become one of the most important non-protocol products in the Solana ecosystem. Connecting developers (amongst others) to opportunity and protocols to talent.`,
    logo: '/landingsponsor/sponsors/solana.webp',
    pfp: '/landingsponsor/users/chasedBarker.webp',
    name: 'Chase Barker',
    position: 'Global Developer Growth, Solana',
  },
  {
    stars: 5,
    message: `I have a 💙 affair with 
@SuperteamEarn. Our team uses it to scout crypto-native talent. 
<br />
<br />
Perfect hiring workflow:
<br /> bounty -> trial period -> full-time offer.`,
    logo: '/landingsponsor/sponsors/ISC.webp',
    pfp: '/landingsponsor/users/eno.webp',
    name: 'Eno Sim',
    position: 'Co-Founder, ISC',
  },
  {
    stars: 4,
    message: `Superteam Earn is one of the most underrated and valuable platforms for both Solana protocols and 
users`,
    logo: '/landingsponsor/sponsors/parcl.webp',
    pfp: '/landingsponsor/users/evanSolomon.webp',
    name: 'Evan Solomon',
    position: 'BD Lead, Parcl',
  },
];

export function Testimonials() {
  return (
    <div
      className={cn(
        'mb-16 flex w-full flex-col items-start gap-8',
        maxW,
        'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
      )}
      id="customers"
    >
      <hr className="mb-8" />

      <div className="flex h-full w-full flex-col justify-between gap-8 rounded border border-slate-300 md:flex-row-reverse">
        <div className="flex h-[14.754rem] w-full items-center justify-center rounded bg-black md:h-auto md:w-[40%]">
          <div className="w-20 md:w-32">
            <HighQualityImage
              src="/landingsponsor/sponsors/tensor.webp"
              alt="Tensor HQ USer"
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 p-4 md:p-10">
          <Stars count={5} filled={5} />

          <p className="text-[1.4rem] leading-[1.1] text-slate-600 md:text-[1.87rem]">
            Superteam are chads. <br />
            Superteam Earn is awesome. <br />
            Everybody should use it 💜
          </p>

          <div className="flex gap-8">
            <div className="flex flex-col items-start gap-0">
              <p className="text-[1.9rem] font-semibold text-slate-800">520k</p>
              <p className="text-[0.625rem] font-medium text-slate-500 md:text-[0.925rem]">
                Page Views
              </p>
            </div>
            <div className="flex flex-col items-start gap-0">
              <p className="text-[1.9rem] font-semibold text-slate-800">369</p>
              <p className="text-[0.625rem] font-medium text-slate-500 md:text-[0.925rem]">
                Total Submissions
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="h-[2.1rem] w-[2.1rem] md:h-[3.1rem] md:w-[3.1rem]">
              <HighQualityImage
                src="/landingsponsor/users/tensor.webp"
                alt="TensorHQ"
                className="h-full w-full"
              />
            </div>
            <p className="text-base text-black md:text-[1.5rem]">
              Tensor HQ, on Twitter
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-8">
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} {...t} />
        ))}
      </div>
    </div>
  );
}
