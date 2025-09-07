import dayjs from 'dayjs';
import { ArrowDown } from 'lucide-react';
import { useState } from 'react';

import BsFillLaptopFill from '@/components/icons/BsFillLaptopFill';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { type BountyType } from '@/generated/prisma/enums';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

import { getListingIcon } from '@/features/listings/utils/getListingIcon';
interface AutoGenerateTypeProps {
  setType: (type: BountyType | 'hackathon') => void;
  type: BountyType | 'hackathon';
  hackathons?: HackathonModel[];
  setHackathonSlug: (hackathon: string) => void;
  hackathonSlug: string;
}
export function AutoGenerateStageType({
  setType,
  hackathons,
  setHackathonSlug,
}: AutoGenerateTypeProps) {
  const [showHackathon, setShowHackathon] = useState(false);

  return (
    <div>
      <div className="flex">
        <div className="relative flex-1">
          <div className="relative mb-6 flex items-center justify-center bg-violet-50 px-32 py-12">
            <ExternalImage
              className="h-auto w-full"
              alt="Bounty Illustration"
              src={'/dashboard/bounty_illustration.svg'}
            />
            <div className="absolute top-4 right-4 flex items-center rounded-full bg-white px-3 py-1 text-violet-500">
              <BountyIcon
                styles={{
                  width: '1rem',
                  height: '1rem',
                  marginRight: '0.25rem',
                  color: 'red',
                  fill: '#8B5CF6',
                }}
              />
              <p className="text-sm font-bold">Bounty</p>
            </div>
          </div>

          <div className="p-8">
            <h3 className="mb-4 text-lg font-semibold">
              Host a Work Competition
            </h3>
            <p className="mb-4 text-slate-500">
              All participants complete your scope of work, and the best
              submission(s) are rewarded. Get multiple options to choose from.
            </p>
            <Button
              className="w-full py-6"
              onClick={() => setType('bounty')}
              size="lg"
            >
              Create a Bounty
            </Button>
          </div>
        </div>

        <div className="relative flex-1 border-l border-slate-200">
          <div className="relative mb-6 flex items-center justify-center bg-blue-50 px-32 py-12">
            <ExternalImage
              className="h-auto w-full"
              alt="Project Illustration"
              src={'/dashboard/project_illustration.svg'}
            />
            <div className="absolute top-4 right-4 flex items-center rounded-full bg-white px-3 py-1 text-blue-500">
              <ProjectIcon
                styles={{
                  width: '1rem',
                  height: '1rem',
                  marginRight: '0.25rem',
                  color: 'red',
                  fill: '#3B82F6',
                }}
              />
              <p className="text-sm font-bold">Project</p>
            </div>
          </div>

          <div className="p-8">
            <h3 className="mb-4 text-lg font-semibold">Hire a Freelancer</h3>
            <p className="mb-4 text-slate-500">
              Get applications based on a questionnaire set by you, and select
              one applicant to work with. Give a fixed budget, or ask for
              quotes.
            </p>
            <Button
              className="w-full py-6"
              onClick={() => setType('project')}
              size="lg"
            >
              Create a Project
            </Button>
          </div>
        </div>
      </div>
      {hackathons && (
        <>
          {showHackathon ? (
            <div className="flex border-t border-slate-200 bg-stone-50">
              <div className="relative flex items-center justify-center bg-rose-50 px-16 py-2">
                <ExternalImage
                  className="w-52"
                  alt="Hackathons Illustration"
                  src={'/dashboard/hackathons_illustration.svg'}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-rose-400">
                  <BsFillLaptopFill className="size-3 fill-rose-400" />
                  <p className="text-xs font-bold">Hackathon</p>
                </div>
              </div>
              <div className="p-8">
                <h3 className="mb-2 text-lg font-semibold">
                  Host a Hackathon Track
                </h3>
                <p className="mb-4 text-slate-500">
                  Add your challenge to an ongoing hackathon. Pick winners and
                  reward the best work. Choose one to get started.
                </p>
                <div className="flex flex-wrap gap-8">
                  {hackathons?.map((hackathon) => (
                    <Button
                      key={hackathon.id}
                      variant="outline"
                      size="sm"
                      className="h-auto border-slate-300 py-2"
                      onClick={() => {
                        setHackathonSlug(hackathon.slug);
                        setType('hackathon');
                      }}
                    >
                      {hackathon.altLogo ? (
                        <img
                          src={hackathon.altLogo}
                          alt={hackathon.name}
                          className="size-8 rounded-sm"
                        />
                      ) : (
                        <BsFillLaptopFill className="size-4 fill-rose-400" />
                      )}
                      <div className="flex flex-col items-start gap-0">
                        <p className="text-sm font-semibold text-slate-700">
                          {hackathon.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Deadline:{' '}
                          {dayjs(hackathon.deadline).format('DD/MM/YYYY')}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <Button
                onClick={() => setShowHackathon(true)}
                className="w-full justify-between px-8 pb-2"
                variant="outline"
              >
                <span className="flex items-center gap-3 text-slate-500">
                  <BsFillLaptopFill className="size-4 fill-slate-500" />
                  Host a Hackathon Track
                </span>
                <span>
                  <ArrowDown className="!size-4 text-slate-500" />
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function AutoGenerateDropdownType({
  type,
  setType,
  hackathons,
  setHackathonSlug,
  hackathonSlug,
}: AutoGenerateTypeProps) {
  const currentHackathon = hackathons?.find((h) => h.slug === hackathonSlug);

  const handleValueChange = (value: string) => {
    if (value === 'bounty' || value === 'project') {
      setType(value);
    } else {
      setType('hackathon');
      setHackathonSlug(value);
    }
  };

  const getDisplayValue = () => {
    if (type === 'hackathon' && currentHackathon) {
      return currentHackathon.slug;
    }
    return type;
  };

  const getDisplayLabel = () => {
    if (type === 'hackathon' && currentHackathon) {
      return currentHackathon.name;
    }
    return type === 'bounty' ? 'Bounty' : 'Project';
  };

  return (
    <Select value={getDisplayValue()} onValueChange={handleValueChange}>
      <SelectTrigger className="h-8 w-auto font-medium text-slate-500">
        <div className="flex items-center gap-2 pr-2">
          {getListingIcon(type)}
          <span className="max-w-20 truncate">{getDisplayLabel()}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="font-medium text-slate-500">
        <SelectItem value="bounty">
          <div className="flex items-center gap-2">
            {getListingIcon('bounty')}
            <span>Bounty</span>
          </div>
        </SelectItem>
        <SelectItem value="project">
          <div className="flex items-center gap-2">
            {getListingIcon('project')}
            <span>Project</span>
          </div>
        </SelectItem>
        {hackathons?.map((hackathon) => (
          <SelectItem key={hackathon.id} value={hackathon.slug}>
            <div className="flex items-center gap-2">
              {getListingIcon('hackathon')}
              <span className="max-w-20 truncate">{hackathon.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
