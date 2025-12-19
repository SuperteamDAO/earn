import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { type ParentSkills } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';
import { getURLSanitized } from '@/utils/getURLSanitized';

import type { ListingHackathon } from '../../types';

interface ExtraInfoSectionProps {
  skills?: ParentSkills[];
  requirements?: string | undefined;
  pocSocials?: string | undefined;
  region?: string | undefined;
  commitmentDate?: string | undefined;
  Hackathon?: ListingHackathon;
  isGrant?: boolean;
  hideWinnerAnnouncement?: boolean;
  isFndnPaying?: boolean;
}

export function ExtraInfoSection({
  skills,
  Hackathon,
  requirements,
  pocSocials,
  region,
  commitmentDate,
  isGrant = false,
  hideWinnerAnnouncement = false,
  isFndnPaying = false,
}: ExtraInfoSectionProps) {
  return (
    <div className="flex w-full flex-col gap-8 pt-2 md:w-[23rem]">
      {region && region !== 'Global' && (
        <div className="flex w-full flex-col items-start gap-2 text-sm">
          <p className="font-semibold text-slate-600">
            REGIONAL {isGrant ? 'GRANT' : 'LISTING'}
          </p>
          <p className="h-full text-slate-500">
            This {isGrant ? 'grant' : 'listing'} is only open for people in{' '}
            <Link
              href={`/regions/${region.toLowerCase().replace(/\s+/g, '-')}`}
              className="font-semibold text-slate-500 hover:text-slate-700 hover:underline"
            >
              {region}
            </Link>
          </p>
        </div>
      )}

      {Hackathon && (
        <div className="flex w-full flex-col items-start gap-2 text-sm">
          <p className="font-semibold text-slate-600">
            {Hackathon.name?.toUpperCase()} TRACK
          </p>
          <p className="text-slate-500">{Hackathon.description}</p>
          <a
            className="flex items-center font-medium text-slate-500"
            href={`/hackathon/${Hackathon.name?.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View All Tracks
            <ExternalLink className="mx-1 mb-1 h-4 w-4 text-[#64768b]" />
          </a>
        </div>
      )}

      {requirements && (
        <div className="flex w-full flex-col items-start gap-2 text-sm">
          <p className="h-full font-semibold text-slate-600">ELIGIBILITY</p>
          <p className="text-slate-500">{requirements}</p>
        </div>
      )}

      <div className="hidden w-full flex-col items-start gap-2 text-sm md:flex">
        <p className="h-full text-center font-semibold text-slate-600">
          SKILLS NEEDED
        </p>
        <div className="flex flex-wrap gap-3">
          {skills?.map((skill) => (
            <Link
              key={skill}
              href={`/skill/${skill.toLowerCase().replace(/\s+/g, '-')}`}
              className="m-0 rounded-sm bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              {skill}
            </Link>
          ))}
        </div>
      </div>

      {isFndnPaying && (
        <div className="flex w-full flex-col items-start gap-2 text-sm">
          <p className="h-full font-semibold text-slate-600">KYC REQUIRED</p>
          <p className="text-slate-500">
            Winners will be required to complete KYC to receive their prize
            money.
          </p>
        </div>
      )}

      {pocSocials && (
        <div className="hidden w-full flex-col items-start gap-2 text-sm md:flex">
          <p className="h-full text-center font-semibold text-slate-600">
            CONTACT
          </p>
          <div>
            <a
              className="ph-no-capture inline items-center font-medium text-[#64768b]"
              href={getURLSanitized(pocSocials)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => posthog.capture('reach out_listing')}
            >
              Reach out
              <ExternalLink className="mx-1 mb-1 inline h-4 w-4 text-[#64768b]" />
            </a>
            <span className="inline text-slate-500">
              if you have any questions about this listing
            </span>
          </div>
        </div>
      )}
      {!!commitmentDate && !hideWinnerAnnouncement && (
        <div className="hidden w-full flex-col items-start gap-2 text-sm md:flex">
          <p className="h-full text-center font-semibold text-slate-600">
            WINNER ANNOUNCEMENT BY
          </p>
          <div>
            <span className="inline text-slate-500">
              {dayjs(commitmentDate).format('MMMM DD, YYYY')} - as scheduled by
              the sponsor.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
