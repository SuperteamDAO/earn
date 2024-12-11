import debounce from 'lodash.debounce';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useState, useTransition } from 'react';

import { Checkbox } from '@/components/ui/checkbox';

import { type CheckboxFilter } from '../types';
import { serverSearch } from '../utils';

interface Props {
  statusFilters: CheckboxFilter[];
  skillsFilters: CheckboxFilter[];
  query: string;
  loading: boolean;
}

export function Filters({
  statusFilters,
  skillsFilters,
  query,
  loading,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [status, setStatus] = useState(searchParams.get('status') ?? undefined);
  const [skills, setSkills] = useState(searchParams.get('skills') ?? undefined);

  const debouncedServerSearch = useCallback(debounce(serverSearch, 500), []);

  const handleStatusChange = (value: string) => {
    const statusArray = status ? status.split(',') : [];
    let statusQuery = '';
    if (statusArray.includes(value)) {
      if (statusArray.length !== 1) {
        statusQuery = statusArray
          .filter((status) => status !== value)
          .join(',');
      }
    } else {
      statusQuery = [...statusArray, value].join(',');
    }
    setStatus(statusQuery);
    if (statusQuery === '') {
      debouncedServerSearch(startTransition, router, query, { skills });
    } else {
      debouncedServerSearch(startTransition, router, query, {
        status: statusQuery,
        skills,
      });
    }
  };

  const handleSkillsChange = (value: string) => {
    const skillsArray = skills ? skills.split(',') : [];
    let skillQuery = '';
    if (skillsArray.includes(value)) {
      skillQuery = skillsArray.filter((skill) => skill !== value).join(',');
    } else {
      skillQuery = [...skillsArray, value].join(',');
    }
    setSkills(skillQuery);
    if (skillQuery === '') {
      debouncedServerSearch(startTransition, router, query, { status });
    } else {
      debouncedServerSearch(startTransition, router, query, {
        status,
        skills: skillQuery,
      });
    }
  };

  return (
    <div
      className={`ph-no-capture flex w-full max-w-xl flex-col items-start gap-4 px-1 pb-2 sm:px-4 md:gap-8 ${
        loading ? 'pointer-events-none' : ''
      }`}
    >
      <div className="flex w-full flex-col items-start">
        <p className="mb-3 text-sm font-medium text-slate-500">STATUS</p>
        <div className="flex flex-wrap gap-6 md:flex-col md:gap-2">
          {statusFilters?.map((f) => (
            <div key={f.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${f.value}`}
                checked={f.checked}
                defaultChecked={f.checked}
                disabled={loading}
                onCheckedChange={() => handleStatusChange(f.value)}
                className="border-slate-300 data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
              />
              <label
                htmlFor={`status-${f.value}`}
                className="text-sm font-medium text-slate-500"
              >
                {f.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-start">
        <p className="mb-3 text-sm font-medium text-slate-500">SKILLS</p>
        <div className="flex flex-wrap gap-6 md:flex-col md:gap-2">
          {skillsFilters?.map((f) => (
            <div key={f.value} className="flex items-center space-x-2">
              <Checkbox
                id={`skill-${f.value}`}
                checked={f.checked}
                defaultChecked={f.checked}
                disabled={loading}
                onCheckedChange={() => handleSkillsChange(f.value)}
                className="border-slate-300 data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
              />
              <label
                htmlFor={`skill-${f.value}`}
                className="text-sm font-medium text-slate-500"
              >
                {f.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
