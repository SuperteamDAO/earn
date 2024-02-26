import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import debounce from 'lodash.debounce';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
} from 'react';

import type { SubmissionWithUser } from '@/interface/submission';

interface Props {
  submissions: SubmissionWithUser[];
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedSubmission: SubmissionWithUser | undefined;
  setSelectedSubmission: Dispatch<
    SetStateAction<SubmissionWithUser | undefined>
  >;
  type?: string;
}

export const SubmissionList = ({
  submissions,
  setSearchText,
  selectedSubmission,
  setSelectedSubmission,
  type,
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
        {submissions.map((submission) => {
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
                {submission?.user?.photo ? (
                  <Image
                    boxSize="32px"
                    borderRadius="full"
                    alt={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                    src={submission?.user?.photo}
                  />
                ) : (
                  <Avatar
                    name={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                    colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                    size={32}
                    variant="marble"
                  />
                )}
                <Box w={36} ml={2}>
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
              {submission?.isWinner && submission?.winnerPosition && (
                <Tag w={24} py={1} bg="green.100">
                  <TagLabel
                    w="full"
                    color="green.600"
                    textAlign={'center'}
                    textTransform={'capitalize'}
                  >
                    🏆{' '}
                    {type === 'project' ? 'Winner' : submission?.winnerPosition}
                  </TagLabel>
                </Tag>
              )}
            </Flex>
          );
        })}
      </Box>
    </>
  );
};
