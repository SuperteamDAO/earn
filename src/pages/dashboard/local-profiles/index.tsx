import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { UserFlag } from '@/components/shared/UserFlag';
import { Button } from '@/components/ui/button';
import { Superteams } from '@/constants/Superteam';
import { FilterSection } from '@/features/sponsor-dashboard/components/LocalProfiles/FilterSection';
import { UserTable } from '@/features/sponsor-dashboard/components/LocalProfiles/UserTable';
import { localProfilesQuery } from '@/features/sponsor-dashboard/queries/local-profiles';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

type SortDirection = 'asc' | 'desc' | null;

const debounce = require('lodash.debounce');
const usersPerPage = 15;

export default function LocalProfiles() {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({ column: '', direction: null });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const { user } = useUser();
  const { data: allUsers, isLoading } = useQuery(localProfilesQuery);

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('members tab_sponsor');
  }, []);

  const filteredUsers = allUsers?.filter((user) => {
    const searchLower = searchText.toLowerCase();
    const searchMatch =
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower);

    const selectedSkills = Object.keys(checkedItems).filter(
      (skill) => checkedItems[skill],
    );
    const userSkills = user.skills.flatMap(
      (skillGroup: any) => skillGroup.skills,
    );
    const skillsMatch =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => userSkills.includes(skill));

    return searchMatch && skillsMatch;
  });

  const sortedUsers = [...(filteredUsers || [])].sort((a, b) => {
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

  const superteam = Superteams.find(
    (st) => st.name === user?.currentSponsor?.name,
  );

  return (
    <SponsorLayout>
      <div className="mb-4 flex justify-between">
        <div className="flex items-center gap-2">
          {superteam?.code && <UserFlag location={superteam.code} isCode />}
          <p className="text-lg font-semibold text-slate-800">
            Local Earn Profiles
          </p>
          <div className="mx-1 h-[60%] border-r border-slate-200" />
          <p className="text-slate-500">
            All profiles that are based in {superteam?.displayValue}
          </p>
        </div>
        <FilterSection
          checkedItems={checkedItems}
          setCheckedItems={setCheckedItems}
          debouncedSetSearchText={debouncedSetSearchText}
          setCurrentPage={setCurrentPage}
        />
      </div>
      {isLoading && <LoadingSection />}
      {!isLoading && currentUsers && currentUsers?.length > 0 && (
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
    </SponsorLayout>
  );
}
