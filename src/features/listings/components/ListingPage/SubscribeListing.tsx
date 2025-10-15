import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { toast } from 'sonner';

import TbBell from '@/components/icons/TbBell';
import TbBellRinging from '@/components/icons/TbBellRinging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { api } from '@/lib/api';
import { useSubscribeIntent } from '@/store/subscribeIntent';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

import { listingSubscriptionsQuery } from '../../queries/listing-notification-status';

interface Props {
  id: string;
  isTemplate?: boolean;
}

const toggleSubscription = async (id: string) => {
  await api.post('/api/listings/notifications/toggle', { bountyId: id });
};

export const SubscribeListing = ({ id, isTemplate = false }: Props) => {
  const { user } = useUser();
  const { pendingListingId, setIntent } = useSubscribeIntent();
  const queryClient = useQueryClient();

  const { data: sub = [] } = useQuery(listingSubscriptionsQuery(id));

  const { mutate: toggleSubscribe, isPending: isSubscribeLoading } =
    useMutation({
      mutationFn: () => toggleSubscription(id),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: listingSubscriptionsQuery(id).queryKey,
        });
        toast.success(
          sub.find((e) => e.userId === user?.id)
            ? 'Unsubscribed'
            : 'Subscribed',
        );
        setIntent(null); // clear intent after success
      },
      onError: () => {
        toast.error('Error occurred while toggling subscription');
      },
    });

  const avatars = [
    { name: 'Abhishek', src: ASSET_URL + '/pfps/t1.webp' },
    { name: 'Pratik', src: ASSET_URL + '/pfps/md2.webp' },
    { name: 'Yash', src: ASSET_URL + '/pfps/fff1.webp' },
  ];

  const handleToggleSubscribe = () => {
    if (!user) {
      setIntent(id); // remember action before login
      return;
    }
    toggleSubscribe();
  };

  // After login, check if there was a pending intent and auto-trigger it
  useEffect(() => {
    if (user && pendingListingId === id) {
      toggleSubscribe();
    }
  }, [user, pendingListingId, id, toggleSubscribe]);

  const isSubscribed = sub.find((e) => e.userId === user?.id);

  return (
    <div className="flex items-center gap-2">
      <p className="text-slate-500">{sub.length + 1}</p>
      <div className="flex -space-x-3">
        {avatars.slice(0, sub.length + 1).map((avatar, index) => (
          <Avatar
            key={index}
            className="h-6 w-6 border-2 border-white md:h-8 md:w-8"
          >
            <AvatarImage src={avatar.src} alt={avatar.name || ''} />
            <AvatarFallback>{avatar.name}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-start">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before subscribing to a listing.'
          }
        >
          <Button
            className={cn(
              'ph-no-capture hover:bg-brand-purple gap-2 border-slate-300 font-medium text-slate-400 hover:text-white',
              'h-8 w-auto p-0 px-2 sm:h-10 sm:px-3',
            )}
            variant="outline"
            disabled={isTemplate}
            onClick={() => {
              posthog.capture(
                isSubscribed ? 'unnotify me_listing' : 'notify me_listing',
              );
              handleToggleSubscribe();
            }}
            aria-label="Notify"
          >
            {isSubscribeLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isSubscribed ? (
              <TbBellRinging />
            ) : (
              <TbBell />
            )}
            <span className="hidden md:block">
              {isSubscribeLoading ? (
                <span>Subscribing</span>
              ) : isSubscribed ? (
                <span>Subscribed</span>
              ) : (
                <span>Subscribe</span>
              )}
            </span>
          </Button>
        </AuthWrapper>
      </div>
    </div>
  );
};
