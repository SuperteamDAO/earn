import { useMutation } from '@tanstack/react-query';
import { ChevronDown, Download, Search } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { skillSubSkillMap } from '@/interface/skills';
import { api } from '@/lib/api';

interface FilterSectionProps {
  checkedItems: Record<string, boolean>;
  setCheckedItems: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  debouncedSetSearchText: (value: string) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const FilterSection = ({
  checkedItems,
  setCheckedItems,
  debouncedSetSearchText,
  setCurrentPage,
}: FilterSectionProps) => {
  const mainSkills = Object.keys(skillSubSkillMap);
  const selectedSkillsCount =
    Object.values(checkedItems).filter(Boolean).length;

  const handleCheckboxChange = (skill: string) => {
    setCheckedItems((prev) => ({ ...prev, [skill]: !prev[skill] }));
    setCurrentPage(1);
  };

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/api/sponsor-dashboard/local-profiles/export/`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      if (url) {
        window.open(url, '_blank');
        toast.success('CSV exported successfully');
      } else {
        toast.error('Export URL is empty');
      }
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-9 w-40 border-slate-300 font-medium text-slate-400 hover:text-slate-500"
            size="sm"
            variant="outline"
          >
            Filter By Skills
            {selectedSkillsCount > 0 ? ` (${selectedSkillsCount})` : ''}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {mainSkills.map((skill) => (
            <DropdownMenuItem
              key={skill}
              className="text-slate-500"
              onSelect={(e) => {
                e.preventDefault();
                handleCheckboxChange(skill);
              }}
            >
              <div className="flex items-center">
                <Checkbox
                  className="mr-3 data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
                  checked={checkedItems[skill] || false}
                  onCheckedChange={() => handleCheckboxChange(skill)}
                />
                {skill}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="placeholder:text-md h-9 border-slate-300 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-slate-300"
          onChange={(e) => {
            debouncedSetSearchText(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search users..."
          type="text"
        />
      </div>

      <Button
        className="h-9 border border-slate-300 px-4 font-medium text-slate-400"
        disabled={exportMutation.isPending}
        onClick={() => exportMutation.mutate()}
        size="sm"
        variant="ghost"
      >
        {exportMutation.isPending ? (
          <>
            <span className="loading loading-spinner mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </>
        )}
      </Button>
    </div>
  );
};
