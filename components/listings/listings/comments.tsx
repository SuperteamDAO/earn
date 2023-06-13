import {
  Button,
  Flex,
  HStack,
  Text,
  Textarea,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GoCommentDiscussion } from 'react-icons/go';

import LoginWrapper from '@/components/Header/LoginWrapper';
import ErrorInfo from '@/components/shared/ErrorInfo';
import Loading from '@/components/shared/Loading';
import UserAvatar from '@/components/shared/UserAvatar';
import WarningModal from '@/components/shared/WarningModal';
import type { Comment } from '@/interface/comments';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

interface Props {
  refId: string;
  refType: 'BOUNTY' | 'JOB';
}
export const Comments = ({ refId, refType }: Props) => {
  const { userInfo } = userStore();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);
  const [newCommentError, setNewCommentError] = useState(false);
  const addNewComment = async () => {
    setNewCommentLoading(true);
    setNewCommentError(false);
    try {
      const newCommentData = await axios.post(`/api/comment/create`, {
        authorId: userInfo?.id,
        message: newComment,
        listingType: refType,
        listingId: refId,
      });
      if (refType === 'BOUNTY') {
        if (router.asPath.includes('submission')) {
          await axios.post(`/api/email/manual/commentSubmission`, {
            userId: userInfo?.id,
            submissionId: router.query.subid,
          });
        } else {
          await axios.post(`/api/email/manual/comment`, {
            id: refId,
            userId: userInfo?.id,
          });
        }
      }
      setComments([newCommentData.data, ...comments]);
      setNewComment('');
      setNewCommentLoading(false);
    } catch (e) {
      setNewCommentError(true);
      setNewCommentLoading(false);
    }
  };

  const getComments = async (skip = 0) => {
    setIsLoading(true);
    try {
      const commentsData = await axios.get(`/api/comment/${refId}`, {
        params: {
          skip,
        },
      });
      setComments([...comments, ...commentsData.data]);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getComments();
  }, []);

  const handleSubmit = () => {
    if (!userInfo?.id) {
      setTriggerLogin(true);
    } else if (!userInfo?.isTalentFilled) {
      onOpen();
    } else {
      addNewComment();
    }
  };

  if (isLoading && !comments?.length) return <Loading />;

  if (error) return <ErrorInfo />;

  return (
    <>
      {isOpen && (
        <WarningModal
          isOpen={isOpen}
          onClose={onClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before commenting on the bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
      <VStack
        align={'start'}
        gap={3}
        w={'full'}
        pb={5}
        bg={'#FFFFFF'}
        rounded={'xl'}
      >
        <LoginWrapper
          triggerLogin={triggerLogin}
          setTriggerLogin={setTriggerLogin}
        />
        <HStack w={'full'} pt={4} px={6}>
          <GoCommentDiscussion fontWeight={600} fontSize={'1.5rem'} />
          <HStack>
            <Text color={'#64758B'} fontSize={'1.1rem'} fontWeight={600}>
              {comments?.length ?? 0}
            </Text>
            <Text color={'#64758B'} fontSize={'1.1rem'} fontWeight={400}>
              {comments?.length === 1 ? 'Comment' : 'Comments'}
            </Text>
          </HStack>
        </HStack>
        <VStack w={'full'} px={6}>
          <Textarea
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => {
              setNewComment(e.target.value);
            }}
            placeholder="Write a comment..."
            value={newComment}
          ></Textarea>
          {!!newCommentError && (
            <Text mt={4} color="red">
              Error in adding your comment! Please try again!
            </Text>
          )}
          <Flex justify={'end'} w="full">
            <Button
              isDisabled={!!newCommentLoading || !newComment}
              isLoading={!!newCommentLoading}
              loadingText="Adding..."
              onClick={() => handleSubmit()}
              variant="solid"
            >
              Comment
            </Button>
          </Flex>
        </VStack>
        {comments?.map((comment: any) => {
          const date = dayjs(comment?.updatedAt).fromNow();
          return (
            <HStack key={comment.id} align={'start'} px={6}>
              <UserAvatar user={comment?.author} />

              <VStack align={'start'}>
                <HStack>
                  <Text color="brand.slate.800" fontSize="sm" fontWeight={600}>
                    {`${comment?.author?.firstName} ${comment?.author?.lastName}`}
                  </Text>
                  <Text color="brand.slate.500" fontSize="sm">
                    {date}
                  </Text>
                </HStack>
                <Text mt={'0px !important'} color="brand.slate.800">
                  {comment?.message}
                </Text>
              </VStack>
            </HStack>
          );
        })}
        {!!comments.length && comments.length % 30 === 0 && (
          <Flex justify="center" w="full">
            <Button
              isDisabled={!!isLoading}
              isLoading={!!isLoading}
              loadingText="Fetching Comments..."
              onClick={() => getComments(comments.length)}
              rounded="md"
              size="sm"
              variant="ghost"
            >
              Show More Comments
            </Button>
          </Flex>
        )}
      </VStack>
    </>
  );
};
