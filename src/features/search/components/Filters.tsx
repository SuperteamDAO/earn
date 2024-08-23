import { Checkbox, Stack, Text, VStack } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useState, useTransition } from 'react';

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
    <VStack
      className="ph-no-capture"
      align="start"
      gap={{ base: 4, md: 8 }}
      w="full"
      maxW="xl"
      px={{ base: 1, sm: 4 }}
      pb={2}
      pointerEvents={loading ? 'none' : 'auto'}
    >
      <VStack align="start">
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          STATUS
        </Text>
        <Stack
          flexWrap="wrap"
          direction={{ base: 'row', md: 'column' }}
          columnGap={{ base: 6, md: 4 }}
        >
          {statusFilters?.map((f) => (
            <Stack key={f.value}>
              <Checkbox
                _checked={{
                  '& .chakra-checkbox__control': {
                    background: 'brand.purple',
                    borderColor: 'brand.purple',
                  },
                }}
                checked={f.checked}
                defaultChecked={f.checked}
                disabled={loading}
                onChange={() => {
                  handleStatusChange(f.value);
                }}
                value={f.value}
              >
                <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
                  {f.label}
                </Text>
              </Checkbox>
            </Stack>
          ))}
        </Stack>
      </VStack>
      <VStack align="start">
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          SKILLS
        </Text>
        <Stack
          flexWrap="wrap"
          direction={{ base: 'row', md: 'column' }}
          columnGap={{ base: 6, md: 4 }}
        >
          {skillsFilters?.map((f) => (
            <Stack key={f.value}>
              <Checkbox
                _checked={{
                  '& .chakra-checkbox__control': {
                    background: 'brand.purple',
                    borderColor: 'brand.purple',
                  },
                }}
                checked={f.checked}
                defaultChecked={f.checked}
                disabled={loading}
                onChange={() => {
                  handleSkillsChange(f.value);
                }}
                value={f.value}
              >
                <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
                  {f.label}
                </Text>
              </Checkbox>
            </Stack>
          ))}
        </Stack>
      </VStack>
    </VStack>
  );
}
