import { ArrowUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  HStack,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';
import { BiSolidComment } from 'react-icons/bi';
import { IoMdHeart } from 'react-icons/io';
import type { Metadata } from 'unfurl.js/dist/types';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { type User } from '@/interface/user';
import { userStore } from '@/store/user';
import { Badge } from '@/svg/badge';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { type Rewards } from '../../types';

interface Props {
  winner: boolean;
  winnerPosition?: keyof Rewards;
  talent: User;
  likes?: {
    id: string;
    date: number;
  }[];
  id: string;
  setUpdate: Dispatch<SetStateAction<boolean>>;
  link: string;
}
export const SubmissionCard = ({
  winnerPosition,
  id,
  winner,
  talent,
  likes,
  setUpdate,
  link,
}: Props) => {
  const { userInfo } = userStore();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string>('/assets/bg/og.svg');
  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLoading(true);

    const likePromise = axios
      .post('/api/submission/like/', { submissionId: id })
      .then()
      .finally(() => {
        setIsLoading(false);
        setUpdate((prev: boolean) => !prev);
      });

    toast.promise(likePromise, {
      loading: {
        title: 'Liking the submission...',
        description: 'Please wait',
        variant: 'subtle',
      },
      success: () => {
        const likeAdded = likes?.some((e) => e.id === userInfo?.id)
          ? 'Like removed'
          : 'Liked submission';
        const likeAddedDesc = likes?.some((e) => e.id === userInfo?.id)
          ? "You've removed your like from the submission."
          : "You've liked the submission.";
        return {
          title: likeAdded,
          description: likeAddedDesc,
          status: 'success',
          duration: 2000,
          isClosable: true,
          variant: 'subtle',
        };
      },
      error: {
        title: 'Error while liking submission',
        description: 'Failed to like the submission. Please try again.',
        duration: 2000,
        isClosable: true,
        variant: 'subtle',
      },
    });
  };
  useEffect(() => {
    const fetchImage = async () => {
      if (link) {
        try {
          const { data } = (await axios.post('/api/og', {
            url: link,
          })) as { data: Metadata };
          setImage(data.open_graph.images![0]?.url ?? '/assets/bg/og.svg');
        } catch (error) {
          console.log(error);
          setImage('/assets/bg/og.svg');
        }
      }
    };
    fetchImage();
  }, []);

  return (
    <LinkBox
      pos={'relative'}
      overflow={'hidden'}
      w={{ base: 'full', md: 72 }}
      p={4}
      bg={'white'}
      cursor={'pointer'}
      rounded={'md'}
    >
      {winner && (
        <Box pos="absolute" top="0" right="0">
          <Badge position={winnerPosition} />
        </Box>
      )}
      <Link as={NextLink} href={`/t/${talent?.username}`}>
        <HStack mb={2}>
          <EarnAvatar id={talent?.id} avatar={talent?.photo || undefined} />
          <Text
            overflow={'hidden'}
            w="80%"
            color={'gray.900'}
            fontSize={'lg'}
            fontWeight={500}
            whiteSpace={'nowrap'}
            textOverflow={'ellipsis'}
          >
            {talent?.firstName} {talent?.lastName}
          </Text>
        </HStack>
      </Link>
      <LinkOverlay href={`${router.asPath}/${id}`}>
        <Image
          w={'full'}
          h={48}
          objectFit={'cover'}
          alt={'card'}
          rounded={'sm'}
          src={image}
        />
      </LinkOverlay>
      <HStack align={'center'} gap={4} w={'full'}>
        <Button
          zIndex={10}
          alignItems={'center'}
          gap={2}
          display={'flex'}
          color="gray.500"
          fontWeight={500}
          isLoading={isLoading}
          onClick={handleLike}
          type="button"
          variant={'unstyled'}
        >
          <IoMdHeart
            size={'1.3rem'}
            color={
              !likes?.find((e) => e.id === (userInfo?.id as string))
                ? '#64748b'
                : '#E11D48'
            }
          />
          {likes?.length}
        </Button>
        <LinkOverlay href={`${router.asPath}/${id}`}>
          <BiSolidComment
            size={'1.23rem'}
            color={'#CBD5E1'}
            style={{
              transform: 'scaleX(-1)',
              marginTop: '2px',
              cursor: 'pointer',
            }}
          />
        </LinkOverlay>
      </HStack>

      <Link as={NextLink} href={getURLSanitized(link)} isExternal>
        <Button
          w="full"
          mt={1}
          py={5}
          color={'gray.400'}
          fontWeight={500}
          borderColor={'gray.300'}
          onClick={(e) => {
            e.stopPropagation();
            router.push(link);
          }}
          rightIcon={
            <ArrowUpIcon
              h={5}
              w={5}
              color="gray.400"
              ml={16}
              transform="rotate(45deg)"
            />
          }
          variant="outline"
        >
          <Text ml={24} fontSize={'17px'}>
            View
          </Text>
        </Button>
      </Link>
    </LinkBox>
  );
};
