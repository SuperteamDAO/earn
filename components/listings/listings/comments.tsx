import {
  Button,
  Flex,
  HStack,
  Image,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  const { userInfo } = userStore();

  const { talentInfo } = TalentStore();

  const CommentsQuery = useQuery({
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
  const sortedComments = (CommentsQuery.data ?? []).sort(
    (a: { timeStamp: string }, b: { timeStamp: string }) => {
      return Number(b.timeStamp) - Number(a.timeStamp);
    }
  );
  return (
    <>
      <VStack
        align={'start'}
        gap={3}
        w={'full'}
        pb={5}
        bg={'#FFFFFF'}
        rounded={'xl'}
      >
        <HStack w={'full'} pt={4} px={6}>
          <GoCommentDiscussion fontWeight={600} fontSize={'1.5rem'} />
          <HStack>
            <Text color={'#64758B'} fontSize={'1.1rem'} fontWeight={600}>
              {CommentsQuery.data?.length ?? 0}
            </Text>
            <Text color={'#64758B'} fontSize={'1.1rem'} fontWeight={400}>
              Comments
            </Text>
          </HStack>
        </HStack>
        <VStack w={'full'} px={6}>
          <Textarea
            h={32}
            border={'1px solid #E2E8EF'}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            placeholder="Write a comment..."
            value={message}
          ></Textarea>

          <Flex justify={'end'} w="full">
            <Button
              color={'white'}
              fontSize={'1rem'}
              bg={'#6562FF'}
              onClick={() => {
                if (!userInfo || !userInfo.talent) {
                  onOpen();
                  return;
                }

                commentMutation.mutate({
                  id: genrateuuid(),
                  message,
                  refId,
                  talentId: talentInfo?.id ?? '',
                  timeStamp: JSON.stringify(Date.now()),
                });
                setMessage('');
              }}
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
                alt={'profile image'}
                rounded={'full'}
                src={el.talent.avatar}
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
