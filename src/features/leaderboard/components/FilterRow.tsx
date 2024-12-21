import debounce from 'lodash.debounce';
import { Info } from 'lucide-react';
import { useCallback } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';

import { type SKILL, type TIMEFRAME } from '../types';

interface Props {
  timeframe: TIMEFRAME;
  setTimeframe: (value: TIMEFRAME) => void;
  skill: SKILL;
  setSkill: (value: SKILL) => void;
}

export function FilterRow({ timeframe, setTimeframe, setSkill, skill }: Props) {
  const debouncedSetSkill = useCallback(debounce(decideSkill, 500), []);

  function decideSkill(value: number) {
    switch (value) {
      case 0:
        setSkill('ALL');
        break;
      case 1:
        setSkill('CONTENT');
        break;
      case 2:
        setSkill('DESIGN');
        break;
      case 3:
        setSkill('DEVELOPMENT');
        break;
      case 4:
        setSkill('OTHER');
        break;
    }
  }

  function skillIndexOf(value: SKILL): number {
    switch (value) {
      case 'ALL':
        return 0;
      case 'CONTENT':
        return 1;
      case 'DESIGN':
        return 2;
      case 'DEVELOPMENT':
        return 3;
      case 'OTHER':
        return 4;
      default:
        return 0;
    }
  }

  return (
    <div className="flex w-full flex-col">
      <div className="hide-scrollbar flex w-full justify-between overflow-x-auto overflow-y-hidden border-slate-200 pb-2">
        <Tabs
          defaultValue={String(skillIndexOf(skill))}
          onValueChange={(value) => debouncedSetSkill(Number(value))}
          className="text-slate-400"
        >
          <TabsList className="flex items-center">
            <TabsTrigger value="0" className="px-1 sm:px-3">
              Overall Rankings
            </TabsTrigger>
            <div className="mx-1 h-6 w-px bg-slate-200 sm:mx-2" />
            <TabsTrigger value="1" className="px-1.5 sm:px-3">
              Content
            </TabsTrigger>
            <TabsTrigger value="2" className="px-1.5 sm:px-3">
              Design
            </TabsTrigger>
            <TabsTrigger value="3" className="px-1.5 sm:px-3">
              Development
            </TabsTrigger>
            <TabsTrigger value="4" className="px-1.5 sm:px-3">
              Others
            </TabsTrigger>
            <div className="relative">
              <Tooltip
                content={
                  <p>
                    The skill filters showcase users based on the skills
                    requested in the listings they&apos;ve successfully won, not
                    the skills listed in their talent profiles.
                  </p>
                }
              >
                <Info className="ml-2 h-3 w-3 cursor-pointer" />
              </Tooltip>
            </div>
          </TabsList>
        </Tabs>
        <div className="hidden items-center md:flex">
          <Timeframe value={timeframe} setValue={setTimeframe} />
        </div>
      </div>
      <div className="-mt-2.5 h-0.5 w-full bg-slate-200 sm:-mt-2" />
      <div className="mt-3 flex w-full justify-between pl-2 text-xs sm:text-sm md:hidden">
        <p className="text-slate-400">Timeframe</p>
        <div className="flex">
          <Timeframe value={timeframe} setValue={setTimeframe} />
        </div>
      </div>
    </div>
  );
}

function Timeframe({
  value,
  setValue,
}: {
  value: TIMEFRAME;
  setValue: (value: TIMEFRAME) => void;
}) {
  const debouncedSetTimeframe = useCallback(debounce(setValue, 500), []);

  return (
    <Select
      onValueChange={(value) => debouncedSetTimeframe(value as TIMEFRAME)}
      value={value}
    >
      <SelectTrigger className="h-auto border-0 p-0 text-xs font-medium text-slate-500 focus:ring-0 focus:ring-offset-0 sm:text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="text-slate-500">
        <SelectItem value="ALL_TIME">All Time</SelectItem>
        <SelectItem value="THIS_YEAR">This Year</SelectItem>
        <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
        <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
      </SelectContent>
    </Select>
  );
}
