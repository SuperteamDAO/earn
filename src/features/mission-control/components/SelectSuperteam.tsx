import { Box, Flex, Text } from '@chakra-ui/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import { EarnAvatar } from '@/components/shared/EarnAvatar';

import { type SuperteamOption } from '../utils';

export function SelectSuperteam({
  selected,
  list,
}: {
  selected: SuperteamOption;
  list: SuperteamOption[];
}) {
  const [selectedSuperteam, setSelectedSuperteam] =
    useState<SuperteamOption | null>(selected);

  useEffect(() => {
    console.log('selectedSuperteam', selectedSuperteam);
  }, []);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const setSuperteam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('region', value);
      router.push(pathname + '?' + params.toString(), undefined, {
        scroll: false,
      });
    },
    [searchParams],
  );

  const handleChange = async (option?: any) => {
    setSuperteam(option.value);
    setSelectedSuperteam(option);
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
            id={data?.superteam?.name}
            avatar={data?.superteam?.logo}
            borderRadius="4"
          />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text color="brand.slate.800" fontSize="sm">
              {data?.superteam?.name}
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
            id={data?.superteam?.name}
            avatar={data?.superteam?.logo}
            borderRadius="4"
          />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text color="brand.slate.800" fontSize="sm">
              {data?.superteam?.name}
            </Text>
            <Text color="brand.slate.400" fontSize="xs">
              {data?.superteam?.role}
            </Text>
          </Box>
        </Flex>
      </components.Option>
    );
  };

  return (
    <AsyncSelect
      components={{ SingleValue, Option }}
      value={selectedSuperteam}
      onChange={(e) => handleChange(e)}
      placeholder="Select Superteam"
      options={list}
      defaultOptions={list}
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
