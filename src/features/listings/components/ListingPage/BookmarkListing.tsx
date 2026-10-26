'use client';

import { Bookmark } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { posthog } from 'posthog-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

interface Props {
  id: string;
  isTemplate?: boolean;
  // From the server: how many have bookmarked it, and whether the viewer has.
  initialCount: number;
  initialBookmarked: boolean;
}

const toggleBookmark = async (id: string): Promise<void> => {
  await postJson('/api/listings/bookmark/toggle/', { listingId: id });
};

const PENDING_BOOKMARK_INTENT_KEY = 'listing-bookmark-pending-intent';

// The bookmark a signed-out visitor tapped for, kept across sign-in.
const storedIntent = (listingId: string): boolean | undefined => {
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(PENDING_BOOKMARK_INTENT_KEY) ?? 'null',
    );
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'listingId' in parsed &&
      'desiredState' in parsed &&
      parsed.listingId === listingId &&
      typeof parsed.desiredState === 'boolean'
    ) {
      return parsed.desiredState;
    }
  } catch {
    window.sessionStorage.removeItem(PENDING_BOOKMARK_INTENT_KEY);
  }
  return undefined;
};

const storeIntent = (listingId: string, desiredState: boolean): void => {
  window.sessionStorage.setItem(
    PENDING_BOOKMARK_INTENT_KEY,
    JSON.stringify({ listingId, desiredState }),
  );
};

const clearIntent = (listingId: string): void => {
  if (storedIntent(listingId) !== undefined) {
    window.sessionStorage.removeItem(PENDING_BOOKMARK_INTENT_KEY);
  }
};

export const BookmarkListing = ({
  id,
  isTemplate = false,
  initialCount,
  initialBookmarked,
}: Props) => {
  const viewer = useViewer();

  const [actualIsBookmarked, setActualIsBookmarked] =
    useState(initialBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialCount);
  const [optimisticIsBookmarked, setOptimisticIsBookmarked] = useState<
    boolean | undefined
  >(undefined);
  const intentHandled = useRef(false);

  const mutateBookmark = useCallback(
    async (current: boolean) => {
      const newBookmarkState = !current;
      setOptimisticIsBookmarked(newBookmarkState);
      try {
        await toggleBookmark(id);
        setActualIsBookmarked(newBookmarkState);
        setBookmarkCount((count) => count + (newBookmarkState ? 1 : -1));
        toast.success(newBookmarkState ? 'Bookmarked' : 'Bookmark removed');
      } catch {
        toast.error('Error occurred while updating bookmark');
      } finally {
        setOptimisticIsBookmarked(undefined);
      }
    },
    [id],
  );

  const avatars = [
    { name: 'Abhishek', src: `${ASSET_URL}/pfps/t1.webp` },
    { name: 'Pratik', src: `${ASSET_URL}/pfps/md2.webp` },
    { name: 'Yash', src: `${ASSET_URL}/pfps/fff1.webp` },
  ];

  const handleToggleBookmark = (): void => {
    clearIntent(id);
    void mutateBookmark(actualIsBookmarked);
  };
  // Signed out, a tap remembers the intent; back signed in (this page
  // loads again), it's carried out once, unless already done.
  useEffect(() => {
    if (intentHandled.current || !viewer?.id) return;
    const intent = storedIntent(id);
    if (intent === undefined) return;
    intentHandled.current = true;
    clearIntent(id);
    // Carries out an intent kept in sessionStorage (outside React) with a
    // request; the optimistic state it sets is the point.
    // oxlint-disable-next-line react/set-state-in-effect
    if (intent !== initialBookmarked) void mutateBookmark(initialBookmarked);
  }, [id, initialBookmarked, mutateBookmark, viewer?.id]);

  const isBookmarked =
    optimisticIsBookmarked !== undefined
      ? optimisticIsBookmarked
      : actualIsBookmarked;

  const baseDisplayCount = bookmarkCount + 1;
  const optimisticDelta =
    optimisticIsBookmarked !== undefined
      ? optimisticIsBookmarked && !actualIsBookmarked
        ? 1
        : !optimisticIsBookmarked && actualIsBookmarked
          ? -1
          : 0
      : 0;

  const displayCount = baseDisplayCount + optimisticDelta;

  const avatarCount = Math.min(displayCount, avatars.length);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.p
          key={displayCount}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-slate-500"
        >
          {displayCount}
        </motion.p>
      </AnimatePresence>
      <div className="flex -space-x-3">
        <AnimatePresence>
          {avatars.slice(0, avatarCount).map((avatar) => (
            <motion.div
              key={avatar.name}
              initial={{ opacity: 0, scale: 0.8, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -8 }}
              transition={{
                delay: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <Avatar className="h-6 w-6 border-2 border-white md:h-8 md:w-8">
                <AvatarImage src={avatar.src} alt={avatar.name || ''} />
                <AvatarFallback>{avatar.name}</AvatarFallback>
              </Avatar>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-start">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText="Please complete your profile before bookmarking a listing."
          onClick={() => storeIntent(id, true)}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            <Button
              className={cn(
                'ph-no-capture gap-2 border-slate-300 text-[0.9rem] font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-500',
                'h-8 w-auto p-0 px-2 sm:h-10 sm:px-3',
              )}
              variant="outline"
              disabled={isTemplate}
              onClick={() => {
                posthog.capture(
                  isBookmarked ? 'remove bookmark_listing' : 'bookmark_listing',
                );
                handleToggleBookmark();
              }}
              aria-label="Bookmark"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isBookmarked ? 'bookmarked' : 'bookmark'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {isBookmarked ? (
                      <Bookmark fill="#90A1B9" className="text-slate-400" />
                    ) : (
                      <Bookmark />
                    )}
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="hidden md:block"
                  >
                    {isBookmarked ? (
                      <span className="text-slate-500">Bookmarked</span>
                    ) : (
                      <span>Bookmark</span>
                    )}
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </Button>
          </motion.div>
        </AuthWrapper>
      </div>
    </div>
  );
};
