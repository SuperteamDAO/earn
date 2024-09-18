import {
  Avatar,
  AvatarGroup,
  Button,
  HStack,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { TbBell, TbBellRinging } from 'react-icons/tb';
import { toast } from 'sonner';

import { AuthWrapper } from '@/features/auth';
import { useUser } from '@/store/user';

import { listingSubscriptionsQuery } from '../../queries/listing-notification-status';

interface Props {
  id: string;
  isTemplate?: boolean;
}

const toggleSubscription = async (id: string) => {
  await axios.post('/api/listings/notifications/toggle', { bountyId: id });
};

export const SubscribeListing = ({ id, isTemplate = false }: Props) => {
  const { user } = useUser();
  const posthog = usePostHog();
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
      },
      onError: () => {
        toast.error('Error occurred while toggling subscription');
      },
    });

  const avatars = [
    { name: 'Abhishkek', src: '/assets/pfps/t1.webp' },
    { name: 'Pratik', src: '/assets/pfps/md2.webp' },
    { name: 'Yash', src: '/assets/pfps/fff1.webp' },
  ];

  const handleToggleSubscribe = () => {
    toggleSubscribe();
  };
  return (
    <HStack>
      <Text color="brand.slate.500">{sub.length + 1}</Text>
      <HStack>
        <AvatarGroup max={3} size={{ base: 'xs', md: 'sm' }}>
          {avatars.slice(0, sub.length + 1).map((avatar, index) => (
            <Avatar
              key={index}
              pos="relative"
              name={avatar.name}
              src={avatar.src}
            />
          ))}
        </AvatarGroup>
      </HStack>
      <HStack align="start">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before subscribing to a listing.'
          }
        >
          <Button
            className="ph-no-capture"
            gap={2}
            w={{ base: 2, md: 'auto' }}
            p={0}
            px={{ md: 4 }}
            color={'brand.slate.500'}
            fontWeight={500}
            borderColor="brand.slate.300"
            aria-label="Notify"
            isDisabled={isTemplate}
            onClick={() => {
              posthog.capture(
                sub.find((e) => e.userId === user?.id)
                  ? 'unnotify me_listing'
                  : 'notify me_listing',
              );
              handleToggleSubscribe();
            }}
            variant="outline"
          >
            {isSubscribeLoading ? (
              <Spinner color="white" size="sm" />
            ) : sub.find((e) => e.userId === user?.id) ? (
              <TbBellRinging />
            ) : (
              <TbBell />
            )}
            <Text display={{ base: 'none', md: 'inline' }}>
              {isSubscribeLoading
                ? 'Subscribing'
                : sub.find((e) => e.userId === user?.id)
                  ? 'Subscribed'
                  : 'Subscribe'}
            </Text>
          </Button>
        </AuthWrapper>
      </HStack>
    </HStack>
  );
};
