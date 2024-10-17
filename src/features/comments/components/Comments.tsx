import {
  Box,
  Button,
  Collapse,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import { AuthWrapper } from '@/features/auth';
import { EarnAvatar } from '@/features/talent/';
import type { Comment } from '@/interface/comments';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';

import { Comment as CommentUI } from './Comment';
import { UserSuggestionTextarea } from './UserSuggestionTextarea';

interface Props {
  refId: string;
  refType: 'BOUNTY' | 'SUBMISSION';
  sponsorId: string | undefined;
  poc: User | undefined;
  listingType: string;
  listingSlug: string;
  isAnnounced: boolean;
  isVerified?: boolean;
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  isTemplate?: boolean;
}
export const Comments = ({
  refId,
  refType,
  sponsorId,
  poc,
  listingType,
  listingSlug,
  isAnnounced,
  isVerified = false,
  isTemplate = false,
  count,
  setCount,
}: Props) => {
  const { user } = useUser();
  const posthog = usePostHog();
  const { t } = useTranslation('common');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);
  const [newCommentError, setNewCommentError] = useState(false);
  const [defaultSuggestions, setDefaultSuggestions] = useState<
    Map<string, User>
  >(new Map());

  const deleteComment = async (commentId: string) => {
    posthog.capture('delete_comment');
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
    posthog.capture('publish_comment');
    setNewCommentLoading(true);
    setNewCommentError(false);
    try {
      const newCommentData = await axios.post(`/api/comment/create`, {
        message: newComment,
        listingType: refType,
        listingId: refId,
        pocId: poc?.id,
      });
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

      setCount(commentsData.data.count);
      setComments([...comments, ...allComments]);
      if (poc && poc.id) defaultSuggestions.set(poc.id, poc);
      allComments.forEach((comment) => {
        setDefaultSuggestions((suggestions) =>
          suggestions.set(comment.authorId, comment.author),
        );
      });
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  const handleSubmit = () => {
    addNewComment();
  };

  useEffect(() => {
    if (!isLoading) return;
    getComments();

    window.addEventListener('update-comments', () => {
      getComments();
    });
  }, []);

  useEffect(() => {
    const comment = localStorage.getItem(`comment-${refId}`);
    if (comment) {
      setNewComment(comment);
      localStorage.removeItem(`comment-${refId}`);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`comment-${refId}`, newComment);
  }, [newComment]);

  if (isLoading && !comments?.length) return <Loading />;

  if (error) return <ErrorInfo />;

  return (
    <VStack
      align={'start'}
      gap={4}
      w={'full'}
      bg={'#FFFFFF'}
      id="comments"
      rounded={'xl'}
    >
      <HStack w={'full'} pt={4}>
        <Image
          width={21}
          height={18}
          alt={t('comments.commentsIcon')}
          src="/assets/icons/comments.svg"
        />
        <HStack>
          <Text color="brand.slate.900" fontSize={'1.1rem'} fontWeight={600}>
            {count}
          </Text>
          <Text color="brand.slate.900" fontSize={'1.1rem'} fontWeight={400}>
            {count === 1 ? t('comments.comment') : t('comments.comments')}
          </Text>
        </HStack>
      </HStack>
      <VStack gap={4} w={'full'} mb={4}>
        <Flex gap={3} w="full">
          <EarnAvatar size={'36px'} id={user?.id} avatar={user?.photo} />
          <Box pos={'relative'} w="full" mt={0.5}>
            <UserSuggestionTextarea
              defaultSuggestions={defaultSuggestions}
              pt={0}
              fontSize={{
                base: 'sm',
                md: 'md',
              }}
              borderColor="brand.slate.200"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              focusBorderColor="brand.purple"
              placeholder={t('comments.writeComment')}
              value={newComment}
              setValue={setNewComment}
              variant="flushed"
            />
          </Box>
        </Flex>
        {!!newCommentError && (
          <Text mt={4} color="red">
            {t('comments.errorAddingComment')}
          </Text>
        )}
        <Collapse
          in={!!newComment}
          style={{ width: '100%' }}
          unmountOnExit={true}
        >
          <Flex justify={'end'} gap={4} w="full">
            <Button
              h="auto"
              px={5}
              py={2}
              fontSize={{
                base: 'xx-small',
                md: 'sm',
              }}
              fontWeight={500}
              isDisabled={!!newCommentLoading || !newComment}
              onClick={() => setNewComment('')}
              variant="ghost"
            >
              {t('comments.cancel')}
            </Button>
            <AuthWrapper
              showCompleteProfileModal
              completeProfileModalBodyText={t(
                'comments.completeProfileBeforeCommenting',
              )}
            >
              <Button
                h="auto"
                px={5}
                py={2}
                fontSize={{
                  base: 'xx-small',
                  md: 'sm',
                }}
                fontWeight={500}
                isDisabled={!!newCommentLoading || !newComment || isTemplate}
                isLoading={!!newCommentLoading}
                loadingText={t('comments.adding')}
                onClick={() => handleSubmit()}
                variant="solid"
              >
                {t('comments.comment')}
              </Button>
            </AuthWrapper>
          </Flex>
        </Collapse>
      </VStack>
      <VStack align="start" gap={5} w={'full'} pb={8}>
        {comments?.map((comment) => {
          return (
            <CommentUI
              isAnnounced={isAnnounced}
              listingSlug={listingSlug}
              listingType={listingType}
              defaultSuggestions={defaultSuggestions}
              key={comment.id}
              comment={comment}
              poc={poc}
              sponsorId={sponsorId}
              refType={refType}
              refId={refId}
              deleteComment={deleteComment}
              isVerified={isVerified}
              isTemplate={isTemplate}
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
            fontSize={{
              base: 'md',
              md: 'large',
            }}
            fontWeight={400}
            isDisabled={!!isLoading}
            isLoading={!!isLoading}
            loadingText={t('comments.fetchingComments')}
            onClick={() => getComments(comments.length)}
            rounded="md"
            variant="ghost"
          >
            {t('comments.showMoreComments')}
          </Button>
        </Flex>
      )}
    </VStack>
  );
};
