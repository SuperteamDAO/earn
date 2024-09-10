import { ChevronDownIcon, DownloadIcon, SearchIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { toast } from 'sonner';

import { skillSubSkillMap } from '@/interface/skills';

interface FilterSectionProps {
  checkedItems: Record<string, boolean>;
  setCheckedItems: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  debouncedSetSearchText: (value: string) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const FilterSection = ({
  checkedItems,
  setCheckedItems,
  debouncedSetSearchText,
  setCurrentPage,
}: FilterSectionProps) => {
  const mainSkills = Object.keys(skillSubSkillMap);
  const selectedSkillsCount =
    Object.values(checkedItems).filter(Boolean).length;

  const handleCheckboxChange = (skill: string) => {
    setCheckedItems((prev) => ({ ...prev, [skill]: !prev[skill] }));
    setCurrentPage(1);
  };

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(
        `/api/sponsor-dashboard/local-profiles/export/`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      if (url) {
        window.open(url, '_blank');
        toast.success('CSV exported successfully');
      } else {
        toast.error('Export URL is empty');
      }
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const exportUserCsv = () => {
    exportMutation.mutate();
  };

  return (
    <Flex align="center" gap={3}>
      <Menu closeOnSelect={false}>
        <MenuButton
          as={Button}
          w={'10rem'}
          color={'brand.slate.400'}
          fontWeight={500}
          borderColor={'brand.slate.300'}
          _hover={{ color: 'brand.slate.50' }}
          rightIcon={<ChevronDownIcon />}
          size={'sm'}
          variant={'outline'}
        >
          Filter By Skills
          {selectedSkillsCount > 0 ? ` (${selectedSkillsCount})` : ''}
        </MenuButton>
        <MenuList>
          {mainSkills.map((skill) => (
            <MenuItem
              key={skill}
              color={'brand.slate.500'}
              onClick={() => handleCheckboxChange(skill)}
            >
              <Flex align="center">
                <Checkbox
                  mr={3}
                  _checked={{
                    '& .chakra-checkbox__control': {
                      background: 'brand.purple',
                      borderColor: 'brand.purple',
                    },
                  }}
                  isChecked={checkedItems[skill] || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.stopPropagation();
                    handleCheckboxChange(skill);
                  }}
                />
                {skill}
              </Flex>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      <InputGroup w={64} size={'sm'}>
        <Input
          bg={'white'}
          borderColor="brand.slate.300"
          borderRadius={'md'}
          _placeholder={{
            color: 'brand.slate.400',
            fontWeight: 500,
            fontSize: 'md',
          }}
          focusBorderColor="brand.slate.300"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            debouncedSetSearchText(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search users..."
          type="text"
        />
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="brand.slate.400" />
        </InputLeftElement>
      </InputGroup>
      <Button
        px={4}
        color={'brand.slate.400'}
        fontWeight={500}
        borderWidth={'1px'}
        borderColor={'brand.slate.300'}
        isLoading={exportMutation.isPending}
        leftIcon={<DownloadIcon />}
        loadingText={'Exporting...'}
        onClick={() => exportUserCsv()}
        size={'sm'}
        variant={'ghost'}
      >
        Export CSV
      </Button>
    </Flex>
  );
};
