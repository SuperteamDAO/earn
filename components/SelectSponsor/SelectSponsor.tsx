import { Box, Flex, Image, Text } from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import { useEffect, useState } from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import type { SponsorType } from '@/interface/sponsor';
import { userStore } from '@/store/user';

interface SponsorOptionType extends SponsorType {
  role?: string;
}

interface SponsorOption {
  value: string;
  label: string;
  sponsor: SponsorOptionType;
}

function SelectSponsor() {
  const { setUserInfo, userInfo } = userStore();
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorOption | null>(
    null
  );

  useEffect(() => {
    if (userInfo?.currentSponsor?.id) {
      setSelectedSponsor({
        value: userInfo?.currentSponsor?.id,
        label: userInfo?.currentSponsor?.name,
        sponsor: userInfo?.currentSponsor,
      });
    }
  }, [userInfo]);

  const loadSponsors = (
    inputValue: string,
    callback: (options: SponsorOption[]) => void
  ) => {
    axios
      .get(`/api/sponsors/list/`, {
        params: {
          userId: userInfo?.id,
          searchString: inputValue,
        },
      })
      .then((response) => {
        const currentSponsor =
          !inputValue && userInfo?.currentSponsor?.id
            ? [
                {
                  value: userInfo?.currentSponsor?.id,
                  label: userInfo?.currentSponsor?.name,
                  sponsor: userInfo?.currentSponsor,
                },
              ]
            : [];
        const options = [...currentSponsor, ...(response?.data || [])];
        callback(options);
      });
  };

  const updateUser = async (sponsorId: string) => {
    try {
      const userUpdatedDetails = await axios.post('/api/user/update', {
        id: userInfo?.id,
        currentSponsorId: sponsorId,
      });
      return userUpdatedDetails.data;
    } catch (error) {
      return userInfo;
    }
  };

  const handleChange = async (option?: any) => {
    const newUser = await updateUser(option.value);
    setUserInfo(newUser);
  };

  const SingleValue = (props: any) => {
    const { data } = props;
    return (
      <components.SingleValue {...props}>
        <Flex align="center" py={1}>
          {data?.sponsor?.logo ? (
            <Image
              boxSize="32px"
              borderRadius="full"
              alt={data?.sponsor?.name}
              src={data?.sponsor?.logo}
            />
          ) : (
            <Avatar
              name={data?.sponsor?.name}
              colors={['#92A1C6', '#F0AB3D', '#C271B4']}
              size={32}
              variant="marble"
            />
          )}
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text color="brand.slate.800" fontSize="sm">
              {data?.sponsor?.name}
            </Text>
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
          {data?.sponsor?.logo ? (
            <Image
              boxSize="32px"
              borderRadius="full"
              alt={data?.sponsor?.name}
              src={data?.sponsor?.logo}
            />
          ) : (
            <Avatar
              name={data?.sponsor?.name}
              colors={['#92A1C6', '#F0AB3D', '#C271B4']}
              size={32}
              variant="marble"
            />
          )}
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text color="brand.slate.800" fontSize="sm">
              {data?.sponsor?.name}
            </Text>
            <Text color="brand.slate.400" fontSize="xs">
              {data?.sponsor?.role}
            </Text>
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

export default SelectSponsor;
