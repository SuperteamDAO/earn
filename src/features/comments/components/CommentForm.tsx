import { Box, Button, Collapse, Flex, Text, VStack } from '@chakra-ui/react';
import { type CommentRefType } from '@prisma/client';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { AuthWrapper } from '@/features/auth';
import { EarnAvatar } from '@/features/talent';
import type { Comment } from '@/interface/comments';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';

import { UserSuggestionTextarea } from './UserSuggestionTextarea';

interface Props {
  defaultSuggestions: Map<string, User>;
  refId: string;
  refType: CommentRefType;
  isTemplate?: boolean;
  poc?: User | undefined;
  onSuccess?: (newComment: Comment) => void;
}
export const CommentForm = ({
  defaultSuggestions,
  refId,
  refType,
  poc,
  isTemplate = false,
  onSuccess,
}: Props) => {
  const { user } = useUser();
  const posthog = usePostHog();

  const [newComment, setNewComment] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);
  const [newCommentError, setNewCommentError] = useState(false);

  const addNewComment = async () => {
    posthog.capture('publish_comment');
    setNewCommentLoading(true);
    setNewCommentError(false);
    try {
      const newCommentData = await axios.post(`/api/comment/create`, {
        message: newComment,
        refType: refType,
        refId: refId,
        pocId: poc?.id,
      });
      onSuccess?.(newCommentData.data);
      setNewComment('');
      setNewCommentLoading(false);
    } catch (e) {
      setNewCommentError(true);
      setNewCommentLoading(false);
    }
  };

  const handleSubmit = () => {
    addNewComment();
  };

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

  return (
    <VStack gap={4} w={'full'} mb={4} cursor="default">
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
            placeholder=""
            value={newComment}
            setValue={setNewComment}
            variant="flushed"
          />
        </Box>
      </Flex>
      {!!newCommentError && (
        <Text mt={4} color="red">
          添加评论时出错！请重试！
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
            Cancel
          </Button>
          <AuthWrapper
            showCompleteProfileModal
            completeProfileModalBodyText={
              '在对列表发表评论前，请填写您的个人资料。'
            }
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
              loadingText="添加..."
              onClick={() => handleSubmit()}
              variant="solid"
            >
              评论
            </Button>
          </AuthWrapper>
        </Flex>
      </Collapse>
    </VStack>
  );
};
