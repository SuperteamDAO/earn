import { cn } from '@/utils/cn';

import { HighQualityImage } from './HighQualityImage';

type ListingType = 'development' | 'content' | 'community' | 'design';

type Skills =
  | 'frontend'
  | 'backend'
  | 'writing'
  | 'marketing'
  | 'community'
  | 'design';
const skillColors: Record<Skills, { foreground: string; background: string }> =
  {
    frontend: {
      foreground: '#0D3D99',
      background: '#990D8B0A',
    },
    backend: {
      foreground: '#2384F5',
      background: '#2384F50A',
    },
    writing: {
      foreground: '#0D3D99',
      background: '#0D3D990A',
    },
    marketing: {
      foreground: '#F56F23',
      background: '#F56F230A',
    },
    community: {
      foreground: '#838281',
      background: '#8382810A',
    },
    design: {
      foreground: '#FF0000',
      background: '#FF00000A',
    },
  };

export interface ListingCardProps {
  pfp: string;
  title: string;
  name: string;
  description: string;
  skills: Skills[];
  submissionCount: number;
  token: string;
  tokenIcon: string;
  amount: string;
  type: ListingType;
}

export function ListingCard({
  pfp,
  title,
  name,
  description,
  skills,
  submissionCount,
  token,
  tokenIcon,
  amount,
}: ListingCardProps) {
  return (
    <div className="flex h-[18.75rem] w-[21.5rem] flex-col rounded-md border border-slate-200 bg-white shadow-[0px_4px_6px_0px_rgba(226,232,240,0.41)]">
      <div className="flex h-full flex-col items-start gap-4 p-4 pb-3">
        <div className="flex w-full gap-4">
          <HighQualityImage
            alt="Pied Piper Logo"
            src={pfp}
            className="h-12 w-12"
          />
          <div className="flex w-full flex-grow flex-col items-start gap-0 text-sm">
            <p className="font-semibold text-slate-700">{title}</p>
            <p className="bg-slate-50 font-semibold text-slate-400">
              By {name}
            </p>
          </div>
        </div>

        <p className="line-clamp-4 text-sm font-medium text-slate-500">
          {description}
        </p>

        <div className="mt-auto flex w-full justify-between text-xs">
          <p className="font-medium text-slate-400">Skills</p>
          <div className="flex gap-2">
            {skills.map((s) => (
              <p
                key={s}
                className={cn(
                  'rounded-md px-2 py-1 font-medium capitalize',
                  `text-[${skillColors[s].foreground}] bg-[${skillColors[s].background}]`,
                )}
              >
                {s}
              </p>
            ))}
          </div>
        </div>
      </div>

      <hr />

      <div className="flex w-full justify-between px-4 pb-4 pt-2">
        <div className="flex gap-2">
          <HighQualityImage
            className="h-5 w-5"
            src={tokenIcon}
            alt={`${token} icon`}
          />
          <p className="font-semibold text-slate-800">{amount}</p>
        </div>
        <div className="flex gap-2">
          <p className="font-semibold text-slate-800">{submissionCount}</p>
          <p className="font-semibold text-slate-500">Submissions</p>
        </div>
      </div>
    </div>
  );
}
