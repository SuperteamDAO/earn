import { Link2 } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { Tooltip } from '@/components/ui/tooltip';

import { useListingForm } from '@/features/listing-builder/hooks';
import { Twitter } from '@/features/social/components/SocialIcons';

export function DefaultEligibilityQuestions() {
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  if (type === 'project') return null;
  else
    return (
      <div>
        <p className="pb-3 text-xs font-medium text-slate-500 uppercase">
          COLLECTED BY DEFAULT
        </p>
        <div className="flex flex-col gap-4">
          <Tooltip
            content={`This is a default field for your submission form. This question cannot be edited or removed.`}
          >
            <div className="flex h-9 cursor-not-allowed items-center rounded-md border bg-slate-100 opacity-80">
              <span className="flex h-full items-center rounded-md border-r px-4 text-slate-400">
                <Link2 className="h-4 w-4" />
              </span>
              <p className="pl-4 text-sm text-slate-500">
                {type === 'bounty' ? 'Bounty' : 'Hackathon'} submission link{' '}
                <span className="text-red-500">*</span>
              </p>
            </div>
          </Tooltip>
          <Tooltip
            content={`This is a default field for your submission form. This question cannot be edited or removed.`}
          >
            <div className="flex h-9 cursor-not-allowed items-center rounded-md border bg-slate-100 opacity-80">
              <span className="flex h-full items-center rounded-md border-r px-4 text-slate-400">
                <Twitter className="h-4 w-4 text-slate-400 opacity-100 grayscale-0" />
              </span>
              <p className="pl-4 text-sm text-slate-500">Twitter post</p>
            </div>
          </Tooltip>
        </div>
      </div>
    );
}
