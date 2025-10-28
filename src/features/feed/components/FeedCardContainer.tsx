'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { type ReactNode, useEffect, useState } from 'react';

import GoComment from '@/components/icons/GoComment';
import IoMdHeart from '@/components/icons/IoMdHeart';
import IoMdHeartEmpty from '@/components/icons/IoMdHeartEmpty';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { Comments } from '@/features/comments/components/Comments';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type FeedDataProps } from '../types';
import { convertFeedPostTypeToCommentRefType } from '../utils';
import { FeedCardHeader } from './FeedCardHeader';

interface FeedCardContainerProps {
  content: {
    actionText: string;
    createdAt: string;
    description?: string;
  };
  actionLinks: ReactNode;
  children: ReactNode;
  type: 'activity' | 'profile';
  firstName: string;
  lastName: string;
  photo: string | undefined;
  username?: string;
  id: string;
  like: any;
  commentLink?: string;
  commentCount?: number;
  cardType: 'submission' | 'pow' | 'grant-application';
  link: string;
  userId: string;
  recentCommenters?: FeedDataProps['recentCommenters'];
  isPrivate: boolean;
}

export const FeedCardContainer = ({
  content,
  actionLinks,
  children,
  type,
  firstName,
  lastName,
  photo,
  username,
  id,
  like,
  commentCount: initialCommentCount,
  cardType,
  link,
  userId,
  recentCommenters: initialRecentCommenters,
  isPrivate,
}: FeedCardContainerProps) => {
  const { user } = useUser();

  const [isLiked, setIsLiked] = useState<boolean>(
    !!like?.find((e: any) => e.id === user?.id),
  );
  const [totalLikes, setTotalLikes] = useState<number>(like?.length ?? 0);
  const {
    onToggle: onToggleComment,
    isOpen: isCommentOpen,
    onClose: onCloseComment,
  } = useDisclosure();
  const [commentCount, setCommentCount] = useState(initialCommentCount || 0);
  const [recentCommenters, setRecentCommenters] = useState(
    initialRecentCommenters,
  );

  const handleCommentSuccess = () => {
    setRecentCommenters((prevCommenters) => [
      ...(prevCommenters ? prevCommenters.slice(0, 3) : []),
      { author: { photo: user?.photo || null, name: user?.firstName || null } },
    ]);
    onCloseComment();
  };

  const sanitizedLink = getURLSanitized(link);

  useEffect(() => {
    setIsLiked(!!like?.find((e: any) => e.id === user?.id));
  }, [like, user?.id]);

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    if (newIsLiked) posthog.capture('liked post_feed');
    else posthog.capture('unliked post_feed');
    const newTotalLikes = newIsLiked
      ? totalLikes + 1
      : Math.max(totalLikes - 1, 0);

    setIsLiked(newIsLiked);
    setTotalLikes(newTotalLikes);

    try {
      await api.post(`/api/${cardType}/like`, { id });
    } catch (error) {
      console.log(error);
      setIsLiked(isLiked);
      setTotalLikes(totalLikes);
      alert('Failed to update like status. Please try again.');
    }
  };

  const router = useRouter();

  return (
    <div
      className={cn(
        'mx-0 -mt-[1px] px-0 py-4 md:py-8',
        type === 'activity' && 'border-b border-slate-200 px-5',
      )}
    >
      <div className="flex gap-1.5 sm:gap-3">
        <EarnAvatar
          id={userId}
          avatar={photo}
          className="size-7 sm:size-9"
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            router.push(`/t/${username}`);
          }}
        />

        <div className="flex w-full flex-col">
          <FeedCardHeader
            name={`${firstName} ${lastName}`}
            photo={photo}
            username={username}
            action={content.actionText}
            createdAt={content.createdAt}
            description={content.description}
            type={type}
          />

          <FeedCardChildWrapper
            isPrivate={isPrivate}
            className={cn(
              'group mt-4 rounded-md border border-slate-200 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.01)] transition-all duration-100 ease-in-out hover:-translate-y-[0.5px] hover:shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1)]',
              !isPrivate && 'cursor-pointer',
            )}
            sanitizedLink={sanitizedLink}
            actionLinks={actionLinks}
          >
            {children}
          </FeedCardChildWrapper>
          {id && (
            <div
              className={cn(
                'mt-2 flex w-fit items-center gap-8 pr-8 sm:py-2',
                id ? 'pointer-events-auto' : 'pointer-events-none',
              )}
              id="feed-actions"
            >
              <div
                className="ph-no-capture z-10 mr-2 flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (!user?.id) return;
                  handleLike();
                }}
              >
                {!isLiked && (
                  <AuthWrapper>
                    <IoMdHeartEmpty className="h-5 w-5 cursor-pointer text-slate-500 md:h-[22px] md:w-[22px]" />
                  </AuthWrapper>
                )}
                {isLiked && (
                  <IoMdHeart className="h-5 w-5 cursor-pointer text-rose-600 md:h-[22px] md:w-[22px]" />
                )}
                <p className="cursor-pointer text-sm font-medium text-slate-500 sm:text-base">
                  {totalLikes}
                </p>
              </div>
              <div
                className="ph-no-capture z-10 mr-2 flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onToggleComment();
                }}
              >
                <GoComment className="h-[19px] w-[19px] cursor-pointer text-slate-500 md:h-[21px] md:w-[21px]" />
                {!!commentCount && (
                  <p className="cursor-pointer text-sm font-medium text-slate-500 sm:text-base">
                    {commentCount}
                  </p>
                )}
                <div className="ml-1 flex -space-x-2">
                  {recentCommenters?.slice(0, 4).map((comment, index) => (
                    <EarnAvatar
                      avatar={comment.author.photo!}
                      id={comment.author.name!}
                      key={index}
                      className="h-6 w-6 border border-white"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <Collapsible open={isCommentOpen}>
            <CollapsibleContent className="mt-6 w-full overflow-visible">
              <div
                className="mt-6"
                id="comment-form"
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                <Comments
                  isAnnounced={false}
                  listingSlug={''}
                  listingType={''}
                  poc={undefined}
                  sponsorId={undefined}
                  isVerified={false}
                  refId={id}
                  refType={convertFeedPostTypeToCommentRefType(cardType)}
                  count={commentCount}
                  setCount={setCommentCount}
                  onSuccess={handleCommentSuccess}
                  take={3}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export const FeedCardContainerSkeleton = () => {
  return (
    <div className="mx-0 -mt-[1px] border-b border-slate-200 px-5 py-8">
      <div className="flex gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex w-full flex-col">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="mt-4 h-[200px] rounded-md border border-slate-200 shadow-xs md:h-[300px]" />
        </div>
      </div>
    </div>
  );
};

interface FeedCardLinkOrDivProps {
  isPrivate: boolean;
  className?: string;
  sanitizedLink: string;
  children: ReactNode;
  actionLinks: ReactNode;
}

function FeedCardChildWrapper({
  isPrivate,
  className,
  sanitizedLink,
  children,
  actionLinks,
}: FeedCardLinkOrDivProps) {
  if (isPrivate) {
    return (
      <div className={className}>
        {children}
        <div className="flex items-center justify-between gap-3 px-3 py-4 md:px-6 md:py-6">
          {actionLinks}
        </div>
      </div>
    );
  }
  return (
    <Link
      className={className}
      href={sanitizedLink}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <div className="flex items-center justify-between gap-3 px-3 py-4 md:px-6 md:py-6">
        {actionLinks}
      </div>
    </Link>
  );
}
