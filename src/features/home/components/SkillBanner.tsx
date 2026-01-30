import Image from 'next/image';

import { ASSET_URL } from '@/constants/ASSET_URL';

interface SkillBannerProps {
  skillName: string;
  skillType: 'parent' | 'subskill';
}

export function SkillBanner({ skillName }: SkillBannerProps) {
  const heading = `Remote web3 gigs for ${skillName} talent`;
  const description = `Get paid like the pros — work remotely for top web3 projects using your ${skillName.toLowerCase()} skills through Superteam Earn.`;

  return (
    <div className="relative flex h-52 w-full flex-col items-center md:h-72">
      <Image
        src={ASSET_URL + '/banner/banner'}
        alt={skillName}
        width={1440}
        height={290}
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute top-1/2 flex w-full max-w-7xl -translate-y-1/2 flex-col items-start px-2 md:px-6">
        <h2 className="text-2xl font-semibold text-white md:text-4xl">
          {heading}
        </h2>
        <p className="mt-3 max-w-xl text-left text-sm text-white md:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
