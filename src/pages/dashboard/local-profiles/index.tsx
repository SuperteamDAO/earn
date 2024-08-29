import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { UserFlag } from '@/components/shared/UserFlag';
import { Superteams } from '@/constants/Superteam';
import {
  FilterSection,
  localProfilesQuery,
  UserTable,
} from '@/features/sponsor-dashboard';
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
      <Flex justify="space-between" mb={4}>
        <Flex align="center" gap={2}>
          {superteam?.code && <UserFlag location={superteam.code} isCode />}
          <Text color="brand.slate.800" fontSize="lg" fontWeight={600}>
            Local Earn Profiles
          </Text>
          <Divider
            h="60%"
            mx={1}
            borderColor="brand.slate.200"
            orientation="vertical"
          />
          <Text color="brand.slate.500">
            All profiles that are based in {superteam?.displayValue}
          </Text>
        </Flex>
        <FilterSection
          checkedItems={checkedItems}
          setCheckedItems={setCheckedItems}
          debouncedSetSearchText={debouncedSetSearchText}
          setCurrentPage={setCurrentPage}
        />
      </Flex>
      {isLoading && <LoadingSection />}
      {!isLoading && currentUsers && currentUsers?.length > 0 && (
        <UserTable
          currentUsers={currentUsers}
          currentSort={currentSort}
          setSort={setSort}
        />
      )}
      {filteredUsers && filteredUsers?.length > 0 && (
        <Flex align="center" justify="end" mt={6}>
          <Text mr={4} color="brand.slate.400" fontSize="sm">
            <Text as="span" fontWeight={700}>
              {indexOfFirstUser + 1}
            </Text>{' '}
            -{' '}
            <Text as="span" fontWeight={700}>
              {Math.min(indexOfLastUser, filteredUsers?.length || 0)}
            </Text>{' '}
            of{' '}
            <Text as="span" fontWeight={700}>
              {filteredUsers?.length || 0}
            </Text>{' '}
            Members
          </Text>
          <Button
            mr={4}
            isDisabled={currentPage === 1}
            leftIcon={<ChevronLeftIcon w={5} h={5} />}
            onClick={handlePreviousPage}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            isDisabled={currentPage === totalPages}
            onClick={handleNextPage}
            rightIcon={<ChevronRightIcon w={5} h={5} />}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </Flex>
      )}
    </SponsorLayout>
  );
}
