import { Check } from 'lucide-react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ExternalImage } from '@/components/ui/cloudinary-image';

const content = {
  title: "You'll get 3 submission credits each month",
  description:
    'We want you to prioritise quality over quantity and get a fairer chance at winning by reducing the number of spam submissions.',
  points: [
    'Each bounty / project submission costs one credit',
    'Balances renew and get updated every month',
    'Get bonus +1 credit for winning and -1 when you spam',
    'Grant & hackathon submissions do not require credits',
  ],
};

const Point = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="h-fit rounded-full bg-violet-50 p-1">
        <Check className="text-brand-purple size-3 sm:size-4" />
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
      <div className="flex flex-col items-start gap-2 px-4 pt-4">
        <p className="font-semibold tracking-tight text-slate-900 md:text-lg">
          {content.title}
        </p>
        <p className="text-xs text-slate-500 sm:text-base">
          {content.description}
        </p>
        <div className="mt-1 flex flex-col gap-2 text-xs sm:gap-4 sm:text-base md:mt-4">
          {content.points.map((point, index) => (
            <Point key={index} title={point} />
          ))}
        </div>
      </div>
    </>
  );
};
