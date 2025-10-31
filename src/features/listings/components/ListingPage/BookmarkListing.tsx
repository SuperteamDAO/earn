import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

import { listingBookmarksQuery } from '../../queries/listing-notification-status';

interface Props {
  id: string;
  isTemplate?: boolean;
}

const toggleBookmark = async (id: string): Promise<void> => {
  await api.post('/api/listings/notifications/toggle', { bountyId: id });
};
export const BookmarkListing = ({ id, isTemplate = false }: Props) => {
  const { user } = useUser();

  const queryClient = useQueryClient();

  const { data: bookmarks = [] } = useQuery(listingBookmarksQuery(id));

  const actualIsBookmarked = !!bookmarks.find(
    (entry) => entry.userId === user?.id,
  );
  const [optimisticIsBookmarked, setOptimisticIsBookmarked] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    if (
      optimisticIsBookmarked !== undefined &&
      actualIsBookmarked === optimisticIsBookmarked
    ) {
      setOptimisticIsBookmarked(undefined);
    }
  }, [actualIsBookmarked, optimisticIsBookmarked]);

  const { mutate: mutateBookmark } = useMutation({
    mutationFn: () => toggleBookmark(id),
    onMutate: () => {
      const newBookmarkState = !actualIsBookmarked;
      setOptimisticIsBookmarked(newBookmarkState);
      return { newBookmarkState };
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: listingBookmarksQuery(id).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: ['your-bookmarks'],
      });
      queryClient.invalidateQueries({
        queryKey: ['listings', 'bookmarks'],
      });
      toast.success(
        context?.newBookmarkState ? 'Bookmarked' : 'Bookmark removed',
      );
    },
    onError: () => {
      setOptimisticIsBookmarked(undefined);
      toast.error('Error occurred while updating bookmark');
    },
  });

  const avatars = [
    { name: 'Abhishek', src: `${ASSET_URL}/pfps/t1.webp` },
    { name: 'Pratik', src: `${ASSET_URL}/pfps/md2.webp` },
    { name: 'Yash', src: `${ASSET_URL}/pfps/fff1.webp` },
  ];

  const handleToggleBookmark = (): void => {
    mutateBookmark();
  };

  const isBookmarked =
    optimisticIsBookmarked !== undefined
      ? optimisticIsBookmarked
      : actualIsBookmarked;

  const displayCount =
    bookmarks.length +
    1 +
    (optimisticIsBookmarked !== undefined
      ? optimisticIsBookmarked && !actualIsBookmarked
        ? 1
        : !optimisticIsBookmarked && actualIsBookmarked
          ? -1
          : 0
      : 0);

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
