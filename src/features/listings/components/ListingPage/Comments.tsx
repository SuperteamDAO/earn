import {
  Button,
  Collapse,
  Flex,
  HStack,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { LoginWrapper } from '@/components/LoginWrapper';
import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';
import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import { UserAvatar } from '@/components/shared/UserAvatar';
import type { Comment } from '@/interface/comments';
import { userStore } from '@/store/user';

import { WarningModal } from '../WarningModal';
import { Comment as CommentUI } from './Comment';

interface Props {
  refId: string;
  refType: 'BOUNTY' | 'SUBMISSION';
  sponsorId: string | undefined;
}
export const Comments = ({ refId, refType, sponsorId }: Props) => {
  const { userInfo } = userStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);
  const [newCommentError, setNewCommentError] = useState(false);
  const [count, setCount] = useState(0);

  const deleteComment = async (commentId: string) => {
    const commentIndex = comments.findIndex(
      (comment) => comment.id === commentId,
    );
    if (commentIndex > -1) {
      await axios.delete(`/api/comment/${commentId}/delete`);
      setComments((prevComments) => {
        const newComments = [...prevComments];
        newComments.splice(commentIndex, 1);
        return newComments;
      });
    } else {
      throw new Error('Comment not found');
    }
  };

  const addNewComment = async () => {
    setNewCommentLoading(true);
    setNewCommentError(false);
    try {
      const newCommentData = await axios.post(`/api/comment/create`, {
        message: newComment,
        listingType: refType,
        listingId: refId,
      });
      console.log('new comment - ', newCommentData.data);
      setCount((count) => count + 1);
      setComments((prevComments) => [newCommentData.data, ...prevComments]);
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
      const allComments = commentsData.data.result as Comment[];
      console.log('all comments - ', allComments);

      setCount(commentsData.data.count);
      setComments([...comments, ...allComments]);
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
      <VStack align={'start'} gap={4} w={'full'} bg={'#FFFFFF'} rounded={'xl'}>
        <LoginWrapper
          triggerLogin={triggerLogin}
          setTriggerLogin={setTriggerLogin}
        />
        <HStack w={'full'} px={6} pt={4}>
          <Image
            width={21}
            height={18}
            alt="Comments Icon"
            src="/assets/icons/comments.svg"
          />
          <HStack>
            <Text color="brand.slate.900" fontSize={'1.1rem'} fontWeight={600}>
              {count}
            </Text>
            <Text color="brand.slate.900" fontSize={'1.1rem'} fontWeight={400}>
              {comments?.length === 1 ? 'Comment' : 'Comments'}
            </Text>
          </HStack>
        </HStack>
        <VStack gap={4} w={'full'} mb={4} px={6}>
          <HStack align="start" gap={3} w="full">
            <UserAvatar user={userInfo} size="36px" />
            <AutoResizeTextarea
              pt={0}
              fontSize="sm"
              borderColor="brand.slate.200"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              focusBorderColor="brand.purple"
              onChange={(e) => {
                setNewComment(e.target.value);
              }}
              placeholder="Write a comment"
              value={newComment}
              variant="flushed"
            />
          </HStack>
          {!!newCommentError && (
            <Text mt={4} color="red">
              Error in adding your comment! Please try again!
            </Text>
          )}
          <Collapse animateOpacity in={!!newComment} style={{ width: '100%' }}>
            <Flex justify={'end'} gap={4} w="full">
              <Button
                h="auto"
                px={5}
                py={2}
                fontSize="xx-small"
                fontWeight={500}
                isDisabled={!!newCommentLoading || !newComment}
                onClick={() => setNewComment('')}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                h="auto"
                px={5}
                py={2}
                fontSize="xx-small"
                fontWeight={500}
                isDisabled={!!newCommentLoading || !newComment}
                isLoading={!!newCommentLoading}
                loadingText="Adding..."
                onClick={() => handleSubmit()}
                variant="solid"
              >
                Comment
              </Button>
            </Flex>
          </Collapse>
        </VStack>
        <VStack gap={4} w={'full'} pb={8}>
          {comments?.map((comment) => {
            return (
              <CommentUI
                key={comment.id}
                comment={comment}
                sponsorId={sponsorId}
                refType={refType}
                refId={refId}
                deleteComment={deleteComment}
              />
            );
          })}
        </VStack>
        {!!comments.length && comments.length !== count && (
          <Flex
            justify="center"
            w="full"
            py={3}
            rounded="md"
            style={{
              boxShadow: '0px -1px 7px 0px rgba(193, 193, 193, 0.25)',
            }}
          >
            <Button
              fontWeight={400}
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
