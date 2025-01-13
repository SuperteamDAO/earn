import { type CommentRefType } from '@prisma/client';
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import { type Comment as IComment } from '@/interface/comments';
import { type User } from '@/interface/user';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { getURL } from '@/utils/validUrl';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { formatFromNow } from '../utils';
import { CommentParser } from './CommentParser';
import { UserSuggestionTextarea } from './UserSuggestionTextarea';

interface Props {
  comment: IComment;
  poc: User | undefined;
  refId: string;
  refType: CommentRefType;
  sponsorId: string | undefined;
  defaultSuggestions: Map<string, User>;
  deleteComment: (commentId: string) => Promise<void>;
  listingSlug: string;
  listingType: string;
  isAnnounced: boolean;
  isReply?: boolean;
  addNewReply?: (msg: string) => Promise<void>;
  isVerified?: boolean;
  isTemplate?: boolean;
  isDisabled?: boolean;
}

export const Comment = ({
  comment,
  sponsorId,
  refId,
  refType,
  poc,
  deleteComment,
  defaultSuggestions,
  addNewReply,
  listingType,
  listingSlug,
  isReply = false,
  isAnnounced,
  isVerified = false,
  isTemplate = false,
  isDisabled = false,
}: Props) => {
  const { user } = useUser();
  const posthog = usePostHog();

  const {
    isOpen: deleteIsOpen,
    onOpen: deleteOnOpen,
    onClose: deleteOnClose,
  } = useDisclosure();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment?.replies ?? []);
  const [newReply, setNewReply] = useState('');
  const [newReplyLoading, setNewReplyLoading] = useState(false);
  const [newReplyError, setNewReplyError] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const cancelRef = useRef<any>(null);

  useEffect(() => {
    const reply = localStorage.getItem(`comment-${refId}-${comment.id}`);
    if (reply) {
      setNewReply(reply);
      setShowReplies(true);
      setShowReplyInput(true);
      localStorage.removeItem(`comment-${refId}-${comment.id}`);
    }
  }, []);

  const deleteReplyLvl1 = async (replyId: string) => {
    posthog.capture('delete_comment');
    const replyIndex = replies.findIndex((reply) => reply.id === replyId);
    if (replyIndex > -1) {
      await api.delete(`/api/comment/${replyId}/delete`);
      setReplies((prevReplies) => {
        const newReplies = [...prevReplies];
        newReplies.splice(replyIndex, 1);
        return newReplies;
      });
    } else {
      throw new Error('Reply not found');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(false);
    try {
      await deleteComment(comment.id);
      setDeleteLoading(false);
      deleteOnClose();
    } catch (e) {
      console.log('error - ', e);
      setDeleteError(true);
      setDeleteLoading(false);
    }
  };

  const addNewReplyLvl1 = async (msg: string) => {
    posthog.capture('publish_comment');
    setNewReplyError(false);
    const newReplyData = await api.post(`/api/comment/create`, {
      message: msg,
      refType: refType,
      refId: refId,
      replyToId: comment?.id ?? null,
      replyToUserId: comment?.authorId ?? null,
      pocId: poc?.id,
    });
    setReplies((prevReplies) => [...prevReplies, newReplyData.data]);
    setShowReplies(true);
  };

  const date = formatFromNow(dayjs(comment?.updatedAt).fromNow());

  const handleSubmit = async () => {
    try {
      setNewReplyLoading(true);
      setNewReplyError(false);

      if (addNewReply) {
        await addNewReply(newReply);
      } else {
        await addNewReplyLvl1(newReply);
      }

      setNewReply('');
      setNewReplyLoading(false);
      setShowReplyInput(false);
    } catch (e) {
      console.log('error - ', e);
      setNewReplyError(true);
      setNewReplyLoading(false);
    }
  };
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (newReply && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [newReply],
  );

  useEffect(() => {
    localStorage.setItem(`comment-${refId}-${comment.id}`, newReply);
  }, [newReply]);

  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      <div
        key={comment.id}
        className="flex w-full items-start gap-3 overflow-visible"
        onMouseEnter={() => {
          if (!isMobile) setShowOptions(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) setShowOptions(false);
        }}
      >
        <Link
          href={`${getURL()}t/${comment?.author?.username}`}
          className={cn('block', isReply ? 'w-8' : 'w-10')}
          tabIndex={-1}
          target="_blank"
        >
          <EarnAvatar
            className={cn(isReply ? 'h-7 w-7' : 'h-9 w-9')}
            id={comment?.author?.id}
            avatar={comment?.author?.photo}
          />
        </Link>

        <div className="flex w-full flex-col items-start">
          <div className="flex items-end gap-2">
            <Link
              href={`${getURL()}t/${comment?.author?.username}`}
              className="hover:underline"
              tabIndex={-1}
              target="_blank"
            >
              <p className="text-sm font-medium text-slate-800 md:text-base">
                {`${comment?.author?.firstName} ${comment?.author?.lastName}`}
              </p>
            </Link>
            {comment?.author?.currentSponsorId === sponsorId && (
              <p className="flex items-center gap-0.5 pb-0.5 text-xs font-medium text-blue-500 md:text-sm">
                {isVerified && <VerifiedBadge />}
                Sponsor
              </p>
            )}
            <p className="pb-0.5 text-xs font-medium text-slate-400 md:text-sm">
              {date}
            </p>
          </div>
          <p className="mt-0 max-w-[15rem] overflow-clip pb-2 text-sm text-slate-500 sm:max-w-[20rem] md:max-w-[17rem] md:text-base lg:max-w-[29rem] xl:max-w-[46rem]">
            <CommentParser
              listingSlug={listingSlug}
              listingType={listingType}
              isAnnounced={isAnnounced}
              type={comment.type}
              submissionId={comment.submissionId}
              value={comment?.message}
            />
          </p>
          <div className="flex gap-2 overflow-visible">
            {replies?.length > 0 && (
              <button
                onClick={() => setShowReplies((prev) => !prev)}
                className="relative -left-3 flex items-center text-xs font-medium text-brand-purple hover:text-brand-purple-dark md:text-sm"
              >
                <ChevronDown className="mr-1 h-4 w-4" />
                {replies?.length} {replies?.length === 1 ? 'Reply' : 'Replies'}
              </button>
            )}
            <Button
              variant={'link'}
              size="sm"
              onClick={() => setShowReplyInput((prev) => !prev)}
              className="-left-3 h-auto p-0 text-xs font-medium text-slate-500 hover:text-slate-600 hover:no-underline md:text-sm"
              disabled={isDisabled}
            >
              Reply
            </Button>
          </div>
          <div
            className={cn(
              'w-full transition-all duration-200',
              !showReplyInput && 'hidden',
            )}
          >
            <div className="mb-4 flex w-full flex-col gap-4 pt-4">
              <div className="flex w-full gap-3">
                <EarnAvatar
                  className="h-7 w-7"
                  id={user?.id}
                  avatar={user?.photo}
                />
                <UserSuggestionTextarea
                  autoFocusOn={showReplyInput}
                  defaultSuggestions={defaultSuggestions}
                  placeholder="Write a comment"
                  value={newReply}
                  setValue={setNewReply}
                  variant="flushed"
                  onKeyDown={handleKeyDown}
                />
              </div>
              {!!newReplyError && (
                <p className="my-0 mt-4 text-xs text-red-500">
                  Error in adding your comment! Please try again!
                </p>
              )}
              <div
                className={cn(
                  'flex w-full justify-end gap-4 transition-all duration-200',
                  !newReply && 'hidden',
                )}
              >
                <AuthWrapper
                  showCompleteProfileModal
                  completeProfileModalBodyText={
                    'Please complete your profile before commenting on the listing.'
                  }
                >
                  <Button
                    className="h-auto bg-slate-200 px-5 py-2 text-xs text-slate-800 hover:bg-slate-300 active:bg-slate-400 disabled:opacity-50"
                    disabled={
                      newReplyLoading || !newReply || isTemplate || isDisabled
                    }
                    onClick={handleSubmit}
                  >
                    {newReplyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Reply'
                    )}
                  </Button>
                </AuthWrapper>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'w-full transition-all duration-200',
              !showReplies && 'hidden',
            )}
          >
            <div className="flex w-full flex-col gap-4 pt-3">
              {replies.map((reply) => (
                <Comment
                  poc={poc}
                  isAnnounced={isAnnounced}
                  listingSlug={listingSlug}
                  listingType={listingType}
                  defaultSuggestions={defaultSuggestions}
                  deleteComment={deleteReplyLvl1}
                  addNewReply={addNewReplyLvl1}
                  isReply
                  key={reply.id}
                  refType={refType}
                  sponsorId={sponsorId}
                  comment={reply}
                  refId={refId}
                />
              ))}
            </div>
          </div>
        </div>
        <div
          className={cn(
            'transition-opacity duration-200',
            (showOptions || isMobile) && comment.authorId === user?.id
              ? 'opacity-100'
              : 'opacity-0',
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2">
                <svg
                  width="3"
                  height="12"
                  viewBox="0 0 3 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-slate-400"
                >
                  <path
                    d="M1.5 3C2.325 3 3 2.325 3 1.5C3 0.675 2.325 0 1.5 0C0.675 0 0 0.675 0 1.5C0 2.325 0.675 3 1.5 3ZM1.5 4.5C0.675 4.5 0 5.175 0 6C0 6.825 0.675 7.5 1.5 7.5C2.325 7.5 3 6.825 3 6C3 5.175 2.325 4.5 1.5 4.5ZM1.5 9C0.675 9 0 9.675 0 10.5C0 11.325 0.675 12 1.5 12C2.325 12 3 11.325 3 10.5C3 9.675 2.325 9 1.5 9Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[10rem] p-1" align="end">
              <DropdownMenuItem
                className="ph-no-capture rounded-sm text-sm font-medium text-slate-600 md:text-base"
                onClick={deleteOnOpen}
                tabIndex={-1}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AlertDialog open={deleteIsOpen} onOpenChange={deleteOnClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Delete Comment
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogDescription>
            Are you sure? You can&apos;t undo this action.
            {deleteError && (
              <Alert variant="destructive" className="mt-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <div className="flex flex-col gap-2">
                  <AlertTitle>Failed to delete comment</AlertTitle>
                  <AlertDescription className="self-start">
                    Please try again later.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </AlertDialogDescription>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button ref={cancelRef} onClick={deleteOnClose} variant="ghost">
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              className={cn('ph-no-capture', 'ml-3')}
              disabled={deleteLoading}
              onClick={handleDelete}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
