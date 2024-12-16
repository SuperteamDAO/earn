import { cn } from '@/utils';

import { maxW } from '../utils';
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

export function ListingTypes() {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col items-center gap-8',
        maxW,
        'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
      )}
    >
      <p className="max-w-[48rem] text-center text-[2rem] font-semibold leading-none text-slate-900 md:text-[3.5rem]">
        Start by posting your first Bounty or Project
      </p>

      <div className="mx-auto flex w-full flex-col gap-12 md:flex-row">
        <div className="flex flex-col items-start gap-4">
          <div className="flex h-40 w-full items-center justify-center bg-teal-50">
            <svg
              width="45"
              height="45"
              viewBox="0 0 45 45"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20.625 39.4723C20.625 40.0049 21.3157 40.214 21.6111 39.7709L35.0671 19.5868C35.3056 19.2291 35.0492 18.75 34.6193 18.75H24.375V5.52768C24.375 4.99514 23.6843 4.78602 23.3889 5.22912L9.93287 25.4132C9.69441 25.7709 9.95082 26.25 10.3807 26.25H20.625V39.4723Z"
                fill="#0D9488"
              />
            </svg>
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

        <div className="flex flex-col items-start gap-4">
          <div className="flex h-40 w-full items-center justify-center bg-violet-50">
            <svg
              width="45"
              height="45"
              viewBox="0 0 45 45"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.82886 15C6.79151 15 5.95056 15.8409 5.95056 16.8783V35.6217C5.95056 36.6591 6.7915 37.5 7.82886 37.5H37.1715C38.2088 37.5 39.0498 36.6591 39.0498 35.6217V16.8783C39.0498 15.8409 38.2088 15 37.1715 15H7.82886ZM19.2196 18.75C18.9602 18.75 18.75 18.9602 18.75 19.2196V22.0304C18.75 22.2898 18.9602 22.5 19.2196 22.5H25.7804C26.0398 22.5 26.25 22.2898 26.25 22.0304V19.2196C26.25 18.9602 26.0398 18.75 25.7804 18.75H19.2196Z"
                fill="#6366F1"
              />
              <path
                opacity="0.3"
                d="M18.75 15H15V13.125C15 10.0184 17.5184 7.5 20.625 7.5H24.375C27.4816 7.5 30 10.0184 30 13.125V15H26.25V13.125C26.25 12.0895 25.4105 11.25 24.375 11.25H20.625C19.5895 11.25 18.75 12.0895 18.75 13.125V15Z"
                fill="#6366F1"
              />
            </svg>
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
