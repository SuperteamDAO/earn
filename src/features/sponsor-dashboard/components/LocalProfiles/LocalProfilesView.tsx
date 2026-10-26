'use client';

import debounce from 'lodash.debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { posthog } from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Button } from '@/components/ui/button';
import { useViewer } from '@/lib/viewer';
import type { LocalProfile } from '@/server/local-profiles';

import { FilterSection } from '@/features/sponsor-dashboard/components/LocalProfiles/FilterSection';
import { UserTable } from '@/features/sponsor-dashboard/components/LocalProfiles/UserTable';

type SortDirection = 'asc' | 'desc' | null;

const usersPerPage = 15;

// The chapter's local talent, loaded on the server, searched, filtered,
// sorted and paged here as Earn did.
export function LocalProfilesView({
  profiles: allUsers,
}: {
  profiles: ReadonlyArray<LocalProfile>;
}) {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({ column: '', direction: null });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const user = useViewer();
  const sponsorChapter = user?.currentSponsor?.chapter;

  const debouncedSetSearchTextRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);

    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  }, [setSearchText]);

  useEffect(() => {
    posthog.capture('members tab_sponsor');
  }, []);

  const filteredUsers = allUsers?.filter((profile) => {
    const searchLower = searchText.toLowerCase();
    const searchMatch =
      profile.username.toLowerCase().includes(searchLower) ||
      profile.email.toLowerCase().includes(searchLower) ||
      profile.firstName.toLowerCase().includes(searchLower) ||
      profile.lastName.toLowerCase().includes(searchLower) ||
      `${profile.firstName} ${profile.lastName}`
        .toLowerCase()
        .includes(searchLower);

    const selectedSkills = Object.keys(checkedItems).filter(
      (skill) => checkedItems[skill],
    );
    const userSkills = profile.skills.flatMap(
      (skillGroup) => skillGroup.skills,
    );
    const skillsMatch =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => userSkills.includes(skill));

    return searchMatch && skillsMatch;
  });

  const sortedUsers = (filteredUsers || []).toSorted((a, b) => {
    if (currentSort.direction === null) return 0;

    const factor = currentSort.direction === 'asc' ? 1 : -1;

    switch (currentSort.column) {
      case 'user':
        return (
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          ) * factor
        );
      case 'earned':
        return (a.totalEarnings - b.totalEarnings) * factor;
      case 'rank':
        return (a.rank - b.rank) * factor;
      case 'submissions':
        return (a.totalSubmissions - b.totalSubmissions) * factor;
      case 'wins':
        return (a.wins - b.wins) * factor;
      default:
        return 0;
    }
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;

  const currentUsers = sortedUsers?.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil((sortedUsers?.length || 0) / usersPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const setSort = (column: string, direction: SortDirection) => {
    setCurrentSort({ column, direction });
    setCurrentPage(1);
  };

  return (
    <>
      <div className="mb-4 flex justify-between">
        <div className="flex items-center gap-2">
          {sponsorChapter?.code && (
            <UserFlag location={sponsorChapter.code} isCode />
          )}
          <p className="text-lg font-semibold text-slate-800">
            Local Earn Profiles
          </p>
          <div className="mx-1 h-[60%] border-r border-slate-200" />
          <p className="text-slate-500">
            All profiles that are based in{' '}
            {sponsorChapter?.displayValue || sponsorChapter?.region}
          </p>
        </div>
        <FilterSection
          checkedItems={checkedItems}
          setCheckedItems={setCheckedItems}
          debouncedSetSearchText={(value: string) => {
            debouncedSetSearchTextRef.current?.(value);
          }}
          setCurrentPage={setCurrentPage}
        />
      </div>
      {currentUsers && currentUsers?.length > 0 && (
        <UserTable
          currentUsers={currentUsers}
          currentSort={currentSort}
          setSort={setSort}
        />
      )}
      {filteredUsers && filteredUsers?.length > 0 && (
        <div className="mt-6 flex items-center justify-end">
          <p className="mr-4 text-sm text-slate-400">
            <span className="font-bold">{indexOfFirstUser + 1}</span> -{' '}
            <span className="font-bold">
              {Math.min(indexOfLastUser, filteredUsers?.length || 0)}
            </span>{' '}
            of <span className="font-bold">{filteredUsers?.length || 0}</span>{' '}
            Members
          </p>
          <div className="flex gap-4">
            <Button
              className="flex items-center"
              disabled={currentPage === 1}
              onClick={handlePreviousPage}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
            <Button
              className="flex items-center"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
