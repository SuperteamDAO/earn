import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';
import { SponsorshipIcon } from '@/svg/sponsorship-icon';
import { cn } from '@/utils/cn';

import { maxW } from '../utils/styles';
import { HighQualityImage } from './HighQualityImage';

const bountyFeatures = [
  'Great for awareness campaigns where you want to reach the most people possible',
  'Get multiple options to choose from',
  'Examples: Twitter Threads, Deep-Dives, Memes, Product Feedback, and more',
];

const projectFeatures = [
  'Perfect for work that requires collaboration and iteration',
  'Single output that is specific to your exact needs',
  'Examples: Full Stack Development, Hype Video Production, Hiring a Community Manager, and more',
];

const sponsorshipFeatures = [
  'Ideal for initiatives fueling targeted support and growth',
  'Enables tailored expense or payment requests',
  'Examples: open-source support, community content, creative projects',
];

export function ListingTypes() {
  return (
    <div
      className={cn(
        'mx-auto mb-[2rem] flex w-full flex-col items-center gap-8',
        maxW,
        'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
      )}
    >
      <p className="max-w-[48rem] text-center text-[2rem] font-semibold leading-none text-slate-900 md:text-[3.5rem]">
        Start by posting your first Bounty or Project
      </p>

      <div className="mx-auto flex w-full flex-col gap-12 md:flex-row">
        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="flex h-40 w-full items-center justify-center bg-violet-50">
            <BountyIcon
              styles={{
                width: '45px',
                height: '45px',
                fill: '#8B5CF6',
              }}
            />
          </div>

          <div className="flex flex-col items-start gap-1">
            <h3 className="text-[1.625rem] font-semibold">Bounty</h3>
            <p className="text-[1.2rem] font-medium leading-[1.1]">
              Bounties are listings where everyone completes a given scope of
              work, and competes for the prize pool
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 xl:mt-4">
            {bountyFeatures.map((feature) => (
              <Feature key={feature} description={feature} />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="flex h-40 w-full items-center justify-center bg-blue-50">
            <ProjectIcon
              styles={{
                width: '45px',
                height: '45px',
                fill: '#3B82F6',
              }}
            />
          </div>

          <div className="flex flex-col items-start gap-1">
            <h3 className="text-[1.625rem] font-semibold">Project</h3>
            <p className="text-[1.2rem] font-medium leading-[1.1]">
              Projects are freelance gigs — people apply with their proposals
              but don’t begin working until you pick them
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 xl:mt-4">
            {projectFeatures.map((feature) => (
              <Feature key={feature} description={feature} />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start gap-4">
          <div className="flex h-40 w-full items-center justify-center bg-green-50">
            <SponsorshipIcon
              styles={{
                width: '38px',
                height: '40px',
              }}
              className="fill-green-600"
            />
          </div>

          <div className="flex flex-col items-start gap-1">
            <h3 className="text-[1.625rem] font-semibold">Sponsorship</h3>
            <p className="text-[1.2rem] font-medium leading-[1.1]">
              Sponsorship listings empower you to fund and reward individual
              contributions by directly sponsoring innovators.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 xl:mt-4">
            {sponsorshipFeatures.map((feature) => (
              <Feature key={feature} description={feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureProps {
  description: string;
}

function Feature({ description }: FeatureProps) {
  return (
    <div className="flex items-start gap-4">
      <HighQualityImage
        src={'/landingsponsor/icons/purple-tick.svg'}
        alt="Purple Tick"
        className="h-5 w-5"
      />
      <p className="relative top-[-8px] text-[1.2rem] text-slate-500">
        {description}
      </p>
    </div>
  );
}
