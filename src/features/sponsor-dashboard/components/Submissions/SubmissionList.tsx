import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
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
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
} from 'react';
import { MdArrowDropDown } from 'react-icons/md';

import { type Listing } from '@/features/listings';
import { EarnAvatar } from '@/features/talent';
import type { SubmissionWithUser } from '@/interface/submission';
import { getRankLabels } from '@/utils/rank';

import { selectedSubmissionAtom } from '../..';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils';

interface Props {
  listing?: Listing;
  submissions: SubmissionWithUser[];
  setSearchText: Dispatch<SetStateAction<string>>;
  type?: string;
  filterLabel: SubmissionLabels | 'Winner' | 'Rejected' | undefined;
  setFilterLabel: Dispatch<
    SetStateAction<SubmissionLabels | 'Winner' | 'Rejected' | undefined>
  >;
  toggleSubmission?: (id: string) => void;
  isToggled?: (id: string) => boolean;
  toggleAllSubmissions?: () => void;
  isAllToggled?: boolean;
}

export const SubmissionList = ({
  listing,
  submissions,
  setSearchText,
  type,
  filterLabel,
  setFilterLabel,
  toggleSubmission,
  isToggled,
  toggleAllSubmissions,
  isAllToggled,
}: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  let bg, color;

  if (filterLabel) {
    ({ bg, color } = colorMap[filterLabel]);
  }

  const getSubmissionLabel = (submission: SubmissionWithUser) => {
    if (submission?.isWinner && submission?.winnerPosition) {
      if (type === 'project') {
        return 'Winner';
      } else {
        return getRankLabels(submission.winnerPosition);
      }
    } else if (submission.status === 'Rejected') {
      return 'Rejected';
    } else if (submission?.label) {
      return submission.label;
    } else {
      return '';
    }
  };

  const getSubmissionColors = (submission: SubmissionWithUser) => {
    if (submission?.isWinner) {
      return colorMap.winner;
    } else if (submission.status === 'Rejected') {
      return colorMap.Rejected;
    } else if (submission?.label && colorMap[submission.label]) {
      return colorMap[submission.label];
    } else {
      return {
        bg: 'gray.100',
        color: 'gray.600',
      };
    }
  };

  return (
    <>
      <Box
        w="100%"
        h="full"
        bg="white"
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        roundedLeft="xl"
      >
        <Flex
          align={'center'}
          justify={'space-between'}
          direction={'column'}
          gap={4}
          px={4}
          py={3}
          borderBottom={'1px solid'}
          borderBottomColor="brand.slate.200"
          cursor="pointer"
        >
          <Flex
            align={'center'}
            justify={'space-between'}
            gap={4}
            w="full"
            py={3}
          >
            {listing?.type === 'project' && (
              <Checkbox
                _checked={{
                  '& .chakra-checkbox__control': {
                    background: 'brand.purple',
                    borderColor: 'brand.purple',
                  },
                }}
                isChecked={isAllToggled}
                isDisabled={listing?.isWinnersAnnounced}
                onChange={() => toggleAllSubmissions && toggleAllSubmissions()}
              />
            )}
            <InputGroup w={'full'} size="lg">
              <Input
                bg={'white'}
                borderColor="brand.slate.200"
                _placeholder={{
                  color: 'brand.slate.400',
                  fontWeight: 500,
                  fontSize: 'md',
                }}
                focusBorderColor="brand.purple"
                onChange={(e) => debouncedSetSearchText(e.target.value)}
                placeholder="Search Submissions"
                type="text"
              />
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="brand.slate.400" />
              </InputLeftElement>
            </InputGroup>
          </Flex>
          <Flex
            align="center"
            justify={'space-between'}
            w="full"
            cursor="default"
          >
            <Text color="brand.slate.500" fontSize="xs">
              Filter By
            </Text>
            <Menu>
              <MenuButton
                as={Button}
                h="auto"
                px={2}
                py={1}
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
                <Tag minH="none" px={3} py={1} bg={bg} rounded="full">
                  <TagLabel
                    w="full"
                    color={color}
                    fontSize={'10px'}
                    textAlign={'center'}
                    textTransform={'capitalize'}
                    whiteSpace={'nowrap'}
                  >
                    {filterLabel || 'Select Option'}
                  </TagLabel>
                </Tag>
              </MenuButton>
              <MenuList minW="130px" borderColor="brand.slate.300">
                <MenuItem
                  _focus={{ bg: 'brand.slate.100' }}
                  onClick={() => setFilterLabel(undefined)}
                >
                  <Tag minH="none" px={3} py={1} rounded="full">
                    <TagLabel
                      w="full"
                      fontSize={'10px'}
                      textAlign={'center'}
                      textTransform={'capitalize'}
                      whiteSpace={'nowrap'}
                    >
                      Select Option
                    </TagLabel>
                  </Tag>
                </MenuItem>
                <MenuItem
                  _focus={{ bg: 'brand.slate.100' }}
                  onClick={() => setFilterLabel('Winner')}
                >
                  <Tag
                    minH="none"
                    px={3}
                    py={1}
                    bg={colorMap['Winner'].bg}
                    rounded="full"
                  >
                    <TagLabel
                      w="full"
                      color={colorMap['Winner'].color}
                      fontSize={'10px'}
                      textAlign={'center'}
                      textTransform={'capitalize'}
                      whiteSpace={'nowrap'}
                    >
                      Winner
                    </TagLabel>
                  </Tag>
                </MenuItem>
                {listing?.type === 'project' && (
                  <MenuItem
                    _focus={{ bg: 'brand.slate.100' }}
                    onClick={() => setFilterLabel('Rejected')}
                  >
                    <Tag
                      minH="none"
                      px={3}
                      py={1}
                      bg={colorMap['Rejected'].bg}
                      rounded="full"
                    >
                      <TagLabel
                        w="full"
                        color={colorMap['Rejected'].color}
                        fontSize={'10px'}
                        textAlign={'center'}
                        textTransform={'capitalize'}
                        whiteSpace={'nowrap'}
                      >
                        Rejected
                      </TagLabel>
                    </Tag>
                  </MenuItem>
                )}
                {labelMenuOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    _focus={{ bg: 'brand.slate.100' }}
                    onClick={() =>
                      setFilterLabel(option.value as SubmissionLabels)
                    }
                  >
                    <Tag
                      minH="none"
                      px={3}
                      py={1}
                      bg={option.bg}
                      rounded="full"
                    >
                      <TagLabel
                        w="full"
                        color={option.color}
                        fontSize={'10px'}
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
          </Flex>
        </Flex>
        {submissions.map((submission) => {
          const { bg, color } = getSubmissionColors(submission);
          return (
            <Flex
              key={submission?.id}
              align={'center'}
              justify={'space-between'}
              gap={4}
              px={4}
              py={2}
              bg={
                selectedSubmission?.user?.id === submission?.user?.id
                  ? 'brand.slate.100'
                  : 'transparent'
              }
              borderBottom={'1px solid'}
              borderBottomColor="brand.slate.200"
              _hover={{
                backgroundColor: 'brand.slate.100',
              }}
              cursor="pointer"
              onClick={() => {
                setSelectedSubmission(submission);
              }}
            >
              <Flex align="center">
                {listing?.type === 'project' && (
                  <Checkbox
                    mr={2}
                    _checked={{
                      '& .chakra-checkbox__control': {
                        background: 'brand.purple',
                        borderColor: 'brand.purple',
                      },
                    }}
                    isChecked={isToggled && isToggled(submission.id)}
                    isDisabled={
                      listing?.isWinnersAnnounced ||
                      submission?.status !== 'Pending'
                    }
                    onChange={() =>
                      toggleSubmission && toggleSubmission(submission.id)
                    }
                  />
                )}
                <EarnAvatar
                  id={submission?.user?.id}
                  avatar={submission?.user?.photo || undefined}
                />
                <Box w={40} ml={2}>
                  <Text
                    overflow={'hidden'}
                    color="brand.slate.700"
                    fontSize="sm"
                    fontWeight={500}
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                  </Text>
                  <Text
                    overflow={'hidden'}
                    color="brand.slate.500"
                    fontSize="xs"
                    fontWeight={500}
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {submission?.user?.email}
                  </Text>
                </Box>
              </Flex>
              <Tag minH="none" px={3} py={1} bg={bg} rounded="full">
                <TagLabel
                  w="full"
                  color={color}
                  fontSize={'10px'}
                  textAlign={'center'}
                  textTransform={'capitalize'}
                  whiteSpace={'nowrap'}
                >
                  {getSubmissionLabel(submission)}
                </TagLabel>
              </Tag>
            </Flex>
          );
        })}
      </Box>
    </>
  );
};
