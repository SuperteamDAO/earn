'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { startTopLoader } from '@/components/ui/toploader';

import {
  type SearchSkills,
  SearchSkillsSchema,
  type SearchStatus,
  SearchStatusSchema,
} from '../constants/schema';

interface UseSearchStateProps {
  readonly defaultSearchTerm?: string;
}

type QueryParamUpdates = Partial<
  Record<'q' | 'status' | 'skills', string | null>
>;

const statusesFrom = (params: URLSearchParams | null): SearchStatus[] =>
  (params?.get('status') ?? '')
    .split(',')
    .filter(Boolean)
    .flatMap((status) => {
      const parsed = SearchStatusSchema.safeParse(status);
      return parsed.success ? [parsed.data] : [];
    });

const skillsFrom = (params: URLSearchParams | null): SearchSkills[] =>
  (params?.get('skills') ?? '')
    .split(',')
    .filter(Boolean)
    .flatMap((skill) => {
      const parsed = SearchSkillsSchema.safeParse(skill);
      return parsed.success ? [parsed.data] : [];
    });

// The search page's query and filters, kept in the URL: a change navigates
// with the new parameters and the server renders the new first page. The
// page remounts on every URL (see the search page), so state starts from
// the URL each time.
export const useSearchState = ({
  defaultSearchTerm = '',
}: UseSearchStateProps = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [internalSearchTerm, setInternalSearchTerm] = useState<string>(
    () => searchParams?.get('q') ?? defaultSearchTerm,
  );
  const [internalActiveStatus, setInternalActiveStatus] = useState<
    SearchStatus[]
  >(() => statusesFrom(searchParams));
  const [internalActiveSkills, setInternalActiveSkills] = useState<
    SearchSkills[]
  >(() => skillsFrom(searchParams));

  const updateQueryParams = useCallback(
    (updates: QueryParamUpdates) => {
      const newParams = new URLSearchParams(
        Array.from(searchParams?.entries() ?? []),
      );

      const paramDefaults: Record<keyof QueryParamUpdates, unknown> = {
        q: defaultSearchTerm,
        status: null,
        skills: null,
      };

      for (const typedKey of ['q', 'status', 'skills'] as const) {
        if (!(typedKey in updates)) continue;
        const value = updates[typedKey];
        if (
          value === null ||
          value === undefined ||
          value === paramDefaults[typedKey] ||
          value === ''
        ) {
          newParams.delete(typedKey);
        } else {
          newParams.set(typedKey, value);
        }
      }

      const queryString = newParams.toString();
      const newPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
      startTopLoader();
      startTransition(() => {
        router.replace(newPath, { scroll: false });
      });
    },
    [searchParams, router, defaultSearchTerm, pathname],
  );

  const handleSearchTermChange = useCallback(
    (searchTerm: string) => {
      setInternalSearchTerm(searchTerm);
      updateQueryParams({ q: searchTerm });
    },
    [updateQueryParams],
  );

  const handleStatusChange = useCallback(
    (statuses: SearchStatus[]) => {
      setInternalActiveStatus(statuses);
      updateQueryParams({
        status: statuses.length > 0 ? statuses.join(',') : null,
      });
    },
    [updateQueryParams],
  );

  const handleSkillsChange = useCallback(
    (skills: SearchSkills[]) => {
      setInternalActiveSkills(skills);
      updateQueryParams({
        skills: skills.length > 0 ? skills.join(',') : null,
      });
    },
    [updateQueryParams],
  );

  const handleToggleStatus = useCallback(
    (status: SearchStatus) => {
      handleStatusChange(
        internalActiveStatus.includes(status)
          ? internalActiveStatus.filter((s) => s !== status)
          : [...internalActiveStatus, status],
      );
    },
    [internalActiveStatus, handleStatusChange],
  );

  const handleToggleSkill = useCallback(
    (skill: SearchSkills) => {
      handleSkillsChange(
        internalActiveSkills.includes(skill)
          ? internalActiveSkills.filter((s) => s !== skill)
          : [...internalActiveSkills, skill],
      );
    },
    [internalActiveSkills, handleSkillsChange],
  );

  const handleResetFilters = useCallback(() => {
    setInternalActiveStatus([]);
    setInternalActiveSkills([]);
    updateQueryParams({ status: null, skills: null });
  }, [updateQueryParams]);

  return {
    searchTerm: internalSearchTerm,
    activeStatus: internalActiveStatus,
    activeSkills: internalActiveSkills,
    // A navigation to new parameters is on its way.
    isPending,
    handleSearchTermChange,
    handleStatusChange,
    handleSkillsChange,
    handleToggleStatus,
    handleToggleSkill,
    handleResetFilters,
  };
};
