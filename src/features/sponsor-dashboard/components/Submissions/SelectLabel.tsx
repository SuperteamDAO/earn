import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAtom } from 'jotai';
import React from 'react';
import { MdArrowDropDown } from 'react-icons/md';

import { type SubmissionWithUser } from '@/interface/submission';

import { selectedSubmissionAtom } from '../..';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils';

interface Props {
  listingSlug: string;
}

export const SelectLabel = ({ listingSlug }: Props) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const selectLabel = async (
    label: SubmissionLabels,
    id: string | undefined,
  ) => {
    if (!id) return;
    updateLabel({ id, label });
  };

  let bg, color;

  if (selectedSubmission) {
    ({ bg, color } = colorMap[selectedSubmission?.label as SubmissionLabels]);
  }

  const { mutate: updateLabel } = useMutation({
    mutationFn: ({ id, label }: { id: string; label: SubmissionLabels }) =>
      axios.post(`/api/sponsor-dashboard/submission/update-label/`, {
        id,
        label,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', listingSlug],
        (old) =>
          old?.map((submission) =>
            submission.id === variables.id
              ? { ...submission, label: variables.label }
              : submission,
          ),
      );

      setSelectedSubmission((prev) =>
        prev && prev.id === variables.id
          ? { ...prev, label: variables.label }
          : prev,
      );
    },
    onError: (e) => {
      console.log(e);
    },
  });

  return (
    <Menu>
      <MenuButton
        as={Button}
        color="brand.slate.500"
        fontWeight={500}
        textTransform="capitalize"
        bg="transparent"
        borderWidth={'1px'}
        borderColor="brand.slate.300"
        _hover={{ backgroundColor: 'transparent' }}
        _active={{
          backgroundColor: 'transparent',
          borderWidth: '1px',
        }}
        _expanded={{ borderColor: 'brand.purple' }}
        rightIcon={<MdArrowDropDown />}
      >
        <Tag px={3} py={1} bg={bg} rounded="full">
          <TagLabel
            w="full"
            color={color}
            fontSize={'13px'}
            textAlign={'center'}
            textTransform={'capitalize'}
            whiteSpace={'nowrap'}
          >
            {selectedSubmission?.label || 'Select Option'}
          </TagLabel>
        </Tag>
      </MenuButton>
      <MenuList borderColor="brand.slate.300">
        {labelMenuOptions.map((option) => (
          <MenuItem
            key={option.value}
            _focus={{ bg: 'brand.slate.100' }}
            onClick={() =>
              selectLabel(
                option.value as SubmissionLabels,
                selectedSubmission?.id,
              )
            }
          >
            <Tag px={3} py={1} bg={option.bg} rounded="full">
              <TagLabel
                w="full"
                color={option.color}
                fontSize={'11px'}
                textAlign={'center'}
                textTransform={'capitalize'}
                whiteSpace={'nowrap'}
              >
                {option.label}
              </TagLabel>
            </Tag>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
