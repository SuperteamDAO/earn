'use client';

import { posthog } from 'posthog-js';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { URL_REGEX } from '@/constants/URL_REGEX';
import { postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import { CommentRefType } from '@/prisma/enums';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import type { Comment, MentionUser } from '../types';
import { UserSuggestionTextarea } from './UserSuggestionTextarea';

interface Props {
  defaultSuggestions: Map<string, MentionUser>;
  refId: string;
  refType: CommentRefType;
  isTemplate?: boolean;
  poc?: MentionUser | undefined;
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
  const user = useViewer();

  const [newComment, setNewComment] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);
  const [newCommentError, setNewCommentError] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const containsLink = newComment
    .split(/\s+/)
    .some((part) => URL_REGEX.test(part));

  const addNewComment = async () => {
    posthog.capture('publish_comment');
    setNewCommentLoading(true);
    setNewCommentError(false);
    try {
      const created = await postJson<Comment>(`/api/comment/create/`, {
        message: newComment,
        refType: refType,
        refId: refId,
        isPinned,
      });
      onSuccess?.(created);
      setNewComment('');
      setIsPinned(false);
      setNewCommentLoading(false);
    } catch {
      setNewCommentError(true);
      setNewCommentLoading(false);
    }
  };

  const handleSubmit = () => {
    void addNewComment();
  };

  const canComment = () =>
    !!user && (user.isTalentFilled || !!user.currentSponsorId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (newComment && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();

      if (canComment() && !isTemplate && !isDisabled) {
        handleSubmit();
      }
    }
  };

  // A draft left in this tab comes back after the page renders (the server
  // can't see sessionStorage).
  useEffect(() => {
    const saved = sessionStorage.getItem(`comment-${refId}`);
    // oxlint-disable-next-line react/set-state-in-effect
    if (saved) setNewComment(saved);
  }, [refId]);

  useEffect(() => {
    if (newComment) {
      sessionStorage.setItem(`comment-${refId}`, newComment);
    } else {
      sessionStorage.removeItem(`comment-${refId}`);
    }
  }, [newComment, refId]);

  const isCollapsed = !newComment;

  const isPoc = !!poc?.id && poc.id === user?.id;

  return (
    <div className="mb-4 flex w-full flex-col gap-4">
      <div className="flex w-full gap-3">
        <EarnAvatar
          className="h-9 w-9"
          id={user?.id}
          avatar={user?.photo ?? undefined}
        />
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
      {newCommentError && (
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
                onCheckedChange={(checked) => setIsPinned(checked === true)}
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
              className={cn(
                'h-auto px-5 py-1.5 text-[11px] font-medium md:text-sm',
              )}
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
