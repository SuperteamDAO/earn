import {
  Button,
  Flex,
  HStack,
  Image,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { GoCommentDiscussion } from 'react-icons/go';
import { TalentStore } from '../../../store/talent';
import { userStore } from '../../../store/user';
import { createComment, fetchComments } from '../../../utils/functions';
import { genrateuuid } from '../../../utils/helpers';

interface Props {
  onOpen: () => void;
  refId: string;
}
export const Comments = ({ onOpen, refId }: Props) => {
  const [message, setMessage] = useState<string>('');
  const queryClient = useQueryClient();
  const { connected } = useWallet();
  const { userInfo } = userStore();

  const { talentInfo } = TalentStore();

  const Comments = useQuery({
    queryFn: ({ queryKey }) => fetchComments(queryKey[1] as string),
    queryKey: ['comments', refId],
  });
  const commentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', refId]);
      toast.success('commented');
    },
    onError: () => {
      toast.success('Error occur while commenting');
    },
  });
  let sortedComments = (Comments.data ?? []).sort(
    (a: { timeStamp: string }, b: { timeStamp: string }) => {
      return Number(b.timeStamp) - Number(a.timeStamp);
    }
  );
  return (
    <>
      <VStack
        rounded={'xl'}
        gap={3}
        w={'full'}
        align={'start'}
        bg={'#FFFFFF'}
        pb={5}
      >
        <HStack px={6} pt={4} w={'full'}>
          <GoCommentDiscussion fontWeight={600} fontSize={'1.5rem'} />
          <HStack>
            <Text fontWeight={600} color={'#64758B'} fontSize={'1.1rem'}>
              {Comments.data?.length ?? 0}
            </Text>
            <Text fontWeight={400} color={'#64758B'} fontSize={'1.1rem'}>
              Comments
            </Text>
          </HStack>
        </HStack>
        <VStack px={6} w={'full'}>
          <Textarea
            h={32}
            border={'1px solid #E2E8EF'}
            placeholder="Write a comment..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          ></Textarea>

          <Flex w="full" justify={'end'}>
            <Button
              onClick={() => {
                if (!userInfo || !userInfo.talent) {
                  onOpen();
                  return;
                }
                commentMutation.mutate({
                  id: genrateuuid(),
                  message: message,
                  refId: refId,
                  talentId: talentInfo?.id ?? '',
                  timeStamp: JSON.stringify(Date.now()),
                });
                setMessage('');
              }}
              bg={'#6562FF'}
              color={'white'}
              fontSize={'1rem'}
            >
              Comment
            </Button>
          </Flex>
        </VStack>
        {sortedComments?.map((el: any) => {
          const date = new Date(Number(el.timeStamp));
          return (
            <HStack key={el.id} align={'start'} px={6}>
              <Image
                w={10}
                h={10}
                objectFit={'contain'}
                rounded={'full'}
                src={el.talent.avatar}
                alt={'profile image'}
              />

              <VStack align={'start'}>
                <HStack>
                  <Text color={'#1E293B'} fontWeight={600}>
                    {el.talent.username}
                  </Text>
                  <Text color={'#94A3B8'} fontWeight={500}>
                    {date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </HStack>
                <Text mt={'0px !important'}>{el.message}</Text>
              </VStack>
            </HStack>
          );
        })}
      </VStack>
    </>
  );
};
