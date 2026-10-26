'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { posthog } from 'posthog-js';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { deleteJson, getJson, postJson } from '@/lib/fetch-json';
import type { CommentRefType } from '@/prisma/enums';
import { cn } from '@/utils/cn';

import { useValidUsernames, ValidUsernamesProvider } from '../context';
import type { Comment, CommentsPage, MentionUser } from '../types';
import { sortComments } from '../utils';
import { Comment as CommentUI } from './Comment';
import { CommentForm } from './CommentForm';

interface Props {
  refId: string;
  refType: CommentRefType;
  sponsorId: string | undefined;
  poc: MentionUser | undefined;
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
  // The first page, loaded with the page on the server. Without it (the
  // feed), the comments load when this mounts.
  initialData?: CommentsPage;
}

const pageUrl = (refId: string, skip: number, take: number) =>
  `/api/comment/${encodeURIComponent(refId)}/?skip=${skip}&take=${take}`;

export const Comments = (props: Props) => (
  <ValidUsernamesProvider initial={props.initialData?.validUsernames ?? []}>
    <CommentsThread {...props} />
  </ValidUsernamesProvider>
);

const CommentsThread = ({
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
  initialData,
}: Props) => {
  const { addValidUsernames } = useValidUsernames();
  const [firstPage, setFirstPage] = useState<CommentsPage | null>(
    initialData ?? null,
  );
  const [isError, setIsError] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loadedPages, setLoadedPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setFirstPage(await getJson<CommentsPage>(pageUrl(refId, 0, take)));
      setIsError(false);
    } catch {
      setIsError(true);
    }
  }, [refId, take]);

  // The feed has no first page yet: load it.
  useEffect(() => {
    const controller = new AbortController();
    if (!initialData) {
      getJson<CommentsPage>(pageUrl(refId, 0, take), controller.signal).then(
        (page) => {
          setFirstPage(page);
          setIsError(false);
        },
        () => {
          if (!controller.signal.aborted) setIsError(true);
        },
      );
    }
    return () => controller.abort();
  }, [initialData, refId, take]);

  useEffect(() => {
    if (firstPage) {
      setCount(firstPage.count);
      addValidUsernames(firstPage.validUsernames);
    }
  }, [firstPage, setCount, addValidUsernames]);

  const comments = useMemo(() => {
    const combined = [...localComments, ...(firstPage?.result ?? [])];
    const deduped = Array.from(
      new Map(combined.map((c) => [c.id, c])).values(),
    );
    return sortComments(deduped);
  }, [firstPage?.result, localComments]);

  const defaultSuggestions = useMemo(() => {
    const suggestions = new Map<string, MentionUser>();
    if (poc?.id) {
      suggestions.set(poc.id, poc);
    }
    comments.forEach((comment) => {
      suggestions.set(comment.authorId, {
        ...comment.author,
        id: comment.authorId,
      });
    });
    return suggestions;
  }, [comments, poc]);

  const deleteComment = async (commentId: string) => {
    posthog.capture('delete_comment');
    await deleteJson(`/api/comment/${commentId}/delete/`);
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    void refetch();
  };

  const pinComment = async (commentId: string, isPinned: boolean) => {
    posthog.capture('pin_comment');
    await postJson(`/api/comment/${commentId}/pin/`, { isPinned });
    setLocalComments((prev) =>
      sortComments(
        prev.map((c) => (c.id === commentId ? { ...c, isPinned } : c)),
      ),
    );
    void refetch();
  };

  const loadMoreComments = async () => {
    setIsLoadingMore(true);
    try {
      const page = await getJson<CommentsPage>(
        pageUrl(refId, loadedPages * take, take),
      );
      addValidUsernames(page.validUsernames);
      setLocalComments((prev) => [...prev, ...page.result]);
      setLoadedPages((p) => p + 1);
    } catch (e) {
      console.error('Failed to load more comments:', e);
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    const handleUpdate = () => {
      void refetch();
    };
    window.addEventListener('update-comments', handleUpdate);
    return () => window.removeEventListener('update-comments', handleUpdate);
  }, [refetch]);

  if (isError && !firstPage) return <ErrorInfo />;

  if (!firstPage) {
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
            onClick={() => void loadMoreComments()}
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
