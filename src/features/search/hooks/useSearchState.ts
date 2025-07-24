import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

export const useSearchState = ({
  defaultSearchTerm = '',
}: UseSearchStateProps = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsFromHook = useSearchParams();

  const searchParams = useMemo(
    () => searchParamsFromHook ?? new URLSearchParams(),
    [searchParamsFromHook],
  );

  const getSearchTermFromParams = useCallback(
    (params: URLSearchParams): string => {
      const searchParam = params.get('q');
      return searchParam ?? defaultSearchTerm;
    },
    [defaultSearchTerm],
  );

  const getStatusFromParams = useCallback(
    (params: URLSearchParams): SearchStatus[] => {
      const statusParam = params.get('status');
      if (!statusParam) return [];

      const statusArray = statusParam.split(',').filter(Boolean);
      const validStatuses: SearchStatus[] = [];

      for (const status of statusArray) {
        const parsed = SearchStatusSchema.safeParse(status);
        if (parsed.success) {
          validStatuses.push(parsed.data);
        }
      }

      return validStatuses;
    },
    [],
  );

  const getSkillsFromParams = useCallback(
    (params: URLSearchParams): SearchSkills[] => {
      const skillsParam = params.get('skills');
      if (!skillsParam) return [];

      const skillsArray = skillsParam.split(',').filter(Boolean);
      const validSkills: SearchSkills[] = [];

      for (const skill of skillsArray) {
        const parsed = SearchSkillsSchema.safeParse(skill);
        if (parsed.success) {
          validSkills.push(parsed.data);
        }
      }

      return validSkills;
    },
    [],
  );

  const [internalSearchTerm, setInternalSearchTerm] = useState<string>(() =>
    getSearchTermFromParams(searchParams),
  );

  const [internalActiveStatus, setInternalActiveStatus] = useState<
    SearchStatus[]
  >(() => getStatusFromParams(searchParams));

  const [internalActiveSkills, setInternalActiveSkills] = useState<
    SearchSkills[]
  >(() => getSkillsFromParams(searchParams));

  useEffect(() => {
    const searchTermFromUrl = getSearchTermFromParams(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setInternalSearchTerm((currentInternalTerm) => {
      if (searchTermFromUrl !== currentInternalTerm) {
        return searchTermFromUrl;
      }
      return currentInternalTerm;
    });
  }, [searchParams, getSearchTermFromParams]);

  useEffect(() => {
    const statusFromUrl = getStatusFromParams(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setInternalActiveStatus((currentInternalStatus) => {
      const statusChanged =
        statusFromUrl.length !== currentInternalStatus.length ||
        statusFromUrl.some(
          (status, index) => status !== currentInternalStatus[index],
        );

      if (statusChanged) {
        return statusFromUrl;
      }
      return currentInternalStatus;
    });
  }, [searchParams, getStatusFromParams]);

  useEffect(() => {
    const skillsFromUrl = getSkillsFromParams(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setInternalActiveSkills((currentInternalSkills) => {
      const skillsChanged =
        skillsFromUrl.length !== currentInternalSkills.length ||
        skillsFromUrl.some(
          (skill, index) => skill !== currentInternalSkills[index],
        );

      if (skillsChanged) {
        return skillsFromUrl;
      }
      return currentInternalSkills;
    });
  }, [searchParams, getSkillsFromParams]);

  const updateQueryParams = useCallback(
    (updates: QueryParamUpdates) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()));

      const paramDefaults: Record<keyof QueryParamUpdates, unknown> = {
        q: defaultSearchTerm,
        status: null,
        skills: null,
      };

      for (const key in updates) {
        const typedKey = key as keyof QueryParamUpdates;
        const value = updates[typedKey];
        const defaultValueForKey = paramDefaults[typedKey];

        if (
          value === null ||
          value === undefined ||
          value === defaultValueForKey ||
          value === ''
        ) {
          newParams.delete(typedKey);
        } else {
          newParams.set(typedKey, String(value));
        }
      }

      const queryString = newParams.toString();
      const newPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
      window.history.replaceState(
        window.history.state,
        document.title,
        newPath,
      );
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
      const statusParam = statuses.length > 0 ? statuses.join(',') : null;
      updateQueryParams({ status: statusParam });
    },
    [updateQueryParams],
  );

  const handleSkillsChange = useCallback(
    (skills: SearchSkills[]) => {
      setInternalActiveSkills(skills);
      const skillsParam = skills.length > 0 ? skills.join(',') : null;
      updateQueryParams({ skills: skillsParam });
    },
    [updateQueryParams],
  );

  const handleToggleStatus = useCallback(
    (status: SearchStatus) => {
      const newStatuses = internalActiveStatus.includes(status)
        ? internalActiveStatus.filter((s) => s !== status)
        : [...internalActiveStatus, status];

      handleStatusChange(newStatuses);
    },
    [internalActiveStatus, handleStatusChange],
  );

  const handleToggleSkill = useCallback(
    (skill: SearchSkills) => {
      const newSkills = internalActiveSkills.includes(skill)
        ? internalActiveSkills.filter((s) => s !== skill)
        : [...internalActiveSkills, skill];

      handleSkillsChange(newSkills);
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
    handleSearchTermChange,
    handleStatusChange,
    handleSkillsChange,
    handleToggleStatus,
    handleToggleSkill,
    handleResetFilters,
  };
};
