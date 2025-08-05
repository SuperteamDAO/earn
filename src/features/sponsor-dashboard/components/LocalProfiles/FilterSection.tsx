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
import { type Superteam } from '@/constants/Superteam';
import { skillSubSkillMap } from '@/interface/skills';
import { api } from '@/lib/api';

interface FilterSectionProps {
  checkedItems: Record<string, boolean>;
  setCheckedItems: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  debouncedSetSearchText: (value: string) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  superteam: Superteam | undefined;
}

export const FilterSection = ({
  checkedItems,
  setCheckedItems,
  debouncedSetSearchText,
  setCurrentPage,
  superteam,
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
        `/api/sponsor-dashboard/local-talent/export/?superteamRegion=${superteam?.region}&superteamCountries=${superteam?.country}`,
      );
      return response.data;
    },
    onSuccess: async (data) => {
      const url = data?.url || '';
      if (url) {
        try {
          const response = await fetch(url, {
            headers: {
              Accept: 'text/csv,application/octet-stream',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const blob = await response.blob();

          const blobUrl = window.URL.createObjectURL(
            new Blob([blob], { type: 'text/csv' }),
          );

          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', `${'local-profiles'}.csv`);

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(blobUrl);

          toast.success('CSV exported successfully');
        } catch (error) {
          console.error('Download error:', error);
          toast.error('Failed to download CSV. Please try again.');
        }
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
            <span>Filter By Skills</span>
            <span>
              {selectedSkillsCount > 0 ? ` (${selectedSkillsCount})` : ''}
            </span>
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
                  className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mr-3"
                  checked={checkedItems[skill] || false}
                  onCheckedChange={() => handleCheckboxChange(skill)}
                />
                <span>{skill}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            <span>Export CSV</span>
          </>
        )}
      </Button>
    </div>
  );
};
