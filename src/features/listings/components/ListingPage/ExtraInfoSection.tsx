import { ExternalLink } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

import { type ParentSkills } from '@/interface/skills';
import { getURLSanitized } from '@/utils/getURLSanitized';

import type { ListingHackathon } from '../../types';

interface ExtraInfoSectionProps {
  skills?: ParentSkills[];
  requirements?: string | undefined;
  pocSocials?: string | undefined;
  region?: string | undefined;
  Hackathon?: ListingHackathon;
  isGrant?: boolean;
}

export function ExtraInfoSection({
  skills,
  Hackathon,
  requirements,
  pocSocials,
  region,
  isGrant = false,
}: ExtraInfoSectionProps) {
  const posthog = usePostHog();
  return (
    <div className="flex w-full flex-col gap-8 pt-2 md:w-[22rem]">
      {region && region !== 'GLOBAL' && (
        <div className="flex w-full flex-col items-start gap-2 text-sm">
          <p className="font-semibold text-slate-600">
            REGIONAL {isGrant ? 'GRANT' : 'LISTING'}
          </p>
          <p className="h-full text-slate-500">
            This {isGrant ? 'grant' : 'listing'} is only open for people in{' '}
            <span className="font-semibold">{region}</span>
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
            View All Challenges
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
            <div
              key={skill}
              className="m-0 rounded-sm bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600"
            >
              {skill}
            </div>
          ))}
        </div>
      </div>

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
    </div>
  );
}
