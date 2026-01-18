'use client';
import { Globe } from '@phosphor-icons/react';

import { cn } from '@/utils/cn';

import ImageLoader from '../ImageLoader';

interface PerkCardProps {
  name: string;
  description: string;
  projectLink: string;
  imgUrl: string;
  className?: string;
}

export default function PerkCard({
  name,
  description,
  projectLink,
  imgUrl,
  className,
}: PerkCardProps) {
  return (
    <div
      className={cn(
        'perk-card relative flex h-[431px] w-[304px] flex-col justify-between rounded-xl p-8',
        className,
      )}
    >
      <div className="flex flex-col">
        <div className="flex flex-col items-start gap-6">
          <ImageLoader
            src={imgUrl}
            height={32}
            alt={name}
            className="h-[32px] w-auto rounded-full"
            loading="lazy"
          />
          <h2 className="font-secondary text-[24px] font-bold text-white">
            {name}
          </h2>
        </div>
        <p className="font-primary mt-[16px] leading-[1.6] font-medium text-white">
          {description}
        </p>
      </div>
      <div className="flex gap-4">
        <a href={projectLink} target="_blank" rel="noopener noreferrer">
          <Globe size={24} color="white" />
        </a>
      </div>
    </div>
  );
}
