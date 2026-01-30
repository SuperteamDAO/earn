import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { ArrowRight, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import type { Comment } from '@/interface/comments';
import { type User } from '@/interface/user';
import { api } from '@/lib/api';
import { type CommentRefType } from '@/prisma/enums';
import { cn } from '@/utils/cn';

import { validUsernamesAtom } from '../atoms';
import { commentsQuery } from '../queries/comments';
import { sortComments } from '../utils';
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
  isDisabled?: boolean;
  isListingAndUserPro?: boolean;
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
  isDisabled = false,
  count,
  take = 10,
  setCount,
  onSuccess,
  isListingAndUserPro = false,
}: Props) => {
  const queryClient = useQueryClient();
  const setValidUsernames = useSetAtom(validUsernamesAtom);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loadedPages, setLoadedPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: commentsData,
    isLoading,
    isError,
  } = useQuery(commentsQuery({ refId, skip: 0, take }));

  useEffect(() => {
    if (commentsData) {
      setCount(commentsData.count);
      setValidUsernames(commentsData.validUsernames);
    }
  }, [commentsData, setCount, setValidUsernames]);

  const comments = useMemo(() => {
    const serverComments = commentsData?.result ?? [];
    const combined = [...localComments, ...serverComments];
    const deduped = Array.from(
      new Map(combined.map((c) => [c.id, c])).values(),
    );
    return sortComments(deduped);
  }, [commentsData?.result, localComments]);

  const defaultSuggestions = useMemo(() => {
    const suggestions = new Map<string, User>();
    if (poc?.id) {
      suggestions.set(poc.id, poc);
    }
    comments.forEach((comment) => {
      suggestions.set(comment.authorId, comment.author);
    });
    return suggestions;
  }, [comments, poc]);

  const deleteComment = async (commentId: string) => {
    posthog.capture('delete_comment');
    await api.delete(`/api/comment/${commentId}/delete`);
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    queryClient.invalidateQueries({ queryKey: ['comments', refId] });
  };

  const pinComment = async (commentId: string, isPinned: boolean) => {
    posthog.capture('pin_comment');
    await api.post(`/api/comment/${commentId}/pin`, { isPinned });
    setLocalComments((prev) =>
      sortComments(
        prev.map((c) => (c.id === commentId ? { ...c, isPinned } : c)),
      ),
    );
    queryClient.invalidateQueries({ queryKey: ['comments', refId] });
  };

  const loadMoreComments = async () => {
    setIsLoadingMore(true);
    try {
      const response = await api.get(`/api/comment/${refId}`, {
        params: { skip: loadedPages * take, take },
      });
      const newComments = response.data.result as Comment[];
      setLocalComments((prev) => [...prev, ...newComments]);
      setLoadedPages((p) => p + 1);
    } catch (e) {
      console.error('Failed to load more comments:', e);
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['comments', refId] });
    };
    window.addEventListener('update-comments', handleUpdate);
    return () => window.removeEventListener('update-comments', handleUpdate);
  }, [queryClient, refId]);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-start gap-4 rounded-xl bg-white">
        <div className="flex w-full gap-2 pt-4">
          <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex w-full gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="flex w-full flex-col gap-5 pb-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex w-full gap-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorInfo />;

  return (
    <div
      className="flex w-full flex-col items-start gap-4 rounded-xl bg-white"
      id="comments"
    >
      <div className="flex w-full gap-2 pt-4">
        <ExternalImage
          className="h-5 w-5"
          alt="Comments Icon"
          src={'/icons/comments.svg'}
        />
        <div className="flex gap-2">
          <p className="text-base font-medium text-slate-900">{count}</p>
          <p className="text-base text-slate-900">
            {comments?.length === 1 ? 'Comment' : 'Comments'}
          </p>
        </div>
      </div>
      <CommentForm
        defaultSuggestions={defaultSuggestions}
        refType={refType}
        refId={refId}
        poc={poc}
        onSuccess={(newComment) => {
          setCount((c) => c + 1);
          setLocalComments((prev) => sortComments([newComment, ...prev]));
          onSuccess?.(newComment);
        }}
        isTemplate={isTemplate}
        isDisabled={isDisabled}
        isListingAndUserPro={isListingAndUserPro}
      />
      <div
        className={cn(
          'flex w-full flex-col items-start gap-5',
          comments.length > 0 && 'pb-4',
        )}
      >
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
              pinComment={pinComment}
              isVerified={isVerified}
              isTemplate={isTemplate}
              isDisabled={isDisabled}
              isListingAndUserPro={isListingAndUserPro}
            />
          );
        })}
      </div>
      {!!comments.length && comments.length < count && (
        <div className="flex w-full justify-center rounded-md">
          <Button
            className={cn(
              'text-sm font-normal text-slate-400 hover:bg-slate-400 hover:text-white',
              'disabled:hover:bg-transparent disabled:hover:text-slate-400',
            )}
            disabled={isLoadingMore}
            onClick={loadMoreComments}
            variant="ghost"
          >
            {isLoadingMore ? (
              <>
                <span>Fetching Comments...</span>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <span>Show More Comments</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
