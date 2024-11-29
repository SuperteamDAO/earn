import { Box, Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import { atom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { EarnAvatar } from '@/features/talent';
import type { SponsorType } from '@/interface/sponsor';
import { useUpdateUser, useUser } from '@/store/user';

interface SponsorOptionType extends SponsorType {
  role?: string;
}

interface SponsorOption {
  value: string;
  label: string;
  sponsor: SponsorOptionType;
}

export const hackathonSponsorAtom = atom<string | null>(null);

export function SelectSponsor({
  type,
  isExpanded = false,
}: {
  type?: string;
  isExpanded?: boolean;
}) {
  const { user } = useUser();
  const updateUser = useUpdateUser();

  const [selectedSponsor, setSelectedSponsor] = useState<SponsorOption | null>(
    null,
  );
  const setHackathonSponsor = useSetAtom(hackathonSponsorAtom);

  useEffect(() => {
    if (type !== 'hackathon' && user?.currentSponsor?.id) {
      setSelectedSponsor({
        value: user?.currentSponsor?.id,
        label: user?.currentSponsor?.name,
        sponsor: user?.currentSponsor,
      });
    }
  }, [user]);

  const loadSponsors = (
    inputValue: string,
    callback: (options: SponsorOption[]) => void,
  ) => {
    axios
      .get(`/api/sponsors/list/`, {
        params: {
          searchString: inputValue,
        },
      })
      .then((response) => {
        const options = [...(response?.data || [])];
        callback(options);
      });
  };

  const updateSponsor = async (sponsorId: string) => {
    try {
      await updateUser.mutateAsync({ currentSponsorId: sponsorId });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = async (option?: any) => {
    if (type === 'hackathon') {
      setHackathonSponsor(option.value);
      setSelectedSponsor(option);
    } else {
      await updateSponsor(option.value);
    }
  };

  // eslint-disable-next-line unused-imports/no-unused-vars
  const SingleValue = ({ children, ...props }: any) => {
    const { data, selectProps } = props;

    if (selectProps.menuIsOpen) {
      return <components.SingleValue {...props}></components.SingleValue>;
    }

    return (
      <components.SingleValue {...props}>
        <Flex align="center" py={1}>
          <EarnAvatar
            id={data?.sponsor?.name}
            avatar={data?.sponsor?.logo}
            borderRadius="rounded-sm"
            size={'24px'}
          />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Flex>
              <Text color="brand.slate.800" fontSize="sm">
                {data?.sponsor?.name}
              </Text>
            </Flex>
            <Text color="brand.slate.400" fontSize="xs">
              {data?.sponsor?.role}
            </Text>
          </Box>
        </Flex>
      </components.SingleValue>
    );
  };

  const Option = (props: any) => {
    const { data } = props;
    return (
      <components.Option {...props}>
        <Flex align="center">
          <EarnAvatar
            id={data?.sponsor?.name}
            avatar={data?.sponsor?.logo}
            borderRadius="rounded-sm"
          />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Flex align="center" wrap={'wrap'}>
              <Text color="brand.slate.800" fontSize="sm">
                {data?.sponsor?.name}
              </Text>
            </Flex>
            <Flex align={'center'} gap={1}>
              <Text color="brand.slate.400" fontSize="xs">
                {data?.sponsor?.role}
              </Text>
              {data?.sponsor?.isVerified && <VerifiedBadge />}
            </Flex>
          </Box>
        </Flex>
      </components.Option>
    );
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option }}
      value={selectedSponsor}
      onChange={(e) => handleChange(e)}
      placeholder="Select Sponsor"
      loadOptions={loadSponsors}
      defaultOptions
      isClearable={false}
      isSearchable={true}
      autoFocus={false}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          cursor: 'pointer',
          fontSize: '14px',
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#6366F1',
          },
          minHeight: '46px',
          flexWrap: 'nowrap',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#cbd5e1',
          '&:hover': {
            color: '#94a3b8',
          },
          display: isExpanded ? 'block' : 'none',
        }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: 'transparent',
          width: 0,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? '#e2e8f0' : 'white',
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
        }),
      }}
    />
  );
}
