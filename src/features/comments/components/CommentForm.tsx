import { type CommentRefType } from '@prisma/client';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { AuthWrapper } from '@/features/auth';
import { EarnAvatar } from '@/features/talent';
import type { Comment } from '@/interface/comments';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

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
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  useEffect(() => {
    setIsCollapsed(!newComment);
  }, [newComment]);

  return (
    <div className="mb-4 flex w-full flex-col gap-4">
      <div className="flex w-full gap-3">
        <EarnAvatar size={'36px'} id={user?.id} avatar={user?.photo} />
        <div className="relative mt-0.5 w-full">
          <UserSuggestionTextarea
            defaultSuggestions={defaultSuggestions}
            placeholder="Write a comment"
            value={newComment}
            setValue={setNewComment}
            variant="flushed"
          />
        </div>
      </div>
      {!!newCommentError && (
        <p className="mt-4 text-red-500">
          Error in adding your comment! Please try again!
        </p>
      )}
      <div
        className={cn(
          'transform transition-all duration-200 ease-in-out',
          isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100',
        )}
      >
        <div className="flex w-full justify-end gap-4">
          <Button
            variant="ghost"
            className="h-auto px-5 py-2 text-[10px] font-medium md:text-sm"
            disabled={newCommentLoading || !newComment}
            onClick={() => setNewComment('')}
          >
            Cancel
          </Button>
          <AuthWrapper
            showCompleteProfileModal
            completeProfileModalBodyText={
              'Please complete your profile before commenting on the listing.'
            }
          >
            <Button
              variant="default"
              className="h-auto px-5 py-2 text-[10px] font-medium md:text-sm"
              disabled={newCommentLoading || !newComment || isTemplate}
              onClick={handleSubmit}
            >
              {newCommentLoading ? 'Adding...' : 'Comment'}
            </Button>
          </AuthWrapper>
        </div>
      </div>
    </div>
  );
};
