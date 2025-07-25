import { Check } from 'lucide-react';
import React from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ExternalImage } from '@/components/ui/cloudinary-image';

const content = {
  title: 'Less Spam, More Focus',
  description:
    "We're committed to improving submission quality by discouraging spam and incentivising users to only submit high quality work",
  points: [
    'Users get 3 credits per month',
    'Submission to bounties and projects cost 1 credit',
    'Spam and winning submissions reduce and increase one credit respectively',
    'Grant & hackathon submissions do not utilise credits',
  ],
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
  return (
    <>
      <AspectRatio ratio={960 / 632}>
        <ExternalImage
          src="/announcements/credit-system"
          alt="Credit Announcement Illustration"
          className="mx-auto w-full"
          loading="eager"
          decoding="sync"
          width={960}
          height={632}
        />
      </AspectRatio>
      <div className="flex flex-col items-start gap-2 px-6 pt-4">
        <p className="text-xl font-semibold tracking-tight text-slate-900">
          {content.title}
        </p>
        <p className="text-base text-slate-500">{content.description}</p>
        <div className="mt-4 flex flex-col gap-2 text-base sm:gap-4">
          {content.points.map((point, index) => (
            <Point key={index} title={point} />
          ))}
        </div>
      </div>
    </>
  );
};
