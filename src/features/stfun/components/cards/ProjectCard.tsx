import { Globe, TwitterLogo } from '@phosphor-icons/react';

import { cn } from '@/utils/cn';

import ImageLoader from '../ImageLoader';

interface ProjectCardProps {
  name: string;
  tagline: string;
  projectLink: string;
  twitterLink: string;
  imgUrl: string;
  country: string;
  className?: string;
}

export default function ProjectCard({
  name,
  tagline,
  projectLink,
  twitterLink,
  imgUrl,
  country,
  className,
}: ProjectCardProps) {
  return (
    <div
      className={cn(
        'project-card relative flex h-[331px] w-[304px] flex-col justify-between rounded-xl p-8',
        className,
      )}
    >
      <div className="flex flex-col">
        <div className="flex flex-col items-start gap-4">
          <ImageLoader
            src={imgUrl}
            height={32}
            alt=""
            className="h-[32px] w-auto rounded-full"
            loading="lazy"
          />
          <h2 className="font-secondary text-[24px] font-bold text-white">
            {name}
          </h2>
        </div>
        <p className="font-primary font-medium text-white">{tagline}</p>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-4">
          <a href={projectLink} target="_blank" rel="noopener noreferrer">
            <Globe size={24} color="white" />
          </a>
          <a href={twitterLink} target="_blank" rel="noopener noreferrer">
            <TwitterLogo size={24} color="white" />
          </a>
        </div>
        <p className="font-primary font-medium text-white">{country}</p>
      </div>
    </div>
  );
}
