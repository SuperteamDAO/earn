import debounce from 'lodash.debounce';
import { Info } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils';

import { type SKILL, type TIMEFRAME } from '../types';

const tabfontsize = {
  base: 'xs',
  sm: 'sm',
};

interface Props {
  timeframe: TIMEFRAME;
  setTimeframe: (value: TIMEFRAME) => void;
  skill: SKILL;
  setSkill: (value: SKILL) => void;
}

export function FilterRow({ timeframe, setTimeframe, setSkill, skill }: Props) {
  const debouncedSetSkill = useCallback(debounce(decideSkill, 500), []);
  const [isLabelOpen, setIsLabelOpen] = useState(false);

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
    <div className="flex w-full flex-col border-b pb-2">
      <div className="hide-scrollbar flex w-full justify-between overflow-x-auto overflow-y-hidden border-slate-200">
        <Tabs
          defaultValue={String(skillIndexOf(skill))}
          onValueChange={(value) => debouncedSetSkill(Number(value))}
          className="text-slate-400"
        >
          <TabsList className="flex h-auto items-center border-b-0 bg-transparent">
            <TabsTrigger
              value="0"
              className={cn(
                'my-0 w-max px-2',
                'data-[state=active]:bg-brand-purple data-[state=active]:text-white',
                tabfontsize,
              )}
            >
              Overall Rankings
            </TabsTrigger>
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <TabsTrigger
              value="1"
              className={cn(
                'my-0 px-2',
                'data-[state=active]:bg-brand-purple data-[state=active]:text-white',
                tabfontsize,
              )}
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="2"
              className={cn(
                'my-0 px-2',
                'data-[state=active]:bg-brand-purple data-[state=active]:text-white',
                tabfontsize,
              )}
            >
              Design
            </TabsTrigger>
            <TabsTrigger
              value="3"
              className={cn(
                'my-0 px-2',
                'data-[state=active]:bg-brand-purple data-[state=active]:text-white',
                tabfontsize,
              )}
            >
              Development
            </TabsTrigger>
            <TabsTrigger
              value="4"
              className={cn(
                'my-0 px-2',
                'data-[state=active]:bg-brand-purple data-[state=active]:text-white',
                tabfontsize,
              )}
            >
              Others
            </TabsTrigger>
            <div className="relative">
              <TooltipProvider>
                <Tooltip open={isLabelOpen}>
                  <TooltipTrigger asChild>
                    <Info
                      className="ml-2 h-3 w-3 cursor-pointer"
                      onMouseEnter={() => setIsLabelOpen(true)}
                      onMouseLeave={() => setIsLabelOpen(false)}
                      onClick={() => setIsLabelOpen(true)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The skill filters showcase users based on the skills
                      requested in the listings they&apos;ve successfully won,
                      not the skills listed in their talent profiles.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsList>
        </Tabs>
        <div className="hidden items-center md:flex">
          <Timeframe value={timeframe} setValue={setTimeframe} />
        </div>
      </div>
      <div className="flex w-full justify-between pl-2 text-xs sm:text-sm md:hidden">
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
      <SelectTrigger className="h-auto border-0 p-0 text-xs font-medium text-slate-600 focus:ring-0 focus:ring-offset-0 sm:text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL_TIME">All Time</SelectItem>
        <SelectItem value="THIS_YEAR">This Year</SelectItem>
        <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
        <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
      </SelectContent>
    </Select>
  );
}
