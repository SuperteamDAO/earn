import { Check } from 'lucide-react';
import React from 'react';

import { ExternalImage } from '@/components/ui/cloudinary-image';

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

export const CreditFeature = () => {
  const displayContent = content['user'];

  return (
    <>
      <ExternalImage
        src="/credits/credit-feature.webp"
        alt="Credit Announcement Illustration"
        className="mx-auto w-full"
        loading="eager"
        decoding="sync"
      />
      <div className="flex flex-col items-start gap-2 px-2 pt-4 sm:px-6">
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
    </>
  );
};
