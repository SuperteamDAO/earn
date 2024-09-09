import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Checkbox,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import { type GrantApplicationStatus } from '@prisma/client';
import debounce from 'lodash.debounce';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
} from 'react';

import { EarnAvatar } from '@/features/talent';

import { type GrantApplicationWithUser } from '../../types';
import { colorMap } from '../../utils';

interface Props {
  applications: GrantApplicationWithUser[] | undefined;
  setSearchText: (value: string) => void;
  selectedApplication: GrantApplicationWithUser | undefined;
  setSelectedApplication: Dispatch<
    SetStateAction<GrantApplicationWithUser | undefined>
  >;
  toggleApplication: (id: string) => void;
  isToggled: (id: string) => boolean;
  toggleAllApplications: () => void;
  isAllToggled: boolean;
}

export const ApplicationList = ({
  applications,
  setSearchText,
  selectedApplication,
  setSelectedApplication,
  toggleApplication,
  isToggled,
  toggleAllApplications,
  isAllToggled,
}: Props) => {
  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  return (
    <>
      <Box
        w="70%"
        bg="white"
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        roundedLeft="xl"
      >
        <Flex
          align={'center'}
          justify={'space-between'}
          gap={4}
          px={4}
          py={3}
          borderBottom={'1px solid'}
          borderBottomColor="brand.slate.200"
          cursor="pointer"
        >
          <Checkbox
            mr={-2}
            _checked={{
              '& .chakra-checkbox__control': {
                background: 'brand.purple',
                borderColor: 'brand.purple',
              },
            }}
            isChecked={isAllToggled}
            onChange={() => toggleAllApplications()}
          />
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
              placeholder="Search Applications"
              type="text"
            />
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="brand.slate.400" />
            </InputLeftElement>
          </InputGroup>
        </Flex>
        {applications?.map((application) => {
          const { bg, color } =
            colorMap[application?.applicationStatus as GrantApplicationStatus];
          return (
            <Flex
              key={application?.id}
              align={'center'}
              justify={'space-between'}
              gap={4}
              px={4}
              py={2}
              bg={
                selectedApplication?.id === application?.id
                  ? '#F5F3FF80'
                  : 'transparent'
              }
              borderBottom={'1px solid'}
              borderBottomColor="brand.slate.200"
              _hover={{
                backgroundColor: 'brand.slate.100',
              }}
              cursor="pointer"
              onClick={() => {
                setSelectedApplication(application);
              }}
            >
              <Flex align="center">
                <Checkbox
                  mr={2}
                  _checked={{
                    '& .chakra-checkbox__control': {
                      background: 'brand.purple',
                      borderColor: 'brand.purple',
                    },
                  }}
                  disabled={application?.applicationStatus !== 'Pending'}
                  isChecked={isToggled(application.id)}
                  onChange={() => toggleApplication(application.id)}
                />
                <EarnAvatar
                  id={application?.user?.id}
                  avatar={application?.user?.photo || undefined}
                />
                <Box w={48} ml={2}>
                  <Text
                    overflow={'hidden'}
                    color="brand.slate.700"
                    fontSize="sm"
                    fontWeight={500}
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {application?.projectTitle}
                  </Text>
                  <Text
                    overflow={'hidden'}
                    color="brand.slate.500"
                    fontSize="xs"
                    fontWeight={500}
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {`${application?.user?.firstName} ${application?.user?.lastName}`}
                  </Text>
                </Box>
              </Flex>
              <Tag px={3} py={1} bg={bg} rounded="full">
                <TagLabel
                  w="full"
                  color={color}
                  fontSize={'11px'}
                  textAlign={'center'}
                  textTransform={'capitalize'}
                  whiteSpace={'nowrap'}
                >
                  {application?.applicationStatus}
                </TagLabel>
              </Tag>
            </Flex>
          );
        })}
      </Box>
    </>
  );
};
