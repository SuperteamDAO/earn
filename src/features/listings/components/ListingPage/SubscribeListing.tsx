import {
  Avatar,
  AvatarGroup,
  Button,
  HStack,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import type { SubscribeBounty } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'react-hot-toast';
import { TbBell, TbBellRinging } from 'react-icons/tb';

import { AuthWrapper } from '@/features/auth';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';

import { WarningModal } from '../WarningModal';

interface Props {
  id: string;
}

const fetchSubscriptions = async (id: string) => {
  const { data } = await axios.get('/api/listings/notifications/status', {
    params: { listingId: id },
  });
  return data;
};

const toggleSubscription = async (id: string) => {
  await axios.post('/api/listings/notifications/toggle', { bountyId: id });
};

export const SubscribeListing = ({ id }: Props) => {
  const { user } = useUser();
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();

  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  const { data: sub = [] } = useQuery<
    (SubscribeBounty & { User: User | null })[]
  >({
    queryKey: ['subscriptions', id],
    queryFn: () => fetchSubscriptions(id),
  });

  const { mutate: toggleSubscribe, isPending: isSubscribeLoading } =
    useMutation({
      mutationFn: () => toggleSubscription(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subscriptions', id] });
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
    { name: 'Abhishkek', src: '/assets/pfps/t1.png' },
    { name: 'Pratik', src: '/assets/pfps/md2.png' },
    { name: 'Yash', src: '/assets/pfps/fff1.png' },
  ];

  const handleToggleSubscribe = () => {
    if (!isAuthenticated || !user?.isTalentFilled) {
      if (!user?.isTalentFilled) {
        warningOnOpen();
      }
      return;
    }
    toggleSubscribe();
  };
  return (
    <>
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
          <AuthWrapper>
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

      {warningIsOpen && (
        <WarningModal
          onCTAClick={() => posthog.capture('complete profile_CTA pop up')}
          isOpen={warningIsOpen}
          onClose={warningOnClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before submitting to a bounty.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
    </>
  );
};
