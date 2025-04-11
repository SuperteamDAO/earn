import { Check } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';
import { ExternalImage } from '../ui/cloudinary-image';
import { Separator } from '../ui/separator';

type ContentType = {
  title: string;
  description: string;
  points: string[];
};

const content: Record<'user' | 'sponsor', ContentType> = {
  user: {
    title: "You'll get 3 submission credits each month",
    description:
      'We want you to prioritise quality over quantity and get a fairer chance at winning by reducing the number of spam submissions.',
    points: [
      'Each bounty / project submission costs one credit',
      'Balances renew and get updated every month',
      'Get bonus +1 credit for winning and -1 when you spam',
      'Grant & hackathon submissions do not require credits',
    ],
  },
  sponsor: {
    title: 'Less Spam, More Focus',
    description:
      "We're committed to improving submission quality by discouraging spam and incentivising users to only submit high quality work",
    points: [
      'Users get 3 credits per month',
      'Submission to bounties and projects cost 1 credit',
      'Spam and winning submissions reduce and increase one credit respectively',
      'Grant & hackathon submissions do not utilise credits',
    ],
  },
};

const Point = ({ title }: { title: string }) => {
  return (
    <div className="flex gap-2 sm:gap-4">
      <div className="h-fit rounded-full bg-violet-50 p-1">
        <Check className="text-brand-purple size-4" />
      </div>
      <div>
        <p className="font-medium tracking-tight text-slate-500">{title}</p>
      </div>
    </div>
  );
};

export const CreditFeature = ({
  onClick,
  isSponsor = false,
}: {
  onClick: () => void;
  isSponsor?: boolean;
}) => {
  const displayContent = content[isSponsor ? 'sponsor' : 'user'];

  return (
    <>
      <ExternalImage
        src="/credits/credit-feature.webp"
        alt="Scouts Announcement Illustration"
        className="mx-auto w-full"
      />
      <div className="flex flex-col items-start gap-2 px-2 sm:px-6">
        <p className="font-semibold tracking-tight text-slate-900 sm:text-lg">
          {displayContent.title}
        </p>
        <p className="text-sm text-slate-500 sm:text-base">
          {displayContent.description}
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm sm:gap-4 sm:text-base">
          {displayContent.points.map((point, index) => (
            <Point key={index} title={point} />
          ))}
        </div>
      </div>
      <Separator className="text-slate-100" />
      <div className="px-2 sm:px-6">
        <Button onClick={onClick} className="w-full">
          Understood
        </Button>
      </div>
      <div className="-mt-2 mb-4 px-2 text-center text-xs text-slate-400 sm:px-6">
        <a
          href="https://superteamdao.notion.site/submission-credits"
          target="_blank"
          className="underline"
        >
          Click here
        </a>{' '}
        to learn more about credits
      </div>
    </>
  );
};
