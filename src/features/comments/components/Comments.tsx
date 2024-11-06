import { Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { type CommentRefType } from '@prisma/client';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import Image from 'next/image';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { LuArrowRight } from 'react-icons/lu';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import type { Comment } from '@/interface/comments';
import { type User } from '@/interface/user';

import { validUsernamesAtom } from '../atoms';
import { Comment as CommentUI } from './Comment';
import { CommentForm } from './CommentForm';

interface Props {
  refId: string;
  refType: CommentRefType;
  sponsorId: string | undefined;
  poc: User | undefined;
  listingType: string;
  listingSlug: string;
  isAnnounced: boolean;
  isVerified?: boolean;
  count: number;
  take?: number;
  setCount: Dispatch<SetStateAction<number>>;
  isTemplate?: boolean;
  onSuccess?: (newComment: Comment) => void;
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
  take = 10,
  setCount,
  onSuccess,
}: Props) => {
  const posthog = usePostHog();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [defaultSuggestions, setDefaultSuggestions] = useState<
    Map<string, User>
  >(new Map());
  const setValidUsernames = useSetAtom(validUsernamesAtom);

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

  const getComments = async (skip = 0, take = 10) => {
    setIsLoading(true);
    try {
      const commentsData = await axios.get(`/api/comment/${refId}`, {
        params: {
          skip,
          take,
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
      setValidUsernames(commentsData.data.validUsernames as string[]);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getComments(0, take);

    window.addEventListener('update-comments', () => {
      getComments();
    });
  }, []);

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
          alt="Comments Icon"
          src="/assets/icons/comments.svg"
        />
        <HStack>
          <Text color="brand.slate.900" fontSize={'medium'} fontWeight={600}>
            {count}
          </Text>
          <Text color="brand.slate.900" fontSize={'medium'} fontWeight={400}>
            {comments?.length === 1 ? 'Comment' : 'Comments'}
          </Text>
        </HStack>
      </HStack>
      <CommentForm
        defaultSuggestions={defaultSuggestions}
        refType={refType}
        refId={refId}
        poc={poc}
        onSuccess={(newComment) => {
          setCount((count) => count + 1);
          setComments((prevComments) => [newComment, ...prevComments]);
          onSuccess?.(newComment);
        }}
        isTemplate={isTemplate}
      />
      <VStack align="start" gap={5} w={'full'} pb={comments.length > 0 ? 4 : 0}>
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
        <Flex justify="center" w="full" rounded="md">
          <Button
            fontSize={'sm'}
            fontWeight={400}
            border="none"
            isDisabled={!!isLoading}
            isLoading={!!isLoading}
            loadingText="Fetching Comments..."
            onClick={() => getComments(comments.length)}
            rightIcon={<LuArrowRight />}
            rounded="md"
            variant="outlineSecondary"
          >
            Show More Comments
          </Button>
        </Flex>
      )}
    </VStack>
  );
};
