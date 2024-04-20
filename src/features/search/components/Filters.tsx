import { Checkbox, Stack, Text, VStack } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useState, useTransition } from 'react';

import { type CheckboxFilter } from '../types';
import { serverSearch } from '../utils';

interface Props {
  statusFilters: CheckboxFilter[];
  skillsFilters: CheckboxFilter[];
  query: string;
}

export function Filters({ statusFilters, skillsFilters, query }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [status, setStatus] = useState(searchParams.get('status') ?? undefined);
  const [skills, setSkills] = useState(searchParams.get('skills') ?? undefined);

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
      serverSearch(startTransition, router, query, { skills });
    } else {
      serverSearch(startTransition, router, query, {
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
    console.log('skill query - ', skillQuery);
    if (skillQuery === '') {
      serverSearch(startTransition, router, query, { status });
    } else {
      serverSearch(startTransition, router, query, {
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
    >
      <VStack align="start">
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          STATUS
        </Text>
        <Stack
          direction={{ base: 'row', md: 'column' }}
          gap={{ base: 6, md: 4 }}
        >
          {statusFilters?.map((f) => (
            <Stack key={f.value}>
              <Checkbox
                checked={f.checked}
                defaultChecked={f.checked}
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
          direction={{ base: 'row', md: 'column' }}
          gap={{ base: 6, md: 4 }}
        >
          {skillsFilters?.map((f) => (
            <Stack key={f.value}>
              <Checkbox
                checked={f.checked}
                defaultChecked={f.checked}
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
