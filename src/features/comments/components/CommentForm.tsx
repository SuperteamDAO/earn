import posthog from 'posthog-js';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { URL_REGEX } from '@/constants/URL_REGEX';
import type { Comment } from '@/interface/comments';
import type { User } from '@/interface/user';
import { api } from '@/lib/api';
import { CommentRefType } from '@/prisma/enums';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { UserSuggestionTextarea } from './UserSuggestionTextarea';

interface Props {
  defaultSuggestions: Map<string, User>;
  refId: string;
  refType: CommentRefType;
  isTemplate?: boolean;
  poc?: User | undefined;
  onSuccess?: (newComment: Comment) => void;
  isDisabled?: boolean;
}

export const CommentForm = ({
  defaultSuggestions,
  refId,
  refType,
  poc,
  isTemplate = false,
  isDisabled = false,
  onSuccess,
}: Props) => {
  const { user } = useUser();

  const [newComment, setNewComment] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);
  const [newCommentError, setNewCommentError] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

  const containsLink = newComment
    .split(/\s+/)
    .some((part) => URL_REGEX.test(part));

  const addNewComment = async () => {
    posthog.capture('publish_comment');
    setNewCommentLoading(true);
    setNewCommentError(false);
    try {
      const newCommentData = await api.post(`/api/comment/create`, {
        message: newComment,
        refType: refType,
        refId: refId,
        pocId: poc?.id,
        isPinned,
      });
      onSuccess?.(newCommentData.data);
      setNewComment('');
      setIsPinned(false);
      setNewCommentLoading(false);
    } catch (e) {
      setNewCommentError(true);
      setNewCommentLoading(false);
    }
  };

  const handleSubmit = () => {
    addNewComment();
  };

  const canComment = () => {
    if (!user) {
      return false;
    }

    const isSponsor = !!user.currentSponsorId;
    const isTalentFilled = !!user.isTalentFilled;
    return isTalentFilled || isSponsor;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (newComment && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();

      if (canComment() && !isTemplate && !isDisabled) {
        handleSubmit();
      }
    }
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

  const isPoc = poc?.id === user?.id;

  return (
    <div className="mb-4 flex w-full flex-col gap-4">
      <div className="flex w-full gap-3">
        <EarnAvatar className="h-9 w-9" id={user?.id} avatar={user?.photo} />
        <div className="relative mt-0.5 w-full">
          <UserSuggestionTextarea
            defaultSuggestions={defaultSuggestions}
            placeholder="Write a comment"
            value={newComment}
            setValue={setNewComment}
            onKeyDown={handleKeyDown}
            variant="flushed"
          />
        </div>
      </div>
      {containsLink && refType === CommentRefType.BOUNTY && (
        <p className="mt-1 text-sm text-red-500">
          If this is your submission link, do not add it as a comment since it
          might be plagiarised. Your submission needs to be added to the
          submission form above to be considered.
        </p>
      )}
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
        <div className="flex w-full items-center justify-end gap-4">
          {isPoc && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="pin-comment"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
                disabled={newCommentLoading || !newComment}
                className="mb-0.5"
              />
              <label
                htmlFor="pin-comment"
                className="text-[11px] font-medium text-slate-600 md:text-sm"
              >
                Pin Comment
              </label>
            </div>
          )}
          <Button
            variant="ghost"
            className="h-auto px-5 py-1.5 text-[11px] font-medium text-slate-500 md:text-sm"
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
            allowSponsor
          >
            <Button
              variant="default"
              className="h-auto px-5 py-1.5 text-[11px] font-medium md:text-sm"
              disabled={
                newCommentLoading || !newComment || isTemplate || isDisabled
              }
              onClick={handleSubmit}
            >
              {newCommentLoading ? (
                <span>Adding...</span>
              ) : (
                <span>Comment</span>
              )}
            </Button>
          </AuthWrapper>
        </div>
      </div>
    </div>
  );
};
