import { Box, Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import type { SponsorType } from '@/interface/sponsor';
import { userStore } from '@/store/user';

import { hackathonSponsorAtom } from '../SelectSponsor';

interface HackathonOptionType extends SponsorType {
  role?: string;
}

interface HackathonOption {
  value?: string;
  label?: string;
  hackathon?: HackathonOptionType;
}

export function SelectHackathon({ type }: { type?: string }) {
  const { setUserInfo, userInfo } = userStore();
  const [selectedHackathon, setSelectedHackathon] =
    useState<HackathonOption | null>(null);
  const setHackathonSponsor = useSetAtom(hackathonSponsorAtom);

  useEffect(() => {
    if (type !== 'hackathon' && userInfo?.hackathonId) {
      setSelectedHackathon({
        value: userInfo?.Hackathon?.id,
        label: userInfo?.Hackathon?.name,
        hackathon: userInfo?.Hackathon,
      });
    }
  }, [userInfo]);

  const loadHackathons = (
    inputValue: string,
    callback: (options: HackathonOption[]) => void,
  ) => {
    axios
      .get(`/api/hackathon/list/`, {
        params: {
          searchString: inputValue,
        },
      })
      .then((response) => {
        const options = [...(response?.data || [])];
        callback(options);
      });
  };

  const updateUser = async (hackathonId: string) => {
    try {
      const userUpdatedDetails = await axios.post('/api/user/update/', {
        hackathonId,
      });
      return userUpdatedDetails.data;
    } catch (error) {
      return userInfo;
    }
  };

  const handleChange = async (option?: any) => {
    if (type === 'hackathon') {
      setHackathonSponsor(option.value);
      setSelectedHackathon(option);
    } else {
      const newUser = await updateUser(option.value);
      setUserInfo(newUser);
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
            borderRadius="4"
            id={data?.hackathon?.name}
            avatar={data?.hackathon?.logo}
          />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text color="brand.slate.800" fontSize="sm">
              {data?.hackathon?.name}
            </Text>
            <Text color="brand.slate.400" fontSize="xs">
              {data?.hackathon?.role}
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
            borderRadius="4"
            id={data?.hackathon?.name}
            avatar={data?.hackathon?.logo}
          />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text color="brand.slate.800" fontSize="sm">
              {data?.hackathon?.name}
            </Text>
            <Text color="brand.slate.400" fontSize="xs">
              {data?.hackathon?.role}
            </Text>
          </Box>
        </Flex>
      </components.Option>
    );
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option }}
      value={selectedHackathon}
      onChange={(e) => handleChange(e)}
      placeholder="Select Hackathon"
      loadOptions={loadHackathons}
      defaultOptions
      isClearable={false}
      isSearchable={true}
      autoFocus={false}
      styles={{
        control: (baseStyles) => ({
          ...baseStyles,
          cursor: 'pointer',
          fontSize: '14px',
          borderColor: '#94a3b8',
          '&:hover': {
            borderColor: '#6366F1',
          },
          minHeight: '46px',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#94a3b8',
          '&:hover': {
            color: '#94a3b8',
          },
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
