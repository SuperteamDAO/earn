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
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { TbBell, TbBellRinging } from 'react-icons/tb';

import { AuthWrapper } from '@/features/auth';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';

import { WarningModal } from '../WarningModal';

interface Props {
  id: string;
  // sub: (SubscribeBounty & { User: User | null })[],
  // setSub: Dispatch<SetStateAction<(SubscribeBounty & { User: User | null })[]>>,
  // setUpdate: Dispatch<SetStateAction<boolean>>
}
export const SubscribeListing = ({ id }: Props) => {
  const { user } = useUser();

  const posthog = usePostHog();
  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
  const [update, setUpdate] = useState<boolean>(false);
  const [sub, setSub] = useState<(SubscribeBounty & { User: User | null })[]>(
    [],
  );

  const avatars = [
    {
      name: 'Abhishkek',
      src: '/assets/pfps/t1.png',
    },
    {
      name: 'Pratik',
      src: '/assets/pfps/md2.png',
    },
    {
      name: 'Yash',
      src: '/assets/pfps/fff1.png',
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.post(
          '/api/listings/notifications/status',
          {
            listingId: id,
          },
        );
        setSub(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, [update, id]);

  const { status: authStatus } = useSession();

  const isAuthenticated = authStatus === 'authenticated';
  const handleToggleSubscribe = async () => {
    if (!isAuthenticated || !user?.isTalentFilled) return;

    if (!user?.isTalentFilled) {
      warningOnOpen();
      return;
    }

    setIsSubscribeLoading(true);
    try {
      await axios.post('/api/listings/notifications/toggle', { bountyId: id });
      setUpdate((prev) => !prev);
      toast.success(
        sub.find((e) => e.userId === user?.id) ? 'Unsubscribed' : 'Subscribed',
      );
    } catch (error) {
      console.log(error);
      toast.error('Error occurred while toggling subscription');
    } finally {
      setIsSubscribeLoading(false);
    }
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
              color={'brand.slate.500'}
              fontWeight={500}
              borderColor="brand.slate.300"
              aria-label="Notify"
              leftIcon={
                isSubscribeLoading ? (
                  <Spinner color="white" size="sm" />
                ) : sub.find((e) => e.userId === user?.id) ? (
                  <TbBellRinging />
                ) : (
                  <TbBell />
                )
              }
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
              {isSubscribeLoading
                ? 'Subscribing'
                : sub.find((e) => e.userId === user?.id)
                  ? 'Subscribed'
                  : 'Subscribe'}
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
