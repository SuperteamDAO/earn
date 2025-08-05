import posthog from 'posthog-js';

import { Wand } from '@/svg/wand';
import { cn } from '@/utils/cn';

import { DollarIcon } from '../icons/DollarIcon';
import { EnterIcon } from '../icons/EnterIcon';
import { InviteIcon } from '../icons/InviteIcon';
import { ReviewIcon } from '../icons/ReviewIcon';
import { SkillIcon } from '../icons/SkillIcon';
import { maxW2 } from '../utils/styles';
import { HighQualityImage } from './HighQualityImage';

interface FeatureProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: Wand,
    title: 'Auto-Generate Listings Instantly',
    description:
      'AI-powered tool to create high-quality drafts in seconds - structured, editable, and ready to publish. Go from idea to live listing in <1 min.',
  },
  {
    icon: ReviewIcon,
    title: 'Review & Sort',
    description:
      'Reviewing submissions is no longer a pain. Effortlessly categorize submissions with our intuitive labelling system. ',
  },
  {
    icon: DollarIcon,
    title: 'Easy Payments',
    description:
      'Pay talent directly from the platform without worrying about sending payment to the wrong address.',
  },
  {
    icon: SkillIcon,
    title: 'Skill Based Targetting',
    description:
      'Each new listing gets sent to relevant people via e-mail and Discord.',
  },
  {
    icon: EnterIcon,
    title: 'Get Quotes',
    description:
      'Not sure how to budget your freelance gig? Opt to receive quotes from participants instead.',
  },
  {
    icon: InviteIcon,
    title: 'Invite & Collaborate',
    description:
      'Invite multiple team members via email, and collaborate on managing your listings.',
  },
];

interface Props {
  showVideo: () => void;
}

export function Features({ showVideo }: Props) {
  return (
    <div
      className="relative mx-auto my-32 w-full px-[1.875rem] lg:px-[7rem] xl:px-[11rem]"
      id="features"
    >
      <div className="bg-brand-purple absolute top-0 left-0 h-[17.8rem] w-full md:h-[36.96rem]" />

      <div
        className={cn(
          'relative mx-auto px-[1.875rem] py-12 lg:px-[7rem] xl:px-[11rem]',
          maxW2,
        )}
      >
        <p className="mx-auto max-w-[48rem] text-center text-base font-semibold text-white/75 md:text-[1.6rem]">
          YOUR DASHBOARD
        </p>
        <p className="mx-auto max-w-[48rem] text-center text-[2rem] leading-[1.1] font-semibold text-white md:text-[3.5rem]">
          A seamless way to manage all your listings in one place
        </p>
      </div>

      <div
        className={cn(
          'ph-no-capture relative mx-auto flex w-full items-center justify-center',
          maxW2,
        )}
        onClick={() => {
          posthog?.capture('clicked_video');
          showVideo();
        }}
      >
        <div className="bg-brand-purple absolute inset-0 m-auto flex h-fit w-fit cursor-pointer items-center justify-center rounded-full p-3">
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_78_219)">
              <path
                d="M14.1667 12.24L21.6325 17L14.1667 21.76V12.24ZM11.3334 7.08337V26.9167L26.9167 17L11.3334 7.08337Z"
                fill="white"
              />
            </g>
            <defs>
              <clipPath id="clip0_78_219">
                <rect width="34" height="34" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <HighQualityImage
          className="h-full w-full cursor-pointer rounded-md border-2 border-slate-200 shadow-md"
          src="/landingsponsor/displays/sponsor-dashboard.webp"
          alt="Sponsord dashboard screenshot"
        />
      </div>

      <div
        className={cn(
          'mx-auto mt-16 grid gap-10 xl:gap-20',
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          maxW2,
        )}
      >
        {features.map((feature, index) => (
          <Feature key={index} {...feature} />
        ))}
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: FeatureProps) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Icon className="text-primary h-[1.8rem] w-8" />
      <div className="flex flex-col items-start">
        <p className="text-lg font-semibold text-slate-700">{title}</p>
        <p
          className="text-base font-medium text-slate-500"
          style={{ lineHeight: '1.2' }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
